# 0019 — One application lives at the repository root

**Date:** 2026-09-24 · **Status:** Accepted · **Relates to** [0018](0018-the-commons-and-the-applications-live-in-separate-repositories.md)

_This repository holds one application, so the application is the repository. `apps/web/` moves to the root, and the monorepo shell around it (turbo, the pnpm workspace, a second `package.json`) is removed._

## Context

[0018](0018-the-commons-and-the-applications-live-in-separate-repositories.md) split the monorepo by rights and invitation. The corpus, Cosmo, both translations and the personal applications all left, and `apps/` was left holding one entry, `web`.

The shell built for five applications stayed. Every command needed `--filter web`. There were two `package.json` files, one of them a list of dependencies for scripts that had already moved to the knowledge repository. A `turbo.json` coordinated a single task and kept a pass-through list of env vars that had drifted to name nine variables nothing read. A `pnpm-workspace.yaml` listed a glob that matched one directory, and the Vercel project needed a Root Directory override. CI had a concurrency cap so four builds would not exhaust a runner. None of it did anything for one app, and all of it had to be understood before a contributor could run one.

The monorepo was also where unrelated work used to collide. A dependency change in one app would regenerate the shared lockfile and prune another app's auto-installed optional peers, breaking a build nobody had touched. With one app, that failure has no sibling to hit.

## Decision

**The application lives at the repository root.** `app/`, `lib/`, `components/`, `public/`, `next.config.mjs` and `tsconfig.json` sit beside `docs/` and `scripts/`. There is one `package.json`, and `pnpm dev` / `pnpm build` run Next directly.

- **Turborepo and the pnpm workspace are removed.** There is nothing to orchestrate.
- **`scripts/` holds every program, including the content fetch.** `apps/web/scripts/fetch-content.mjs` joins the repo-level scripts.
- **Fetched content lands in `.content/`** at the root, and the `@import` in `.claude/CLAUDE.md` follows it.
- **The Vercel project's Root Directory is the repository root.** `vercel.json` sits at the root, and Vercel reads it only from the Root Directory, so the two move together.
- **`pnpm lint` is removed, not repaired.** eslint was never installed or configured, so the script could not run. CI's `next build` type-checks. A linter comes back when there is a rule someone wants enforced.

**If a second application ever arrives, reintroduce the workspace then.** Moving back is cheap: `git mv` plus a `pnpm-workspace.yaml`. Keeping a shell for an application that doesn't exist yet is the cost this ADR removes.

## Consequences

- **One command set:** `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm content`. No filters and no second manifest.
- **The switchover has a window, and it is safe.** When this merges, the first production build fails, because Vercel still looks in `apps/web`. Vercel keeps serving the last good deployment until the Root Directory is cleared and a redeploy succeeds. The knowledge repository's deploy hook needs no change.
- **Paths change in prose everywhere.** About 140 references to `apps/web/` in this repository's living docs are updated. ADRs and archived documents keep their paths, because they describe the repository as it was. Comments in knowledge, cosmo and iching that name `apps/web/...` are updated from each side.
- **History follows the files.** The move is made with `git mv`, so `git log --follow` crosses it.

## Alternatives considered

- **Keep the monorepo shell for future apps.** Rejected. 0018's rule is that the organization holds the commons and the site that serves it, so a second app here would be the exception, and the shell is cheap to restore if it comes.
- **Keep `apps/web/` but drop turbo.** Rejected as a half-measure. The Root Directory override, the nested paths and the two `package.json` files remain, and they are most of the friction.
