# Skills

Procedures an agent follows, not programs it runs. Each is a `SKILL.md` that
Claude Code loads when you type `/<name>` — so the directory layout here is a
discovery contract, not a filing preference. A skill moved out of
`.claude/skills/` stops being a skill.

For executables, see [`scripts/`](../../scripts/README.md). The distinction is
worth keeping: scripts are run, skills are followed.

**One is a copy.** `/create` is canonical in
[opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui/tree/main/.claude/skills/create),
where the components it documents live. Edit it there and copy it here. The
rest live only in this repository.

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
