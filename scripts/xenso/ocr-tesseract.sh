#!/usr/bin/env bash
#
# ocr-tesseract.sh — OCR a scanned PDF with Tesseract, in the page format the
# I Ching importer reads.
#
# WHY A SECOND ENGINE. The McClatchie pages were first OCR'd with Apple Vision
# (scripts/xenso/ocr-pdf.swift), which needs no install. Measured over the whole
# 462-page English body, by the share of words no dictionary recognises:
#
#     Apple Vision   19.8%
#     Tesseract      10.5%
#
# Tesseract is kept as the primary for that reason and no other. Vision is kept
# too, because where the two independently agree the residual error is 3.9% —
# and Vision's own confidence is worthless here, averaging 0.98 on pages where
# one word in five is wrong. See scripts/xenso/ocr-consensus.ts.
#
# RESOLUTION. 300 DPI (--scale 4.17 against a 72 DPI MediaBox). Higher is worse,
# which is counterintuitive and was measured: the source is bitonal JBIG2 at 600
# DPI, and downsampling into a grey buffer anti-aliases the glyphs into
# something the engines are trained on, where rendering 1:1 preserves every hard
# edge and speckle of a 1973 photo-facsimile. 600 DPI scored 16.6% against
# 216 DPI's 13.7% on the same pages.
#
# REQUIRES  brew install tesseract   (outside the pnpm workspace, so it cannot
#           regenerate the shared lockfile)
#
# RUN
#   scripts/xenso/ocr-tesseract.sh <in.pdf> <out.txt> [from] [to]
#
set -euo pipefail

PDF=${1:?usage: ocr-tesseract.sh <in.pdf> <out.txt> [from] [to]}
OUT=${2:?usage: ocr-tesseract.sh <in.pdf> <out.txt> [from] [to]}
FROM=${3:-30}
TO=${4:-491}

command -v tesseract >/dev/null || { echo "tesseract not found — brew install tesseract" >&2; exit 1; }

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
INK=$(mktemp -d)/page-ink
TMP=$(mktemp -d)
trap 'rm -rf "$TMP" "$(dirname "$INK")"' EXIT

echo "ocr-tesseract: building the page rasteriser" >&2
swiftc -O "$ROOT/scripts/xenso/page-ink.swift" -o "$INK" -framework PDFKit -framework AppKit

echo "ocr-tesseract: exporting pages $FROM-$TO at 300 DPI" >&2
for lo in $(seq "$FROM" 50 "$TO"); do
  hi=$((lo + 49)); [ "$hi" -gt "$TO" ] && hi=$TO
  "$INK" "$PDF" --export "$(seq -s, "$lo" "$hi")" --dir "$TMP" --scale 4.17 >/dev/null
done

echo "ocr-tesseract: recognising" >&2
: > "$OUT"
n=0
for p in $(seq "$FROM" "$TO"); do
  f="$TMP/page-$(printf '%03d' "$p").png"
  [ -f "$f" ] || continue
  # psm 4 — a single column of text of variable sizes. Measured against psm 3
  # (auto) and psm 6 (uniform block) on the same pages; psm 4 won, and it is
  # also the mode that skips the "Digitized by Google" watermark, which psm 3
  # picks up and the importer would then have to strip.
  printf '\f[seq=%d conf=0.00]\n' "$p" >> "$OUT"
  tesseract "$f" - --psm 4 -l eng 2>/dev/null >> "$OUT"
  printf '\n' >> "$OUT"
  n=$((n + 1))
  [ $((n % 50)) -eq 0 ] && echo "  … $p" >&2
done

echo "ocr-tesseract: wrote $n pages to $OUT" >&2
