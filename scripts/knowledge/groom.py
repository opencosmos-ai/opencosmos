#!/usr/bin/env python3
"""
groom.py — Knowledge base formatting tool for OpenCosmos.

Prepares raw text files for publication by applying markdown structure
without altering any original content. All text transformations happen
in-process (read file -> transform -> write file) to avoid API content
filtering issues that occur when passing religious/philosophical text
through LLM tool calls.

Usage:
    python3 scripts/knowledge/groom.py                          # Process all files in knowledge/incoming/
    python3 scripts/knowledge/groom.py path/to/file             # Process a specific file
    python3 scripts/knowledge/groom.py --dry-run                # Report what would be done
    python3 scripts/knowledge/groom.py --report                 # Show status of all files
    python3 scripts/knowledge/groom.py --force                  # Reprocess already-formatted files
    python3 scripts/knowledge/groom.py --force path/to/file     # Force-reprocess a specific file
"""

import os
import re
import sys
import argparse
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def collapse_blanks(text: str) -> str:
    """Collapse 3+ consecutive blank lines to 1."""
    return re.sub(r'\n{3,}', '\n\n', text)


def bold_speakers(text: str) -> str:
    """Bold speaker names at start of lines: SPEAKER: -> **SPEAKER:**
    Only matches 2+ uppercase letter names not already bolded."""
    return re.sub(
        r'^(?<!\*\*)([A-Z][A-Z .]+):(?!\*)',
        r'**\1:**',
        text,
        flags=re.MULTILINE
    )


def unwrap_hard_lines(text: str) -> str:
    """Unwrap hard-wrapped lines into flowing paragraphs.

    Preserves:
    - Blank lines (paragraph breaks)
    - Lines starting with # (headings)
    - Indented lines (spaces/tabs)
    - Lines matching separator patterns (* * * etc.)
    - Lines starting with > (blockquotes)
    - Lines starting with ** (bold speaker names)
    - Lines starting with [ (footnotes/references)
    - Lines starting with * (italic attribution)
    """
    lines = text.split('\n')
    result = []
    paragraph = []

    def flush():
        if paragraph:
            result.append(' '.join(paragraph))
            paragraph.clear()

    for line in lines:
        stripped = line.rstrip()

        # Blank line = paragraph break
        if stripped.strip() == '':
            flush()
            result.append('')
            continue

        # Preserve these line types as-is
        if (stripped.startswith('#') or
                stripped.startswith(' ') or
                stripped.startswith('\t') or
                stripped.startswith('>') or
                stripped.startswith('**') or
                stripped.startswith('[') or
                stripped.startswith('*') or
                re.match(r'^\s*\*\s+\*\s+\*', stripped)):
            flush()
            result.append(stripped)
            continue

        # Regular text: accumulate into paragraph
        paragraph.append(stripped)

    flush()
    return '\n'.join(result)


def strip_gutenberg_end(text: str) -> str:
    """Strip Project Gutenberg boilerplate from the end of text."""
    markers = [
        'End of the Project Gutenberg',
        'End of Project Gutenberg',
        '***END OF THE PROJECT GUTENBERG',
        '*** END OF THE PROJECT GUTENBERG',
        '*** END OF THIS PROJECT GUTENBERG',
        'THE END.',
        "Transcriber's Note",
    ]
    best_pos = len(text)
    for marker in markers:
        pos = text.find(marker)
        if pos != -1 and pos < best_pos:
            best_pos = pos
    if best_pos < len(text):
        text = text[:best_pos].rstrip()
    return text


def find_intro_start(text: str) -> Optional[int]:
    """Find the char index of the actual INTRODUCTION header (not in a Contents section).

    The real header is followed by substantial paragraph text (>50 chars)
    within 1-3 lines, distinguishing it from a Contents table entry.
    """
    pattern = r'^-?\s*INTRODUCTION(?:\s+AND\s+ANALYSIS)?\.?\s*$'
    matches = list(re.finditer(pattern, text, re.MULTILINE))
    if not matches:
        return None
    # Work backwards: the last match with substantive text after it is the real one
    for match in reversed(matches):
        after = text[match.end():match.end() + 1000]
        for line in after.split('\n')[1:5]:
            if line.strip() and len(line.strip()) > 50:
                return match.start()
    return matches[-1].start()


def to_title_case(s: str) -> str:
    """Convert ALL CAPS to Title Case, handling small words."""
    small_words = {'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for',
                   'yet', 'so', 'in', 'on', 'at', 'to', 'by', 'of', 'up'}
    words = s.strip().split()
    result = []
    for i, word in enumerate(words):
        lower = word.lower()
        if i == 0 or lower not in small_words:
            result.append(word.capitalize())
        else:
            result.append(lower)
    return ' '.join(result)


def is_already_formatted(text: str) -> bool:
    """Check if a file is already formatted (first non-blank line starts with '# ')."""
    for line in text.split('\n'):
        if line.strip():
            return line.startswith('# ')
    return False


def has_yaml_frontmatter(text: str) -> bool:
    """Check if text starts with YAML frontmatter (---)."""
    return text.lstrip().startswith('---')


def preserve_frontmatter(text: str):
    """Split text into (frontmatter, body) if YAML frontmatter exists.
    Returns (None, text) if no frontmatter."""
    if not has_yaml_frontmatter(text):
        return None, text
    stripped = text.lstrip()
    # Find end of frontmatter (second ---)
    second = stripped.find('---', 3)
    if second == -1:
        return None, text
    end = stripped.find('\n', second)
    if end == -1:
        end = len(stripped)
    frontmatter = stripped[:end + 1]
    body = stripped[end + 1:]
    return frontmatter, body


# ---------------------------------------------------------------------------
# Content type processors
# ---------------------------------------------------------------------------

def process_dialogue(text: str, title: str, has_sections: bool = False,
                     extra_sections: Optional[Dict[str, str]] = None) -> str:
    """Process a standard Plato/Jowett dialogue.

    Args:
        text: Raw file content
        title: The dialogue title in Title Case (e.g., "Euthyphro")
        has_sections: If True, convert section markers like "Section 1." to ### headers
        extra_sections: Dict of additional section patterns to convert
    """
    # Strip Gutenberg end matter
    text = strip_gutenberg_end(text)

    # Find the Introduction
    intro_pos = find_intro_start(text)
    if intro_pos is None:
        # No introduction found; just do basic formatting
        header = f'# {title}\n\n*By Plato*\n\n*Translated by Benjamin Jowett*\n\n'
        text = bold_speakers(text)
        text = collapse_blanks(text)
        return header + text

    # Everything before INTRODUCTION is metadata/TOC - discard
    body = text[intro_pos:]

    # Convert INTRODUCTION header
    body = re.sub(
        r'^-?\s*INTRODUCTION(?:\s+AND\s+ANALYSIS)?\.?\s*$',
        '## Introduction',
        body,
        count=1,
        flags=re.MULTILINE
    )

    # Convert the dialogue title after introduction
    # (appears as the title in ALL CAPS marking the start of the actual dialogue)
    title_upper = title.upper()
    body = re.sub(
        rf'^{re.escape(title_upper)}\.?\s*$',
        f'## {title}',
        body,
        count=1,
        flags=re.MULTILINE
    )

    # Handle section markers if present (Timaeus, etc.)
    if has_sections:
        body = re.sub(
            r'^Section (\d+)\.\s*$',
            r'### Section \1',
            body,
            flags=re.MULTILINE
        )

    # Handle extra sections if provided
    if extra_sections:
        for pattern, replacement in extra_sections.items():
            body = re.sub(pattern, replacement, body, flags=re.MULTILINE)

    # Bold speaker names
    body = bold_speakers(body)

    # Collapse blank lines
    body = collapse_blanks(body)

    # Build final output
    header = f'# {title}\n\n*By Plato*\n\n*Translated by Benjamin Jowett*\n\n'
    return header + body.strip() + '\n'


