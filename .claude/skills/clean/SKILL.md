---
name: clean
description: Audit every local branch against the freshly fetched default branch — delete local branches whose work is fully merged, flag (never delete) local branches carrying commits that are neither merged nor part of an open PR, and leave the working tree clean and synced to the default branch. The natural follow-up to /pr once its PR has merged, or a periodic tidy of a long-lived clone.
argument-hint: "[--dry-run]"
user-invocable: true
disable-model-invocation: true
---

# /clean — Local Branch Audit and Sync

<!-- Canonical source: opencosmos/.claude/skills/clean/SKILL.md. Consuming repos carry a copy for skill discovery — when you edit this file, propagate the change to those copies. -->

The follow-up to [/pr](../pr/SKILL.md): once a PR has merged, this is what clears the now-stale local branch and sweeps up anything else sitting in the clone. If there's work not yet in a PR, run `/pr` first — `/clean` never packages work, it only deletes-what's-safe and flags what isn't.

**This skill is local-only.** It never pushes, force-pushes, or deletes a branch on `origin` — only local branches and local remote-tracking refs. The end state it promises is: **local is synced to the default branch, with a clean working tree**, and nothing with real, unmerged work has been deleted.

## Step 0: Refuse to run on a dirty working tree

```bash
git status
```

If the current branch has uncommitted changes, **stop** — don't touch anything. Tell the user to run `/pr` (or commit/stash by hand) first. This skill never discards working-tree changes, staged or not, under any circumstance.

## Step 1: Fetch and prune

```bash
git fetch origin <default-branch> --prune
```

This updates the default branch's ref and removes remote-tracking refs (`origin/*`) for branches GitHub has already deleted (typically: merged PRs, if the repo auto-deletes head branches). It does not touch any local branch.

## Step 2: Audit every local branch except the default

For each local branch other than the default:

1. **Merged check:**
   ```bash
   git log origin/<default-branch>..<branch>
   ```
   Empty output = every commit on this branch is already reachable from the default branch = **fully merged**. Safe to delete.

2. **If not fully merged, check for an open PR** (via a GitHub tool if this session has one). An open PR on an unmerged branch is expected, healthy state — not a problem. Leave it, and note it in the final report as "in progress."

3. **If not fully merged AND no open PR exists** — this is unreconciled work, possibly from another session or an abandoned start. **Flag it, do not delete it.** Capture enough for the user to decide: branch name, commit count ahead of the default branch, the last commit's subject line and date, and whether it has ever been pushed (has an upstream).

**`--dry-run`**: print the full plan (what would be deleted, what would be flagged) and stop before Step 3.

## Step 3: Delete confirmed-merged branches

```bash
git branch -D <branch>
```

Only for branches that passed the merged check in Step 2.1. Never delete a branch that didn't pass that check, regardless of how old, how obviously-abandoned-looking, or how confident a guess would be — a guess is not a merge check.

## Step 4: Sync the local default branch

```bash
git checkout <default-branch>
git merge --ff-only origin/<default-branch>
```

Fast-forward only. If this fails, the local default branch has commits `origin` doesn't — which should never happen in normal flow (all work should land on feature branches). **Stop and report it** rather than force-syncing (`reset --hard`) over what could be real local work; this needs a human look, not an automatic resolution.

## Step 5: Report the end state

State plainly, in this order:

1. **Deleted** — every branch removed in Step 3, by name.
2. **Flagged, not deleted** — every branch from Step 2.3, with its detail (commits ahead, last commit, pushed or not). If this list is non-empty, say clearly that these need a human decision, not that cleanup is incomplete.
3. **In progress** — every branch from Step 2.2 with an open PR (informational, not a problem).
4. **Confirm end state:** `git status` (expect clean) and that the local default branch is at the same commit as `origin/<default-branch>`.

Every local branch must appear in exactly one of these three categories, or be the default branch itself — nothing silently unaccounted for.

## What this skill must never do

- **Never delete a branch whose commits aren't all reachable from the fetched default branch** — no exceptions for "looks old" or "probably abandoned." Flag instead.
- **Never discard uncommitted changes**, on any branch, under any flag.
- **Never force-push or delete a branch on `origin`** — this skill's writes are local only (`git branch -D`, local checkout/merge).
- **Never `reset --hard` the default branch to force a sync** — a failed fast-forward is a signal to stop and report, not a problem to paper over.
- **Never drop a flagged branch from the final report** — every non-default, non-deleted branch must be named explicitly as either "in progress" or "flagged."
