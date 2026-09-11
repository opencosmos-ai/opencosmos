# 0009 — `@opencosmos/constellation` as its own package

**Date:** 2026-05-08 · **Status:** Accepted

_The obvious graph library is non-commercial licensed, so the constellation is built on its MIT-licensed engine and published as a reusable primitive rather than buried in the design system._

## Context

The constellation needed a GPU force-directed graph renderer. Cosmograph is the natural choice and the visual reference — but `@cosmograph/cosmograph` is CC BY-NC-4.0. Non-commercial licensing is not a detail that can be deferred; it constrains what OpenCosmos can ever become, and discovering it after adoption would mean rewriting the visualization under pressure.

Its underlying engine, `@cosmos.gl/graph`, is MIT and an OpenJS Foundation member project. The same GPU engine, without the restriction.

That left where the React wrapper should live. The default would be `@opencosmos/ui`, the existing design system. But a WebGL graph renderer is not a design-system component: it carries a heavy dependency, has its own release cadence tied to a beta engine, and is useful to people who want nothing else from the design system.

There is also a values dimension. The question of whether this work could be a community resource rather than only a product ingredient had a real answer available here.

## Decision

Build on `@cosmos.gl/graph` (MIT) and publish the React wrapper as **`@opencosmos/constellation`**, a standalone package, rather than a component inside `@opencosmos/ui`.

Consumers import the renderer from `@opencosmos/constellation`; the graph payload is generated separately by `scripts/knowledge/generate-constellation-graph.ts` and served from Redis.

## Consequences

- No non-commercial restriction anywhere in the dependency tree. What OpenCosmos becomes is not constrained by a graph library.
- A reusable community primitive, which answers "can this be a community empowerment resource" with yes rather than in principle.
- `@opencosmos/ui` stays a design system and does not acquire a WebGL dependency that most consumers will never render.
- Separate package means separate versioning and release, and a beta engine means occasional churn to absorb.
- **The boundary is recorded only on this side of it.** The package ships from `opencosmos-ui`; this repo consumes it. Anyone working there sees the package but not the reasoning, which is a gap worth closing if the two repos ever diverge on it.
- The legacy `KnowledgeGraph` components still in `@opencosmos/ui` are dormant, not current. They hardcode `/knowledge/wiki/...` URLs that no longer resolve — inert while unused, a landmine if adopted.

## Alternatives considered

- **`@cosmograph/cosmograph` directly.** Rejected on licensing: CC BY-NC-4.0 forecloses commercial use, and accepting that to save wrapper work would mortgage the project's options.
- **A component inside `@opencosmos/ui`.** Rejected: wrong granularity. A heavy, independently-versioned WebGL renderer does not belong in the package every app imports for buttons.
- **App-local, not published.** Rejected: it would work, and it would make the reusability question moot by answering it no.