def process_laws(text: str) -> str:
    """Process Plato's Laws — has INTRODUCTION AND ANALYSIS, EXCURSUS, and BOOK I-XII."""
    text = strip_gutenberg_end(text)

    intro_pos = find_intro_start(text)
    if intro_pos is None:
        body = text
    else:
        body = text[intro_pos:]

    # Convert INTRODUCTION AND ANALYSIS
    body = re.sub(
        r'^-?\s*INTRODUCTION AND ANALYSIS\.?\s*$',
        '## Introduction and Analysis',
        body,
        count=1,
        flags=re.MULTILINE
    )

    # Convert EXCURSUS ON THE from intro
    body = re.sub(
        r'^EXCURSUS ON THE (.*?)$',
        r'### Excursus on the \1',
        body,
        flags=re.MULTILINE
    )

    # Convert BOOK headers (BOOK I through BOOK XII)
    roman_map = {
        'I': 'I', 'II': 'II', 'III': 'III', 'IV': 'IV', 'V': 'V',
        'VI': 'VI', 'VII': 'VII', 'VIII': 'VIII', 'IX': 'IX', 'X': 'X',
        'XI': 'XI', 'XII': 'XII'
    }
    for roman in roman_map:
        body = re.sub(
            rf'^BOOK {roman}\.?\s*$',
            f'## Book {roman}',
            body,
            flags=re.MULTILINE
        )

    # Remove redundant title repetitions
    body = re.sub(r'^THE LAWS\.?\s*$', '', body, flags=re.MULTILINE)
    body = re.sub(r'^LAWS\.?\s*$', '', body, flags=re.MULTILINE)

    # Bold speaker names
    body = bold_speakers(body)

    # Collapse blank lines
    body = collapse_blanks(body)

    header = '# The Laws\n\n*By Plato*\n\n*Translated by Benjamin Jowett*\n\n'
    return header + body.strip() + '\n'


def process_republic(text: str) -> str:
    """Process Plato's Republic — extensive Gutenberg scholarly apparatus."""
    # Strip Gutenberg end matter
    text = strip_gutenberg_end(text)

    # Strip publisher title page (everything before PREFACE)
    preface_match = re.search(r'^PREFACE\.?\s*$', text, re.MULTILINE)
    if preface_match:
        text = text[preface_match.start():]

    # Convert PREFACE
    text = re.sub(r'^PREFACE\.?\s*$', '## Preface', text, count=1, flags=re.MULTILINE)

    # Convert INTRODUCTION AND ANALYSIS
    text = re.sub(
        r'^INTRODUCTION AND ANALYSIS\.?\s*$',
        '## Introduction and Analysis',
        text,
        count=1,
        flags=re.MULTILINE
    )

    # Remove redundant THE REPUBLIC title
    text = re.sub(r'^THE REPUBLIC\.?\s*$', '', text, flags=re.MULTILINE)

    # Convert BOOK headers
    roman_numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
    for roman in roman_numerals:
        text = re.sub(
            rf'^BOOK {roman}\.?\s*$',
            f'## Book {roman}',
            text,
            flags=re.MULTILINE
        )

    # Remove [Sidenote: ...] and [Sidenote; ...] markers
    text = re.sub(r'\[Sidenote[:;][^\]]*\]', '', text)

    # Convert Stephanus numbers *NNN* or *NNNA* -> [NNN] or [NNNA]
    text = re.sub(r'\*(\d{3}[A-E]?)\*', r'[\1]', text)

    # Remove page markers {NNN} and {roman}
    text = re.sub(r'\{[ivxlcdm\d]+\}', '', text, flags=re.IGNORECASE)

    # Remove known malformed page markers
    text = text.replace('ccxxxi}', '')
    text = text.replace('(308}', '')

    # Preserve [Footnote N: ...] markers (Jowett's scholarly notes)
    # (no action needed - they're already in a good format)

    # Bold speaker names
    text = bold_speakers(text)

    # Collapse blank lines
    text = collapse_blanks(text)

    # Unwrap hard-wrapped lines
    text = unwrap_hard_lines(text)

    header = '# The Republic\n\n*By Plato*\n\n*Translated by Benjamin Jowett*\n\n'
    return header + text.strip() + '\n'


def process_heart_sutra(text: str) -> str:
    """Process the Heart Sutra — sacred/canonical text."""
    text = strip_gutenberg_end(text)

    # Strip any leading metadata
    lines = text.split('\n')
    content_lines = []
    found_start = False
    for line in lines:
        stripped = line.strip()
        if not found_start:
            # Skip blank lines and metadata at the top
            if stripped and not stripped.startswith('The Project Gutenberg'):
                found_start = True
                content_lines.append(line)
        else:
            content_lines.append(line)

    body = '\n'.join(content_lines)
    body = collapse_blanks(body)

    # Remove any title lines that exist and rebuild
    body = re.sub(r'^THE HEART SUTRA\.?\s*$', '', body, flags=re.MULTILINE | re.IGNORECASE)
    body = re.sub(r'^HEART SUTRA\.?\s*$', '', body, flags=re.MULTILINE | re.IGNORECASE)

    body = collapse_blanks(body)

    header = '# The Heart Sutra\n\n'
    return header + body.strip() + '\n'


def process_tao_te_ching(text: str) -> str:
    """Process the Tao Te Ching — scripture with chapter divisions."""
    text = strip_gutenberg_end(text)

    # Strip leading metadata/TOC up to the first content section
    # Look for "Lao Tsu and Taoism" or first chapter marker
    lao_match = re.search(r'^LAO TSU AND TAOISM\.?\s*$', text, re.MULTILINE)
    if lao_match:
        text = text[lao_match.start():]
        text = re.sub(r'^LAO TSU AND TAOISM\.?\s*$', '## Lao Tsu and Taoism', text,
                       count=1, flags=re.MULTILINE)

    # Convert ALL-CAPS chapter numbers to ## Title Case
    number_words = [
        'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT',
        'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN',
        'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY',
        'TWENTY-ONE', 'TWENTY-TWO', 'TWENTY-THREE', 'TWENTY-FOUR',
        'TWENTY-FIVE', 'TWENTY-SIX', 'TWENTY-SEVEN', 'TWENTY-EIGHT',
        'TWENTY-NINE', 'THIRTY', 'THIRTY-ONE', 'THIRTY-TWO', 'THIRTY-THREE',
        'THIRTY-FOUR', 'THIRTY-FIVE', 'THIRTY-SIX', 'THIRTY-SEVEN',
        'THIRTY-EIGHT', 'THIRTY-NINE', 'FORTY', 'FORTY-ONE', 'FORTY-TWO',
        'FORTY-THREE', 'FORTY-FOUR', 'FORTY-FIVE', 'FORTY-SIX', 'FORTY-SEVEN',
        'FORTY-EIGHT', 'FORTY-NINE', 'FIFTY', 'FIFTY-ONE', 'FIFTY-TWO',
        'FIFTY-THREE', 'FIFTY-FOUR', 'FIFTY-FIVE', 'FIFTY-SIX', 'FIFTY-SEVEN',
        'FIFTY-EIGHT', 'FIFTY-NINE', 'SIXTY', 'SIXTY-ONE', 'SIXTY-TWO',
        'SIXTY-THREE', 'SIXTY-FOUR', 'SIXTY-FIVE', 'SIXTY-SIX', 'SIXTY-SEVEN',
        'SIXTY-EIGHT', 'SIXTY-NINE', 'SEVENTY', 'SEVENTY-ONE', 'SEVENTY-TWO',
        'SEVENTY-THREE', 'SEVENTY-FOUR', 'SEVENTY-FIVE', 'SEVENTY-SIX',
        'SEVENTY-SEVEN', 'SEVENTY-EIGHT', 'SEVENTY-NINE', 'EIGHTY',
        'EIGHTY-ONE'
    ]
    for word in number_words:
        title_word = word.replace('-', '-').title()
        text = re.sub(
            rf'^{word}\.?\s*$',
            f'## {title_word}',
            text,
            flags=re.MULTILINE
        )

    text = collapse_blanks(text)

    header = '# Tao Te Ching\n\n*By Lao Tsu*\n\n*Translated by Gia-Fu Feng and Jane English*\n\n'
    return header + text.strip() + '\n'


def process_poetry(text: str, title: str, author: str) -> str:
    """Process a poetry collection.

    Preserves line breaks and indentation exactly.
    Converts structural markers (BOOK, poem titles) to markdown headers.
    """
    text = strip_gutenberg_end(text)

    # Strip leading Gutenberg metadata
    # Look for the actual content start (after title/author/TOC)
    lines = text.split('\n')
    content_start = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('BOOK ') or line.strip() == 'INSCRIPTIONS':
            content_start = i
            break

    body = '\n'.join(lines[content_start:])

    # Convert BOOK headers
    body = re.sub(
        r'^BOOK ([IVXLC]+)\b.*$',
        lambda m: f'## Book {m.group(1)}',
        body,
        flags=re.MULTILINE
    )

    # Convert section headers (INSCRIPTIONS, etc.)
    body = re.sub(
        r'^([A-Z][A-Z ]{3,})$',
        lambda m: f'### {to_title_case(m.group(1))}' if len(m.group(1).strip()) < 50 else m.group(0),
        body,
        flags=re.MULTILINE
    )

    body = collapse_blanks(body)

    header = f'# {title}\n\n*By {author}*\n\n'
    return header + body.strip() + '\n'


