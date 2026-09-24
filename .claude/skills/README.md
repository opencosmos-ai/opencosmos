# Skills

Procedures an agent follows, not programs it runs. Each is a `SKILL.md` that
Claude Code loads when you type `/<name>` — so the directory layout here is a
discovery contract, not a filing preference. A skill moved out of
`.claude/skills/` stops being a skill.

For executables, see [`scripts/`](../../scripts/README.md). The distinction is
worth keeping: scripts are run, skills are followed.

**This repository is the canonical home.** Several of these are copied into
other OpenCosmos repos so they can be discovered there too. When you edit one,
propagate the change to those copies.

---

## Working with the repo

| Skill | What it does |
|---|---|
| [`/pr`](./pr/SKILL.md) | Package current unmerged work into a pushed branch, a CHANGELOG entry and an open pull request. |
| [`/clean`](./clean/SKILL.md) | Audit local branches against the default branch, delete what is provably merged, flag what isn't. The follow-up to `/pr`. |
| [`/git-sync`](./git-sync/SKILL.md) | Fetch, detect an already-merged PR, rebuild the branch from the default, prune stale refs. |

## Building

| Skill | What it does |
|---|---|
| [`/create`](./create/SKILL.md) | Build UI using `@opencosmos/ui` components only — the component API reference, import patterns and rules. |
| [`/inference-cost`](./inference-cost/SKILL.md) | View and edit which Claude model each Cosmo/Inception surface runs on. |

## The corpus

The six corpus skills — `/groom`, `/new-quote`, `/knowledge-compile`,
`/knowledge-lookup`, `/knowledge-review`, `/standardize-knowledge` — live in
[opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge/tree/main/.claude/skills),
next to the corpus they work on. Open a Claude Code session in that repository
to use them.

---|---|
| [`/groom`](./groom/SKILL.md) | Prepare raw markdown in `incoming/` for publication — formatting only, never rewriting. |
| [`/new-quote`](./new-quote/SKILL.md) | Add quotes to the corpus: parse free-form input, dedupe, infer category, validate provenance, route to the right pool. |
| [`/knowledge-compile`](./knowledge-compile/SKILL.md) | Compile durable cross-tradition insight into the wiki, and log it. |
| [`/knowledge-lookup`](./knowledge-lookup/SKILL.md) | Search the wiki for existing synthesis before starting a domain conversation. |
| [`/knowledge-review`](./knowledge-review/SKILL.md) | Health check the wiki — orphans, broken cross-refs, asymmetric links, staleness. |
| [`/standardize-knowledge`](./standardize-knowledge/SKILL.md) | Normalise heading structure to H2/H3/H4 so RAG chunking stays reliable. |

---

## Writing a new one

A skill is a directory containing `SKILL.md` with YAML frontmatter:

```yaml
---
name: my-skill
description: One sentence that decides when this gets invoked. Be concrete.
argument-hint: "[--flag | <argument>]"
user-invocable: true              # can be typed as /my-skill
disable-model-invocation: true    # only on request — never chosen autonomously
---
```

`description` is load-bearing: it is what an agent reads to decide whether the
skill applies. Describe the situation it belongs to, not just the action.

Set `disable-model-invocation: true` for anything that writes, publishes,
deletes, or costs money — those should be asked for, not inferred.
