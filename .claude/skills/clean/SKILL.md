---
name: clean
description: Audit every local branch against the freshly fetched default branch — delete local branches whose work is fully merged, flag (never delete) local branches carrying commits that are neither merged nor part of an open PR, and leave the working tree clean and synced to the default branch. The natural follow-up to /pr once its PR has merged, or a periodic tidy of a long-lived clone.
argument-hint: "[--dry-run]"
user-invocable: true
disable-model-invocation: true
---

# /clean — Local Branch Audit and Sync

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

1. **Quick merged check:**
   ```bash
   git log origin/<default-branch>..<branch>
   ```
   **Empty output is trustworthy on its own** — every commit on the branch is provably reachable from the default branch, so it's merged. Go straight to Step 3 for these; no need to also query GitHub.

   **Non-empty output is not proof the branch is unmerged.** A squash or rebase merge never makes the original commits literal ancestors of the default branch even once the content has landed, so this alone can't distinguish a genuinely unmerged branch from one merged that way — treat it as inconclusive and continue to 2.2, not as a verdict.

2. **For anything not confirmed merged in 2.1, check its PR directly** (via a GitHub tool, if this session has one) — authoritative regardless of merge strategy, and re-fetch (Step 1) first if any real time has passed since your last fetch, since a PR can land in that gap in a fast-merge repo. A PR that shows **open** is expected, healthy state — leave the branch and note it as "in progress." A PR that shows **merged** confirms 2.1's non-empty output was a false negative (squash/rebase, most likely) — safe to delete.

3. **No GitHub tool available, and 2.1 was non-empty** — there's no way to fully disambiguate "unmerged" from "merged by squash or rebase." Don't guess either way: report the branch as unconfirmed, with its commit log, and let the user decide.

4. **No open PR and not confirmed merged** — this is unreconciled work, possibly from another session or an abandoned start. **Flag it, do not delete it.** Capture enough for the user to decide: branch name, commit count ahead of the default branch, the last commit's subject line and date, and whether it has ever been pushed (has an upstream).

**`--dry-run`**: print the full plan (what would be deleted, what would be flagged) and stop before Step 3.

## Step 3: Delete confirmed-merged branches

```bash
git branch -D <branch>
```

Only for branches confirmed merged in Step 2.1 or 2.2. Never delete a branch that didn't clear one of those, regardless of how old, how obviously-abandoned-looking, or how confident a guess would be — a guess is not a merge check.

## Step 4: Sync the local default branch

```bash
git checkout <default-branch>
git merge --ff-only origin/<default-branch>
```

Fast-forward only. If this fails, the local default branch has commits `origin` doesn't — which should never happen in normal flow (all work should land on feature branches). **Stop and report it** rather than force-syncing (`reset --hard`) over what could be real local work; this needs a human look, not an automatic resolution.

## Step 5: Report the end state

State plainly, in this order:

1. **Deleted** — every branch removed in Step 3, by name.
2. **Flagged, not deleted** — every branch from Step 2.4, with its detail (commits ahead, last commit, pushed or not). If this list is non-empty, say clearly that these need a human decision, not that cleanup is incomplete.
3. **In progress** — every branch from Step 2.2 with an open PR (informational, not a problem).
4. **Unconfirmed** — every branch from Step 2.3 (no GitHub tool, ancestry inconclusive). Say plainly that merge status couldn't be determined and why, distinct from "flagged" (which means confirmed unmerged, or no way to know).
5. **Confirm end state:** `git status` (expect clean) and that the local default branch is at the same commit as `origin/<default-branch>`.

Every local branch must appear in exactly one of these four categories, or be the default branch itself — nothing silently unaccounted for.

## What this skill must never do

- **Never delete a branch whose commits aren't all reachable from the fetched default branch** — no exceptions for "looks old" or "probably abandoned." Flag instead.
- **Never treat non-empty `git log origin/<default>..<branch>` as proof of "unmerged."** Without a GitHub tool to confirm, it's ambiguous under squash/rebase merges — report it as unconfirmed, don't delete it, and don't confidently call it abandoned work either.
- **Never discard uncommitted changes**, on any branch, under any flag.
- **Never force-push or delete a branch on `origin`** — this skill's writes are local only (`git branch -D`, local checkout/merge).
- **Never `reset --hard` the default branch to force a sync** — a failed fast-forward is a signal to stop and report, not a problem to paper over.
- **Never drop a branch from the final report** — every non-default, non-deleted branch must be named explicitly as "in progress," "flagged," or "unconfirmed."