def process_scientific(text: str, title: str, author: Optional[str] = None) -> str:
    """Process scientific/encyclopedia articles."""
    text = strip_gutenberg_end(text)

    # Join broken lines from PDF column wrapping
    # (lines ending mid-sentence that continue on the next line without indent)
    text = unwrap_hard_lines(text)

    # Convert ALL-CAPS section headers to ## Title Case
    text = re.sub(
        r'^([A-Z][A-Z ]{5,})$',
        lambda m: f'## {to_title_case(m.group(1))}',
        text,
        flags=re.MULTILINE
    )

    text = collapse_blanks(text)

    header = f'# {title}\n'
    if author:
        header += f'\n*By {author}*\n'
    header += '\n'
    return header + text.strip() + '\n'


def process_prophet(text: str) -> str:
    """Process The Prophet by Kahlil Gibran.

    Handles:
    - Gutenberg metadata stripping
    - [Illustration] marker removal
    - Hard line-wrap unwrapping (original uses ~40-char hard wraps)
    - CONTENTS section removal
    - Bibliography/appendix removal
    """
    text = strip_gutenberg_end(text)

    # Remove [Illustration] and [Illustration: ...] markers
    text = re.sub(r'\[Illustration[^\]]*\]', '', text)

    # Remove CONTENTS section
    contents_match = re.search(r'^CONTENTS\s*$', text, re.MULTILINE)
    if contents_match:
        # Find where contents ends (next substantial section)
        after_contents = text[contents_match.start():]
        lines = after_contents.split('\n')
        end_idx = 0
        in_contents = True
        for i, line in enumerate(lines[1:], 1):  # skip CONTENTS line itself
            stripped = line.strip()
            # Contents entries are short, often just titles
            # The actual text starts when we hit the first substantive paragraph
            if in_contents and stripped and not stripped.isupper() and len(stripped) > 60:
                end_idx = i
                break
            if stripped.isupper() and len(stripped) > 3 and i > 2:
                # This might be the first chapter heading after TOC
                end_idx = i
                break
        if end_idx > 0:
            text = text[:contents_match.start()] + '\n'.join(lines[end_idx:])

    # Remove Bibliography/appendix sections at end
    bib_markers = ['BIBLIOGRAPHY', 'A BIBLIOGRAPHY', 'A SELECTED BIBLIOGRAPHY']
    for marker in bib_markers:
        pos = text.find(marker)
        if pos != -1:
            text = text[:pos].rstrip()

    # Strip leading Gutenberg metadata (title page, publisher info)
    # Find the actual text start — typically "THE COMING OF THE SHIP" or similar
    lines = text.split('\n')
    metadata_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip().upper()
        if 'THE COMING OF THE SHIP' in stripped or 'ALMUSTAFA' in stripped:
            metadata_end = i
            break

    if metadata_end > 0:
        text = '\n'.join(lines[metadata_end:])

    # Convert ALL-CAPS chapter titles to ### headers
    text = re.sub(
        r'^([A-Z][A-Z ]+(?:AND [A-Z ]+)?)$',
        lambda m: f'### {to_title_case(m.group(1))}' if 3 < len(m.group(1).strip()) < 60 else m.group(0),
        text,
        flags=re.MULTILINE
    )

    # Unwrap hard-wrapped lines
    text = unwrap_hard_lines(text)

    text = collapse_blanks(text)

    header = '# The Prophet\n\n*By Kahlil Gibran*\n\n'
    return header + text.strip() + '\n'


def process_scripture(text: str, title: str, author: Optional[str] = None,
                      translator: Optional[str] = None) -> str:
    """Generic scripture handler — chapter structure, no unwrapping (preserves verse).

    Handles:
    - CHAPTER I through CHAPTER XVIII (roman or arabic) → ## Chapter N
    - BOOK I, BOOK II → ## Book N
    - Speaker names (NAME:) → **NAME:**
    - "HERE ENDETH/ENDS CHAPTER N." colophons → removed
    - No line unwrapping — verse structure preserved
    """
    text = strip_gutenberg_end(text)

    # Remove colophon lines like "HERE ENDETH CHAPTER I. OF THE BHAGAVAD-GITA,"
    text = re.sub(r'^HERE END(?:ETH|S) CHAPTER.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)

    # Convert CHAPTER N (roman or arabic) → ## Chapter N
    text = re.sub(
        r'^CHAPTER ([IVXLCDM\d]+)\.?\s*$',
        lambda m: f'## Chapter {m.group(1)}',
        text,
        flags=re.MULTILINE
    )

    # Convert BOOK N (roman) → ## Book N
    roman_books = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
                   'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII']
    for roman in roman_books:
        text = re.sub(rf'^BOOK {roman}\.?\s*$', f'## Book {roman}', text, flags=re.MULTILINE)

    # Bold speaker names (Name: at line start)
    text = bold_speakers(text)

    text = collapse_blanks(text)

    header = f'# {title}\n'
    if author:
        header += f'\n*By {author}*\n'
    if translator:
        header += f'\n*{translator}*\n'
    header += '\n'
    return header + text.strip() + '\n'


def process_shakespeare(text: str) -> str:
    """Process The Complete Works of William Shakespeare.

    Handles:
    - TOC stripping (everything before first play content)
    - Play titles (long ALL-CAPS lines) → ## headers
    - ACT N → ## Act N
    - SCENE N. Description → ### Scene N. Description
    - Character names (SHORT ALL-CAPS + period at line start) → **NAME.**
    - No line unwrapping — verse must be preserved
    """
    text = strip_gutenberg_end(text)

    # Strip previously-added header so --force re-runs don't produce duplicates
    text = re.sub(
        r'^# The Complete Works of William Shakespeare\s*\n\s*\*By William Shakespeare\*\s*\n+',
        '',
        text
    )

    # Strip TOC — find start of actual content.
    # On a fresh run: second "THE SONNETS" marks the start of the sonnet sequence.
    # On a --force re-run: "THE SONNETS" has become "## The Sonnets" — find that instead.
    first_allcaps = text.find('THE SONNETS')
    first_header = text.find('## The Sonnets')
    if first_allcaps != -1:
        second = text.find('THE SONNETS', first_allcaps + 11)
        if second != -1:
            text = text[second:]
    elif first_header != -1:
        text = text[first_header:]

    # Convert known short section markers that don't meet the length threshold
    text = re.sub(r'^THE SONNETS\s*$', '## The Sonnets', text, flags=re.MULTILINE)
    text = re.sub(r'^AS YOU LIKE IT\s*$', '## As You Like It', text, flags=re.MULTILINE)
    text = re.sub(r'^CYMBELINE\s*$', '## Cymbeline', text, flags=re.MULTILINE)

    # Convert ACT markers
    text = re.sub(r'^ACT ([IVX]+)\.?\s*$', lambda m: f'## Act {m.group(1)}', text, flags=re.MULTILINE)

    # Convert SCENE markers (with optional description)
    text = re.sub(
        r'^SCENE ([IVX]+)\.?\s*(.*?)$',
        lambda m: f'### Scene {m.group(1)}' + (f'. {m.group(2).strip()}' if m.group(2).strip() else ''),
        text,
        flags=re.MULTILINE
    )

    # Play title lines: long ALL-CAPS (20+ chars), no trailing period → ## Title Case
    text = re.sub(
        r'^([A-Z][A-Z ,\'\-;:]{19,})$',
        lambda m: f'## {to_title_case(m.group(1))}' if not m.group(1).rstrip().endswith('.') else m.group(0),
        text,
        flags=re.MULTILINE
    )

    # Character names: short ALL-CAPS ending in period → **NAME.**
    text = re.sub(
        r'^([A-Z][A-Z ]{1,29})\.$',
        r'**\1.**',
        text,
        flags=re.MULTILINE
    )

    text = collapse_blanks(text)

    header = '# The Complete Works of William Shakespeare\n\n*By William Shakespeare*\n\n'
    return header + text.strip() + '\n'


