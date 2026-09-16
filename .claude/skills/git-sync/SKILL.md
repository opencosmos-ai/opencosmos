---
name: git-sync
description: Sync a git working copy with its GitHub remote — fetch, detect whether the current branch's PR has already merged, rebuild the branch from the latest default branch when it has, and prune stale local branches and remote-tracking refs. Use at the start of work in any repo, after opening a PR that might merge quickly, or when a git command errors on a ref that "should" exist (unknown revision, couldn't find remote ref, branch not found).
argument-hint: "[--prune-only]"
user-invocable: true
disable-model-invocation: true
---

# /git-sync — Cross-Device Git Lifecycle Skill

<!-- Canonical source: opencosmos/.claude/skills/git-sync/SKILL.md. Consuming repos carry a copy for skill discovery — when you edit this file, propagate the change to those copies. -->

## The mental model

GitHub is the one shared source of truth. Every clone — your laptop, a Claude Code cloud session's ephemeral container, a CI runner — is an **independent local copy** that only stays in sync when it explicitly talks to GitHub via `fetch`/`pull`/`push`. Nothing pushes state *at* a clone; every clone has to go ask.

This matters most when PRs merge fast (small canon/doc changes, a solo repo, a tight review loop). A branch you pushed five minutes ago may already be merged and deleted on GitHub — and your local clone has no way to know that until it fetches. Left unhandled, this produces two recurring failure modes:

1. **Stale branch confusion** — you keep committing to a local branch whose PR already merged, and a second PR built on it either duplicates the first or conflicts with it.
2. **Ref rot** — `git branch -a` accumulates local branches and remote-tracking refs for PRs that merged and were deleted on GitHub weeks ago, because nothing ever pruned them.

A Claude Code cloud session's container is ephemeral (reclaimed after the session ends), so ref rot there doesn't outlive the session — but a laptop clone accumulates it indefinitely unless something runs this routine.

## When to run this

- At the start of work in any repo, especially at the start of a new session (a fresh cloud container, or picking a repo back up on a laptop after time away).
- Immediately after creating a PR, before starting the next piece of work on the same branch — don't assume the branch survives past the PR merging.
- Whenever a git command errors on a ref that should exist: `unknown revision or path not in the working tree`, `couldn't find remote ref`, `fatal: ambiguous argument 'HEAD'`. These are the fingerprint of working on a branch that was rebuilt or deleted elsewhere.

## Step 1: Identify the default branch and the current branch

```bash
git remote show origin | grep "HEAD branch"   # or: gh repo view --json defaultBranchRef -q .defaultBranchRef.name
git branch --show-current
```

## Step 2: Fetch the default branch specifically

```bash
git fetch origin <default-branch>
```

Fetch the default branch on its own, not bundled with other refspecs in one command — if any one ref in a combined `git fetch origin main some-branch` doesn't resolve, the whole command can fail without updating anything, including the default branch you actually needed.

## Step 3: Check whether the current branch's PR already merged

**Prefer a GitHub tool over `git log` whenever one is available** (an MCP GitHub server, `gh` CLI, etc.) — query the branch's PR directly for its merged state. This is the authoritative check regardless of how the repo merges (merge commit, squash, or rebase), and it isn't fooled by a merge strategy that never makes the original branch commits literal ancestors of the default branch.

**Re-run Step 2's fetch immediately before this check if any real time has passed since you last fetched** — in a fast-merge repo, a PR can land in the gap between an earlier fetch and now, and checking against a stale `origin/<default>` produces a false "not merged" for a branch that in fact just landed. (This isn't hypothetical: it happened mid-session once already — a PR merged in the seconds between a fetch and the API check that followed it.)

**Only fall back to `git log --oneline origin/<default>..<current-branch>` when no GitHub tool is available**, and read its output asymmetrically:
- **Empty** is trustworthy: every commit on the branch is provably reachable from the default branch, so it's merged.
- **Non-empty is not proof the branch is unmerged.** A squash or rebase merge never makes the original commits literal ancestors of the default branch, even once the content has fully landed — this output alone can't tell a genuinely unmerged branch apart from one merged that way. Treat it as inconclusive, say so plainly, and don't rebuild the branch (Step 4) on the strength of this signal alone unless you also know the repo only ever uses ordinary merge commits.

## Step 4: Rebuild or continue

**If the PR already merged:** don't keep building on the old branch — its base is stale and, per most repos' conventions, the remote branch itself is often already auto-deleted. Restart it from the fresh default branch, keeping the same branch name so any open references to it (a linked PR draft, a teammate's checkout) still resolve:

```bash
git fetch origin <default-branch>
git checkout -B <branch-name> origin/<default-branch>
# ...then cherry-pick or re-apply any not-yet-merged work that was sitting on the old branch...
git push -u origin <branch-name>
```

If a *new* PR is what comes next, it will be a new PR — a merged PR is finished and can't track further commits, whatever branch name is reused.

**If the PR is still open:** just make sure the branch is current against the default branch (merge or rebase per the repo's own convention — check its CONTRIBUTING.md or CLAUDE.md), and continue.

**If there's no PR yet:** nothing to reconcile; proceed with work as normal.

## Step 5: Prune stale branches and refs

```bash
git fetch --prune origin          # remove remote-tracking refs (origin/foo) for branches deleted on GitHub
git branch -vv                    # local branches whose upstream shows "[gone]" are safe deletion candidates
git branch -D <branch>            # delete a local branch once you've confirmed its content is merged (Step 3)
```

`--prune` only removes remote-tracking refs (`origin/*`) — it never touches local branches or uncommitted work. Deleting a local branch (`-D`) is the one destructive step here.

Run with `--prune-only` (skip Steps 3–4, just do the fetch/prune housekeeping) when you're not actively about to build on a specific branch — e.g. a periodic tidy of a long-lived laptop clone.

## What this skill must never do

- **Never force-push, and never delete a local branch that has commits not reachable from the default branch or any open PR.** If Step 3 is ambiguous — you can't confirm the branch's content actually landed — leave the branch alone and say so, rather than guessing.
- **Never delete a remote branch on a hunch.** Confirm via a GitHub tool (or ask the user) that the PR merged before running `git push origin --delete`; most repos already auto-delete the head branch on merge, so this is rarely needed at all. Some git-proxy configurations reject remote branch deletion outright (HTTP 403) — if so, say that plainly and point the user at deleting it from the GitHub UI, rather than retrying.
- **Never rewrite the history of a branch someone else is also using** — this routine only ever rebuilds *your own* just-merged branch from a fresh base, never rebases a shared branch out from under a collaborator.
- **Never silently reuse a merged PR.** A restarted branch's next PR is a new PR, and should read as one (link back to the merged one if there's continuity worth noting).