def process_gibran(text: str, title: str, author: str = 'Kahlil Gibran') -> str:
    """Process Kahlil Gibran parables and poems (Forerunner, Madman, etc.).

    Handles:
    - [Illustration] marker removal
    - {N} page marker removal (marker only — does not swallow surrounding newlines)
    - Metadata stripping: everything before the first substantive paragraph
    - ALL-CAPS titles (including apostrophes/hyphens) → ### Title Case
    - Hard line-wrap unwrapping (Gibran uses short prose paragraphs)
    """
    text = strip_gutenberg_end(text)

    # Remove [Illustration] markers
    text = re.sub(r'\[Illustration[^\]]*\]', '', text)

    # Remove {N} page markers — marker only, preserve surrounding whitespace
    # (Using \s* here would greedily eat blank lines and collapse structure)
    text = re.sub(r'\{[ivxlcdm\d]+\}', '', text, flags=re.IGNORECASE)

    # Strip all metadata before the actual prose text begins.
    # The text starts at the first paragraph with > 100 chars that doesn't look
    # like publisher metadata (image captions, copyright notices, review blurbs, TOC).
    lines = text.split('\n')
    content_start = 0
    metadata_patterns = re.compile(
        r'image\s|copyright|printed\s+in|alfred.*knopf|mcmx|new\s+york',
        re.IGNORECASE
    )
    for i, line in enumerate(lines):
        stripped = line.strip()
        if (len(stripped) > 100 and
                not stripped.startswith('[') and
                not re.match(r'^[\"\u201c\u201d]', stripped) and  # skip review blurbs (straight or curly quotes)
                not stripped.startswith('#') and   # skip already-processed headers
                not metadata_patterns.search(stripped) and
                not len(re.findall(r'\b\d+\b', stripped)) >= 8):  # skip TOC entries with many page numbers
            content_start = i
            break

    if content_start > 0:
        text = '\n'.join(lines[content_start:])

    # Convert ALL-CAPS section titles (including apostrophes/hyphens) to ### headers
    text = re.sub(
        r"^([A-Z][A-Z '\-]+)$",
        lambda m: f'### {to_title_case(m.group(1))}' if 2 < len(m.group(1).strip()) < 60 else m.group(0),
        text,
        flags=re.MULTILINE
    )

    # Unwrap hard-wrapped lines (Gibran uses short prose paragraphs)
    text = unwrap_hard_lines(text)

    text = collapse_blanks(text)

    header = f'# {title}\n\n*By {author}*\n\n'
    return header + text.strip() + '\n'


def process_generic(text: str) -> str:
    """Fallback processor: collapse blank lines, unwrap hard wraps."""
    text = strip_gutenberg_end(text)
    text = unwrap_hard_lines(text)
    text = collapse_blanks(text)
    return text.strip() + '\n'


# ---------------------------------------------------------------------------
# The Yoga Sutras of Patanjali (Charles Johnston, 1912)
# ---------------------------------------------------------------------------
#
# Source: Project Gutenberg #2526, which transcribes the Quarterly Book
# Department printing of 1912. That transcription carries 61 defects, each
# settled here against the printing itself using two independent scans:
#
#   LoC  archive.org/details/yogasutrasofpata00pata    (New York, C. Johnston)
#   BPL  archive.org/details/yogasutrasofpata00pata_0  (Quarterly Book Department)
#
# The two scans are NOT the same textual state. The LoC copy carries variant
# sutra renderings (I.9 reads "Phantasy is a fiction of mere words" where the
# BPL copy and Gutenberg read "Predication is carried on through words"),
# expanded commentary, and a closing address to the reader that the other
# copy lacks. Gutenberg descends from the BPL state, so that is the state
# this file reproduces: no reading is ever spliced across the two.
#
# Most repairs are confirmed by both scans reading alike. A minority rest on
# the BPL copy alone, where the LoC copy's variant text or its own OCR leaves
# nothing to compare: "thrown on" (II.33), illumination (II.27), vesture
# (IV.2), picture-gallery, All-consciousness, four dropped sentence periods,
# and the period on sutra III.34.
#
# Deliberately NOT repaired: "quiesence" (II.51) is how the 1912 printing
# spells it -- both scans agree -- and the one-off "center"/"practises"
# readings are orthographic, where Gutenberg is internally consistent with
# the rest of the book. Checking is what kept "quiesence" from being
# "corrected" into something the printing never said.
#
# Every anchor below must match exactly once, or processing aborts. Do not
# relax that: an anchor that silently matches nothing is how a corrupted
# text ships looking proofread.

YOGA_SUTRAS_REPAIRS: List[Tuple[str, str]] = [
    ('been restless senses nave been re and imaginings',
     'been restless senses and imaginings'),
    ('We can well see bow a sodden',
     'We can well see how a sodden'),
    ('shall confirm in all wave to the will',
     'shall conform in all ways to the will'),
    ('over them; and em we blind',
     'over them; and so we blind'),
    ('they must be worn thin,-as a veil',
     'they must be worn thin,—as a veil'),
    ('the total of the phenomena, possess',
     'the total of the phenomenal, possess'),
    ('things seen have not alto fallen away',
     'things seen have not altogether fallen away'),
    ('are these: nom injury, truthfulness',
     'are these: noninjury, truthfulness'),
    ('made to the young map having great',
     'made to the young man having great'),
    ('ourselves to inevitable con fusion.',
     'ourselves to inevitable confusion.'),
    ('in all lands, throughout al times',
     'in all lands, throughout all times'),
    ('spiritual reading, and per feet obedience',
     'spiritual reading, and perfect obedience'),
    ('40. Through purity a withdrawal',
     '40. Through purity comes a withdrawal'),
    ('which is also coveted by the wording',
     'which is also covered by the wording'),
    ('when argumentative-thought no longer',
     'when argumentative thought no longer'),
    ('of a book while inking of something',
     'of a book while thinking of something'),
    ('At the end of he page',
     'At the end of the page'),
    ('the seed of mental analyses.',
     'the seed of mental analysis.'),
    ('three ones are three-and then he thinks',
     'three ones are three—and then he thinks'),
    ('the perceiving consciousness, his the development',
     'the perceiving consciousness, this is the development'),
    ('said:\n\n     Thou cost preserve',
     'said:\n\n     Thou dost preserve'),
    ('This over pressure, which is the cause',
     'This overpressure, which is the cause'),
    ('hangs down like a nipple,-this is the womb',
     'hangs down like a nipple,—this is the womb'),
    ('the divining power of tuition he knows',
     'the divining power of intuition he knows'),
    ('man comes to birth,-there awake',
     'man comes to birth,—there awake'),
    ('The opened powers of tile spiritual man',
     'The opened powers of the spiritual man'),
    ('learning the method of sassing, the consciousness',
     'learning the method of passing, the consciousness'),
    ('be described as detach meet, and comes',
     'be described as detachment, and comes'),
    ('where moth and rust cloth corrupt',
     'where moth and rust doth corrupt'),
    ('where neither moth nor rust cloth corrupt',
     'where neither moth nor rust doth corrupt'),
    ('these lives have their analogies in the',
     'these lives have their analogues in the'),
    ('is radiant or luminous,-for those at least',
     'is radiant or luminous,—for those at least'),
    ('anointed their eyes wit! eye-salve',
     'anointed their eyes with eye-salve'),
    ('plane of substance. But then is a finer hearing',
     'plane of substance. But there is a finer hearing'),
    ('the ether; perhaps no that ether',
     'the ether; perhaps not that ether'),
    ('concentrated Meditation em the correlation of the body',
     'concentrated Meditation on the correlation of the body'),
    ('until the even How of water',
     'until the even flow of water'),
    ('in conformity with the Boston of the feeling',
     'in conformity with the position of the feeling'),
    ('great Teacher, in turn attaches itself',
     'great Teacher, in turn attributes itself'),
    ('though one, is the elective cause',
     'though one, is the effective cause'),
    ('when the transformations ore in the same phase',
     'when the transformations are in the same phase'),
    ('and the man red generate gleams',
     'and the man regenerate gleams'),
    ('27. In the internals of the batik, other thoughts',
     '27. In the intervals of the battle, other thoughts'),
    ('27. His illuminations is sevenfold, rising In successive stages.',
     '27. His illumination is seven-fold, rising in successive stages.'),
    ('transfer of powers from one venture to another',
     'transfer of powers from one vesture to another'),
    ('he views the psychic pictures gallery',
     'he views the psychic picture-gallery'),
    ('and knows, the All consciousness.',
     'and knows, the All-consciousness.'),
    ('thus remove the barrier’ in our path',
     'thus remove the barriers in our path'),
    ('the presence of the prisoner’ the enmeshed',
     'the presence of the prisoner, the enmeshed'),
    ('should be thrown’ on the opposite side',
     'should be thrown on the opposite side'),
    ('is, to bring soulvision, and to wear',
     'is, to bring soul-vision, and to wear'),
    ('This is the true onepointedness, the bringing',
     'This is the true one-pointedness, the bringing'),
    ('the true onepointedness is attained',
     'the true one-pointedness is attained'),
    ('self-expression, selfrealization, self-knowledge',
     'self-expression, self-realization, self-knowledge'),
    ('know no exceptions They are in force',
     'know no exceptions. They are in force'),
    ('the Soul, the spiritual man Disaster comes',
     'the Soul, the spiritual man. Disaster comes'),
    ('the being of the Eternal Like the law of gravity',
     'the being of the Eternal. Like the law of gravity'),
    ('and hold it there Attention',
     'and hold it there. Attention'),
    ('birth, growth and life Spiritual',
     'birth, growth and life. Spiritual'),
    ('\n5 The darkness of ignorance is:',
     '\n5. The darkness of ignorance is:'),
    ('\n34 By perfectly concentrated Meditation on the heart',
     '\n34. By perfectly concentrated Meditation on the heart'),
]


def process_yoga_sutras(text: str) -> str:
    """Process Charles Johnston's 1912 interpretation of the Yoga Sutras.

    Handles:
    - 61 transcription repairs settled against the 1912 printing (above)
    - Title page -> H1 + attribution; transcriber's Contents list removed
    - INTRODUCTION TO BOOK N -> ## Introduction to Book N; BOOK N -> ## Book N
    - Each of the 195 numbered sutras bolded, to keep Patanjali's text
      distinguishable from Johnston's commentary on either side of it
    - The three set-off verse passages -> blockquotes
    - No line unwrapping: the paragraphs already flow, and unwrapping would
      run the verse lines together
    """
    # 1. Settle the transcription against the 1912 printing.
    for old, new in YOGA_SUTRAS_REPAIRS:
        found = text.count(old)
        if found != 1:
            raise ValueError(
                f'yoga-sutras repair anchor matched {found} times, expected 1: {old!r}'
            )
        text = text.replace(old, new, 1)

    # 2. Drop the title page and the transcriber's Contents list in one cut.
    #    The title page returns as the header below; the Contents list is
    #    navigation the headings now carry. Matched line-anchored, because
    #    "INTRODUCTION TO BOOK I" is also a prefix of "...BOOK II".
    front = re.search(r'^Contents\n(?:(?:INTRODUCTION TO )?BOOK [IVX]+\n){8}',
                      text, flags=re.MULTILINE)
    if not front:
        raise ValueError('yoga-sutras: could not find the Contents list to strip')
    text = text[front.end():]

    # 3. Book and introduction headings.
    text = re.sub(r'^INTRODUCTION TO BOOK ([IVX]+)\s*$',
                  r'## Introduction to Book \1', text, flags=re.MULTILINE)
    text = re.sub(r'^BOOK ([IVX]+)\s*$', r'## Book \1', text, flags=re.MULTILINE)

    # The transcription runs each heading flush against the text below it.
    text = re.sub(r'^(## .*)\n(?=\S)', r'\1\n\n', text, flags=re.MULTILINE)

    # 4. Bold the sutras. Johnston sets each numbered sutra on its own line and
    #    comments below it; nothing else in the body begins with a numeral.
    text, sutras = re.subn(r'^(\d+\. .*)$', r'**\1**', text, flags=re.MULTILINE)
    if sutras != 195:
        raise ValueError(f'yoga-sutras: bolded {sutras} sutras, expected 195')

    # 5. Verse. Every paragraph here occupies a single line, so a run of
    #    adjacent lines -- or a single indented one -- is set-off verse.
    lines = text.split('\n')
    blocks = 0
    i = 0
    while i < len(lines):
        if not lines[i].strip():
            i += 1
            continue
        if lines[i].startswith(('#', '**')):
            i += 1
            continue
        j = i
        while j < len(lines) and lines[j].strip() and not lines[j].startswith(('#', '**')):
            j += 1
        if (j - i) >= 2 or lines[i][:1].isspace():
            blocks += 1
            for k in range(i, j):
                lines[k] = '> ' + lines[k].strip()
        i = j
    if blocks != 3:
        raise ValueError(f'yoga-sutras: found {blocks} verse blocks, expected 3')
    text = '\n'.join(lines)

    text = collapse_blanks(text)

    header = (
        '# The Yoga Sutras of Patanjali\n\n'
        '*\u201cThe Book of the Spiritual Man\u201d*\n\n'
        '*An Interpretation By Charles Johnston*\n'
        '*Bengal Civil Service, Retired; Indian Civil Service, Sanskrit Prizeman; '
        'Dublin University, Sanskrit Prizeman*\n\n'
    )
    return header + text.strip() + '\n'


# ---------------------------------------------------------------------------
# The Yoga-System of Patanjali (James Haughton Woods, 1914)
# ---------------------------------------------------------------------------
#
# Harvard Oriental Series vol. 17. A literal scholarly translation, staged as
# the corpus's reference Patanjali beside Johnston's 1912 interpretation. Where
# Johnston has "Union, spiritual consciousness, is gained through control of
# the versatile psychic nature", Woods has "Yoga is the restriction of the
# fluctuations of mind-stuff".
#
# What is staged is one section of the 438-page volume, which Woods built for
# exactly this purpose and titled:
#
#   TRANSLATION OF THE YOGA-SUTRAS WITHOUT THE COMMENT OR THE EXPLANATION
#   Being the Sutras translated in groups, together with group-headings
#   added by the translator
#
# All 195 sutras, none of Vyasa's Yoga-Bhashya or Vachaspati Misra's
# Tattva-Vaicaradi. Woods's group headings and group summaries ARE his own --
# the section's own subtitle says so -- so they are set in italic and the
# sutras in bold. Nothing here should let a reader mistake the translator's
# summary for Patanjali's text.
#
# Source: machine OCR of two independent scans of the 1914 first edition.
#
#   Robarts  archive.org/details/yogasystemofpata00wooduoft  (U. Toronto)
#   Google   archive.org/details/yogasystempataj00vcgoog
#
# The Robarts scan is the base: it reads the sutra numerals correctly where
# the Google scan gives "iv. 80" for "iv. 30" and "Toga" for "Yoga". The
# Google scan serves as the cross-check.
#
# THE STANDING CAUTION. This is OCR-grade text, not a proofread transcription.
# The English prose rests on the two text layers alone and has not been read
# against the page images end to end. What HAS been settled against the images
# is the Sanskrit: every transliterated term was read off the scan directly
# (see WOODS_SANSKRIT below), because neither OCR pass recovers Woods's
# diacritics and one term came through as "piddha" for (cuddha).
#
# Line-break hyphens are the other hazard, and the reason for the table below.
# Woods's style is exceptionally hyphen-dense -- mind-stuff, presented-idea,
# sources-of-valid-ideas -- so a blanket rejoin would turn "mind-stuffs" into
# "mindstuffs". Each of the 35 hyphens in this section was decided by which
# form Woods himself uses across all 438 pages of both scans, and the evidence
# is recorded per row. Two rows had no attestation either way and fell back to
# a rule: prohibi/tions joins because "prohibi" is not a word; complete/mastery
# keeps its hyphen because "complete" is. That second one is a genuine
# judgement call and the only reading here I would not defend as settled.

WOODS_HYPHENS: Dict[Tuple[str, str], str] = {
    ('Uninter', 'mittently'): 'Unintermittently',  # joined 5 / hyphenated 0
    ('combina', 'tions'): 'combinations',  # joined 4 / hyphenated 0
    ('complete', 'mastery'): 'complete-mastery',  # neither attested; 'complete' is a word
    ('con', 'centration'): 'concentration',  # joined 537 / hyphenated 0
    ('con', 'straint'): 'constraint',  # joined 328 / hyphenated 0
    ('con', 'templation'): 'contemplation',  # joined 91 / hyphenated 0
    ('corre', 'sponding'): 'corresponding',  # joined 37 / hyphenated 0
    ('correla', 'tion'): 'correlation',  # joined 116 / hyphenated 0
    ('essential', 'attribute'): 'essential-attribute',  # hyphenated 21 / joined 0
    ('in', 'tensity'): 'intensity',  # joined 102 / hyphenated 0
    ('intended', 'object'): 'intended-object',  # hyphenated 149 / joined 0
    ('mental', 'substrate'): 'mental-substrate',  # hyphenated 8 / joined 0
    ('mind', 'stuff'): 'mind-stuff',  # hyphenated 1033 / joined 3
    ('mind', 'stuffs'): 'mind-stuffs',  # hyphenated 47 / joined 0
    ('motionless', 'ness'): 'motionlessness',  # joined 2 / hyphenated 0
    ('objec', 'tivity'): 'objectivity',  # joined 4 / hyphenated 0
    ('object', 'of-sight'): 'object-of-sight',  # hyphenated 64 / joined 1
    ('object', 'to-be-known'): 'object-to-be-known',  # hyphenated 24 / joined 0
    ('organ-of', 'hearing'): 'organ-of-hearing',  # hyphenated 33 / joined 0
    ('over', 'come'): 'overcome',  # joined 13 / hyphenated 0
    ('passion', 'lessness'): 'passionlessness',  # joined 128 / hyphenated 0
    ('passionless', 'ness'): 'passionlessness',  # joined 128 / hyphenated 0
    ('prohibi', 'tions'): 'prohibitions',  # neither attested; 'prohibi' is not a word
    ('slacken', 'ing'): 'slackening',  # joined 2 / hyphenated 0
    ('sub', 'conscious-impressions'): 'subconscious-impressions',  # joined 93 / hyphenated 0
    ('subconscious', 'impressions'): 'subconscious-impressions',  # hyphenated 93 / joined 0
    ('subliminal', 'impression'): 'subliminal-impression',  # hyphenated 84 / joined 0
    ('subliminal', 'impressions'): 'subliminal-impressions',  # hyphenated 228 / joined 0
    ('super', 'reflective'): 'super-reflective',  # hyphenated 32 / joined 0
    ('super-delibera', 'tive'): 'super-deliberative',  # joined 23 / hyphenated 0
    ('thinking', 'substance'): 'thinking-substance',  # hyphenated 385 / joined 0
    ('those-in-high', 'places'): 'those-in-high-places',  # hyphenated 4 / joined 0
    ('time', 'forms'): 'time-forms',  # hyphenated 47 / joined 0
    ('two', 'fold'): 'two-fold',  # hyphenated 17 / joined 0
    ('un', 'avoidably'): 'unavoidably',  # joined 2 / hyphenated 0
}


WOODS_BOOKS = {'FIRST': ('I', 'Concentration'), 'SECOND': ('II', 'Means of Attainment'),
         'THIRD': ('III', 'Supernormal Powers'), 'FOURTH': ('IV', 'Isolation')}
WOODS_EXPECTED = {'i': 51, 'ii': 55, 'iii': 55, 'iv': 34}

# English OCR misreads. Sanskrit transliteration is deliberately left alone.

WOODS_OCR_REPAIRS = [
    ('YOGA-SUTBAS', 'YOGA-SUTRAS'),   # R misread as B in the display type
    ('Kepetition', 'Repetition'),
    ('ohject', 'object'),
    ('Bain-cloud', 'Rain-cloud'),     # the Google scan's form
    ('Eain-cloud', 'Rain-cloud'),     # the Robarts scan's form
    ('supernalJ-smell', 'supernal]-smell'),
    ('{avidya)', '(avidya)'),
    ('{gum)', '(guna)'),              # Woods prints (guna) with a dot under n
    ('balanced -state', 'balanced-state'),
    ('balanced- state', 'balanced-state'),
    ('organ- of-[supernal] -taste', 'organ-of-[supernal]-taste'),
]

def _woods_strip_furniture(text):
    """Remove running heads, page markers and signature marks.

    A head that falls mid-sentence is closed over, so the paragraph it
    interrupted joins back up (and a word broken at the page turn can be
    rejoined). A head that falls on a paragraph boundary keeps the boundary --
    joining there would fuse two sutras into one."""
    head = (r'(?:Translation\s+of\s+the\s+Yoga-?sutras'
            r'|without\s+the\s+Comment\s+or\s+the\s+Explanation)')
    pats = [
        r'^[ \t]*[;\[]*[ \t]*[xlvic]{2,}\]?[ \t]*' + head + r'[ \t]*$',
        r'^[ \t]*' + head + r'[ \t]*[\[;]*[ \t]*[xlvic]*[ \t]*$',
        r'^[ \t]*\S{0,3}[ \t]*\[[ \t]*[hosr01li.,\s]{3,10}1?7?[ \t]*\][ \t]*$',
        r'^[ \t]*[xlvic]{2,}\][ \t]*$',
    ]
    for pat in pats:
        text = re.sub(pat, '\x00', text, flags=re.M | re.I)

    def close_over(m):
        before = m.group(1)
        tail = before.rstrip()[-1:]
        if tail in '.?!':
            return before + '\n\n'      # the sentence ended: a real boundary
        if tail == '-':
            return before + '\n'         # let dehyphenate() decide this one
        return before + ' '               # mid-sentence: rejoin with a space
    # a page turn can stack a signature mark and a running head together,
    # so close over a RUN of markers, not just one
    text = re.sub(r'(\S)(?:\s*\n\s*\x00)+\s*\n\s*', close_over, text)
    text = re.sub(r'^[ \t]*\x00[ \t]*\n?', '', text, flags=re.M)
    text = text.replace('\x00', '')
    return text


def _woods_dehyphenate(text):
    """Resolve every line-break hyphen from the decided table above."""
    def decide(m):
        key = (m.group(1), m.group(2))
        if key not in WOODS_HYPHENS:
            raise ValueError('woods: undecided line-break hyphen %r' % (key,))
        return WOODS_HYPHENS[key]
    return re.sub(r'([A-Za-z][A-Za-z\-]*)-[ \t]*\n[ \t]*([a-z][A-Za-z\-]*)',
                  decide, text)


def _woods_close_compounds(text):
    """The justified type leaves stray space around the hyphens in Woods's
    compounds ("subliminal -impressions", "central- organ"). He never uses a
    spaced hyphen as punctuation -- dashes in this section are em-dashes -- so
    closing the gap between two word characters is safe."""
    return re.sub(r'([A-Za-z\]])[ \t]*-[ \t]+([A-Za-z\[])', r'\1-\2',
                  re.sub(r'([A-Za-z\]])[ \t]+-[ \t]*([A-Za-z\[])', r'\1-\2', text))


# A citation opening a paragraph: with a trailing period it is one of Woods's
# own group summaries; without one it opens a run of sutra text. (Inside a run
# a citation may also carry a period -- iv. 15. does -- so the test only
# applies at the start of a paragraph.)
# Sanskrit as Woods actually sets it, read off the page images of the Robarts
# scan (leaf = folio + 4, so folio xxxiv is leaf 38):
#
#   iiif.archive.org/iiif/yogasystemofpata00wooduoft$<leaf>/full/1500,/0/default.jpg
#
# Woods uses the 1914 Harvard Oriental Series conventions -- cedilla for what
# IAST writes s-acute, underdot for retroflex, macron for length -- and sets
# the terms in italic, with Icvara and Ananta in roman as proper names. None
# of that survives either OCR pass, so every reading below comes from the
# image, not the text layer. The one the scanner mangled worst was "piddha",
# which is Woods's (cuddha) with a cedilla.
WOODS_SANSKRIT: List[Tuple[str, str, int]] = [
    # (pattern, replacement, occurrences expected)
    (r'(?<![A-Za-z])Icvara(?![A-Za-z])', 'I\u00e7vara', 5),          # folio xxxi, xxxiii, xxxvi
    (r'\(guna\)',    '(_gu\u1e47a_)',   5),                          # folio xxxiv, xl, xli
    (r'\(avidya\)',  '(_avidy\u0101_)', 3),                          # folio xxxiii, xxxv
    (r'\(vikalpa\)', '(_vikalpa_)',    1),                          # folio xxix
    (r'\(alinga\)',  '(_ali\u1e45ga_)', 1),                          # folio xxxiii
    (r'\(piddha\)',  '(_\u00e7uddha_)', 1),                          # folio xxxiv
    (r'\(siddhi\)',  '(_siddhi_)',     1),                          # folio xxxix
    (r'\(citi\)',    '(_citi_)',       1),                          # folio xli
    (r'the Udana(?![A-Za-z])',  'the _Ud\u0101na_',  1),               # folio xxxix
    (r'the Samana(?![A-Za-z])', 'the _Sam\u0101na_', 1),               # folio xxxix
    (r'(?<![A-Za-z_])sattva(?![A-Za-z_])', '_sattva_', 5),
    # the section's own title carries a macron the display type kept
    (r'Yoga-Sutras without the Comment', 'Yoga-S\u016btras without the Comment', 1),
    (r'Being the Sutras translated',     'Being the S\u016btras translated',     1),
    # Woods closes his em-dashes; the space around them is the scanner's.
    # All eight were read on the images -- folios xxxii, xxxiii, xxxiv, xxxv
    # and xxxix -- e.g. "[when attained]\u2014these" and "classes\u2014there is".
    (r'[ \t]*\u2014[ \t]*', '\u2014', 8),
]


def _woods_sanskrit(text):
    """Restore Woods's transliteration, settled against the page images."""
    for pattern, replacement, expected in WOODS_SANSKRIT:
        text, n = re.subn(pattern, replacement, text)
        if n != expected:
            raise ValueError('woods sanskrit: %r matched %d times, expected %d'
                             % (pattern, n, expected))
    return text


# any sutra/summary citation, wherever it appears
WOODS_CIT = re.compile(r'\b(i{1,3}v?|iv)\.\s*(\d{1,2})(\s*-\s*(\d{1,2}))?\.?', re.I)
WOODS_SUMMARY_HEAD = re.compile(r'^(i{1,3}v?|iv)\.\s*\d{1,2}(\s*-\s*\d{1,2})?\.\s', re.I)
WOODS_SUTRA_HEAD   = re.compile(r'^(i{1,3}v?|iv)\.\s*\d{1,2}\s', re.I)
# the same, found anywhere -- used to split a heading glued to its summary
WOODS_SUMMARY_ANY  = re.compile(r'(?<!\S)(i{1,3}v?|iv)\.\s*\d{1,2}(\s*-\s*\d{1,2})?\.\s', re.I)

def process_woods_yoga_sutras(text):
    """Stage Woods's standalone translation of the sutras.

    Assemble the markdown: book headings, group headings, Woods's group
    summaries in italic, and one line per sutra."""
    for old, new in WOODS_OCR_REPAIRS:
        text = text.replace(old, new)
    text = _woods_strip_furniture(text)
    text = _woods_dehyphenate(text)
    text = _woods_close_compounds(re.sub(r'[ \t]+', ' ', text))
    m = re.search(r'group-?headings\s+added\s+by\s+the\s+translator', text)
    if not m:
        raise ValueError('woods: could not find the section subtitle')
    text = text[m.end():]

    def book(mm):
        num, name = WOODS_BOOKS[mm.group(1).upper()]
        return '\n\n@@BOOK Book %s. %s\n' % (num, name)
    text, nb = re.subn(r'^\s*BOOK\s+(FIRST|SECOND|THIRD|FOURTH)\s*[\u2014\u2013-]+\s*[A-Z][A-Z ]*$',
                       book, text, flags=re.M)
    if nb != 4:
        raise ValueError('woods: matched %d book headings, expected 4' % nb)

    paras = [re.sub(r'\s*\n\s*', ' ', p).strip()
             for p in re.split(r'\n\s*\n', text) if p.strip()]
    # Woods's group summaries sometimes carry a stray blank line mid-sentence.
    # A paragraph opening lowercase after one that did not end is its tail.
    merged = []
    for p in paras:
        if (merged and p[:1].islower() and not merged[-1].startswith('@@BOOK')
                and merged[-1].rstrip()[-1:] not in '.?!'):
            merged[-1] = merged[-1] + ' ' + p
        else:
            merged.append(p)
    paras = merged

    out, sutras, summaries = [], 0, 0

    def emit_summary(p):
        nonlocal summaries
        summaries += 1
        out.append('*' + p.strip() + '*')

    def emit_sutras(p):
        nonlocal sutras
        parts = list(WOODS_CIT.finditer(p))
        lines = []
        for idx, mm in enumerate(parts):
            end = parts[idx + 1].start() if idx + 1 < len(parts) else len(p)
            lines.append('**%s. %s** %s' % (mm.group(1).lower(), mm.group(2),
                                            p[mm.end():end].strip()))
            sutras += 1
        out.append('\n'.join(lines))

    # Woods's typography does not always leave a blank line between a group
    # heading, its summary, and the sutras: all three can arrive in one
    # paragraph. So segment every paragraph rather than classifying it whole.
    SUTRA_ANY = re.compile(r'(?<!\S)(i{1,3}v?|iv)\.\s*\d{1,2}\s(?!-)', re.I)

    last = 'book'
    for p in paras:
        if p.startswith('@@BOOK '):
            out.append('## ' + p[len('@@BOOK '):].strip())
            last = 'book'
            continue
        msum = WOODS_SUMMARY_ANY.search(p)
        msut = SUTRA_ANY.search(p, msum.end() if msum else 0)
        head = p[:msum.start() if msum else (msut.start() if msut else len(p))]
        head = head.strip().rstrip('.')
        if head:
            out.append('### ' + head)
            last = 'heading'
        if msum:
            # A citation carrying a period is one of Woods's group summaries
            # only where a summary can stand: right after a group heading. The
            # printing sets sutra iv. 15 with a period too, and it follows
            # sutra text, so position is what separates the two.
            if last in ('heading', 'book'):
                emit_summary(p[msum.start(): msut.start() if msut else len(p)])
                last = 'summary'
            else:
                emit_sutras(p[msum.start():])
                last = 'sutras'
                continue
        if msut:
            emit_sutras(p[msut.start():])
            last = 'sutras'

    if sutras != 195:
        seen = defaultdict(list)
        for ln in '\n'.join(out).split('\n'):
            mm = re.match(r'\*\*(i{1,3}v?|iv)\. (\d{1,2})\*\*', ln)
            if mm:
                seen[mm.group(1)].append(int(mm.group(2)))
        detail = '; '.join('%s missing %s' % (b, [x for x in range(1, e + 1)
                                                  if x not in seen[b]])
                           for b, e in WOODS_EXPECTED.items())
        raise ValueError('woods: emitted %d sutras, expected 195 (%s)'
                         % (sutras, detail))

    header = (
        '# The Yoga-System of Pata\u00f1jali\n\n'
        '*Translation of the Yoga-Sutras without the Comment or the Explanation*\n\n'
        '*Being the Sutras translated in groups, together with group-headings '
        'added by the translator*\n\n'
        '*Translated from the original Sanskrit by James Haughton Woods, '
        'Professor of Philosophy in Harvard University*\n'
        '*Harvard Oriental Series, Volume Seventeen. Cambridge, Massachusetts: '
        'Harvard University Press, 1914*\n\n'
    )
    body = re.sub(r'\n{3,}', '\n\n', '\n\n'.join(out))
    return _woods_sanskrit(header + body.strip() + '\n')


# ---------------------------------------------------------------------------
# File routing
# ---------------------------------------------------------------------------

# Maps filename stems to (processor_type, *args)
# Add new files here as they arrive in knowledge/incoming/
FILE_REGISTRY: Dict[str, tuple] = {
    # Plato/Jowett dialogues
    'apology-plato':         ('dialogue', 'Apology'),
    'philosophy-crito':      ('dialogue', 'Crito'),
    'euthyphro-plato':       ('dialogue', 'Euthyphro'),
    'gorgias-plato':         ('dialogue', 'Gorgias'),
    'meno-plato':            ('dialogue_meno', 'Meno'),
    'phaedo-plato':          ('dialogue', 'Phaedo'),
    'phaedrus-plato':        ('dialogue', 'Phaedrus'),
    'symposium-plato':       ('dialogue', 'Symposium'),
    'theaetetus-plato':      ('dialogue', 'Theaetetus'),
    'timaeus-plato':         ('dialogue_timaeus', 'Timaeus'),
    # Plato — special handling
    'laws-plato':            ('laws',),
    'the-republic-of-plato': ('republic',),
    # Scripture
    'zen-heart-sutra':       ('heart_sutra',),
    'yoga-sutras-of-patanjali': ('yoga_sutras',),
    'yoga-sutras-of-patanjali-woods': ('woods_yoga_sutras',),
    'taoism-tao-te-ching':   ('tao',),
    'buddhism-the-dhammapada': ('scripture', 'The Dhammapada'),
    # Poetry
    'literature-leaves-of-grass': ('poetry', 'Leaves of Grass', 'Walt Whitman'),
    'cross-the-prophet':     ('prophet',),
    # Scientific
    'gaia-hypothesis-james-lovelock': ('scientific', 'The Gaia Hypothesis', 'James Lovelock'),

    # ---- New incoming batch (2026-04-11) ----
    # Scripture
    'Bhagavad-Gîtâ':         ('scripture', 'Bhagavad-Gita', None, 'Translated by Sir Edwin Arnold'),
    # Shakespeare
    'The Complete Works of William Shakespeare': ('shakespeare',),
    # Gibran
    'literature-the-forerunner': ('gibran', 'The Forerunner'),
    'literature-the-madman':        ('gibran', 'The Madman'),
    # Poetry collections
    'Poems of Nature by Henry David Thoreau':  ('poetry', 'Poems of Nature', 'Henry David Thoreau'),
    'literature-rubaiyat-of-omar-khayyam': ('poetry', 'Rubáiyát of Omar Khayyám', 'Edward FitzGerald'),
    'literature-salaman-and-absal': ('poetry', 'Salámán and Absál', 'Edward FitzGerald'),
    # Scholarly/scientific
    'The Fairy-Faith in Celtic Countries': ('scientific', 'The Fairy-Faith in Celtic Countries', 'W.Y. Evans-Wentz'),
    # Generic prose — novels, essays, philosophy (registered to suppress warnings)
    'Demian-Hermann Hesse':                      ('generic',),
    'Siddhartha-Hermann Hesse':                  ('generic',),
    'Steppenwolf-Hermann Hesse':                 ('generic',),
    'Essays by Ralph Waldo Emerson':             ('generic',),
    'Ethics-Spinoza':                            ('generic',),
    'Gleanings from the Works of George Fox':    ('generic',),
    'Nature-Ralph Waldo Emerson':                ('generic',),
    'On the Duty of Civil Disobedience by Henry David Thoreau': ('generic',),
    'The Egyptian Book of the-dead':             ('generic',),
    'The Joyful Wisdom-Friedrich Wilhelm Nietzsche': ('generic',),
    'The Kingdom of God Is Within You-Tolstoy':  ('generic',),
    'Walden by Henry David Thoreau':             ('generic',),
    'meditations-marcus-aurelius':               ('generic',),
    'george-fox-autobiography':                  ('generic',),
    'journal-of-george-fox-vol-1':               ('generic',),
    'journal-of-george-fox-vol-2':               ('generic',),
    'literature-narrative-of-sojourner-truth':   ('generic',),
    'literature-diaries-of-court-ladies-of-old-japan': ('generic',),
    # NOTE: 'Autobiography of a Yogi by Paramahansa Yogananda' is intentionally
    # NOT registered — active copyright held by Self-Realization Fellowship (1946).
    # Do not publish this file.
}


def route_file(text: str, stem: str) -> str:
    """Route a file to the appropriate processor based on its filename stem."""
    if stem not in FILE_REGISTRY:
        print(f'  WARNING: No registered processor for "{stem}", using generic processor')
        return process_generic(text)

    entry = FILE_REGISTRY[stem]
    proc_type = entry[0]
    args = entry[1:]

    if proc_type == 'dialogue':
        return process_dialogue(text, args[0])
    elif proc_type == 'dialogue_meno':
        return process_dialogue(text, args[0], extra_sections={
            r'^MENO\.?\s*$': '## Meno'
        })
    elif proc_type == 'dialogue_timaeus':
        return process_dialogue(text, args[0], has_sections=True)
    elif proc_type == 'laws':
        return process_laws(text)
    elif proc_type == 'republic':
        return process_republic(text)
    elif proc_type == 'heart_sutra':
        return process_heart_sutra(text)
    elif proc_type == 'yoga_sutras':
        return process_yoga_sutras(text)
    elif proc_type == 'woods_yoga_sutras':
        return process_woods_yoga_sutras(text)
    elif proc_type == 'tao':
        return process_tao_te_ching(text)
    elif proc_type == 'poetry':
        return process_poetry(text, args[0], args[1])
    elif proc_type == 'scientific':
        return process_scientific(text, args[0], args[1] if len(args) > 1 else None)
    elif proc_type == 'prophet':
        return process_prophet(text)
    elif proc_type == 'scripture':
        return process_scripture(text, args[0],
                                  args[1] if len(args) > 1 else None,
                                  args[2] if len(args) > 2 else None)
    elif proc_type == 'shakespeare':
        return process_shakespeare(text)
    elif proc_type == 'gibran':
        return process_gibran(text, args[0])
    elif proc_type == 'generic':
        return process_generic(text)
    else:
        print(f'  WARNING: Unknown processor type "{proc_type}", using generic')
        return process_generic(text)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def get_file_stem(filepath: Path) -> str:
    """Get the stem of a file, stripping .md extension if present."""
    stem = filepath.stem
    if filepath.suffix == '.md':
        return stem
    # No extension — the full name is the stem
    return filepath.name


def process_file(filepath: Path, force: bool = False, dry_run: bool = False) -> dict:
    """Process a single file. Returns a result dict."""
    result = {
        'file': filepath.name,
        'status': 'unknown',
        'message': '',
        'lines_before': 0,
        'lines_after': 0,
    }

    if not filepath.exists():
        result['status'] = 'error'
        result['message'] = 'file not found'
        return result

    if filepath.stat().st_size == 0:
        result['status'] = 'empty'
        result['message'] = '0 bytes'
        return result

    original = filepath.read_text(encoding='utf-8')
    result['lines_before'] = original.count('\n') + 1

    # Check for existing frontmatter (preserve it)
    frontmatter, body = preserve_frontmatter(original)

    # Check if already formatted
    if is_already_formatted(body) and not force:
        result['status'] = 'skipped'
        result['message'] = 'already formatted'
        return result

    if dry_run:
        stem = get_file_stem(filepath)
        proc_type = FILE_REGISTRY.get(stem, ('generic',))[0]
        result['status'] = 'would_process'
        result['message'] = f'type={proc_type}, {result["lines_before"]} lines'
        return result

    # Process
    stem = get_file_stem(filepath)
    processed = route_file(body if frontmatter else original, stem)

    # Re-attach frontmatter if it existed
    if frontmatter:
        processed = frontmatter + '\n' + processed

    result['lines_after'] = processed.count('\n') + 1

    # Write back
    filepath.write_text(processed, encoding='utf-8')

    result['status'] = 'processed'
    result['message'] = f'{result["lines_before"]} -> {result["lines_after"]} lines'
    return result


def find_incoming_files(base_dir: Path) -> List[Path]:
    """Find all processable files in knowledge/incoming/."""
    incoming = base_dir / 'knowledge' / 'incoming'
    if not incoming.exists():
        return []
    files = []
    for f in sorted(incoming.iterdir()):
        if f.is_file() and not f.name.startswith('.') and not f.name.startswith('_'):
            files.append(f)
    return files


def print_report(results: List[dict]):
    """Print a structured report of processing results."""
    processed = [r for r in results if r['status'] == 'processed']
    skipped = [r for r in results if r['status'] == 'skipped']
    empty = [r for r in results if r['status'] == 'empty']
    would_process = [r for r in results if r['status'] == 'would_process']
    errors = [r for r in results if r['status'] == 'error']

    print('\n## /groom Report\n')

    if processed:
        print('### Processed')
        for r in processed:
            print(f'- {r["file"]} — {r["message"]}')
        print()

    if would_process:
        print('### Would process (dry run)')
        for r in would_process:
            print(f'- {r["file"]} — {r["message"]}')
        print()

    if skipped:
        print('### Already formatted (skipped)')
        for r in skipped:
            print(f'- {r["file"]} — {r["message"]}')
        print()

    if empty:
        print('### Empty (skipped)')
        for r in empty:
            print(f'- {r["file"]} — {r["message"]}')
        print()

    if errors:
        print('### Errors')
        for r in errors:
            print(f'- {r["file"]} — {r["message"]}')
        print()

    # Observations
    no_ext = [r for r in results if not r['file'].endswith('.md') and r['status'] != 'error']
    if no_ext:
        print('### Observations')
        print(f'- Files lacking .md extension: {", ".join(r["file"] for r in no_ext)}')
        print()


def main():
    parser = argparse.ArgumentParser(
        description='Format raw text files for the OpenCosmos knowledge base.'
    )
    parser.add_argument('path', nargs='?', help='Specific file to process')
    parser.add_argument('--dry-run', action='store_true', help='Report what would be done')
    parser.add_argument('--report', action='store_true', help='Show status of all files')
    parser.add_argument('--force', action='store_true', help='Reprocess already-formatted files')
    args = parser.parse_args()

    # Find the repo root (where knowledge/ lives)
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent  # scripts/knowledge/ -> scripts/ -> repo root

    if args.path:
        # Process a specific file
        filepath = Path(args.path)
        if not filepath.is_absolute():
            filepath = Path.cwd() / filepath
        filepath = filepath.resolve()

        print(f'Processing: {filepath.name}')
        result = process_file(filepath, force=args.force, dry_run=args.dry_run or args.report)
        print_report([result])
    else:
        # Process all files in knowledge/incoming/
        files = find_incoming_files(repo_root)
        if not files:
            print('No files found in knowledge/incoming/')
            return

        print(f'Found {len(files)} files in knowledge/incoming/\n')
        results = []
        for f in files:
            print(f'  Processing: {f.name}...', end=' ')
            result = process_file(f, force=args.force, dry_run=args.dry_run or args.report)
            print(result['status'])
            results.append(result)

        print_report(results)


if __name__ == '__main__':
    main()
