# 0005 — The AI Triad: Sol, Socrates, Optimus, with Cosmo moderating

**Date:** 2026-03-20 · **Status:** Accepted

_Three distinct cognitive stances in tension produce richer responses than one blended voice, and Cosmo moderates the exchange rather than joining it._

## Context

A single assistant persona tuned to be warm, rigorous, and practical at once tends to average those qualities rather than deliver any of them. Warmth softens the challenge, rigour blunts the encouragement, and pragmatism cuts both short. The result reads as agreeable and says little.

The generative-adversarial insight suggests the opposite arrangement: hold the stances apart and let their disagreement do the work. A response that has survived being pushed on from three directions is better than one composed to satisfy three directions simultaneously.

That requires the stances to be genuinely distinct, and it requires someone whose job is not to advocate.

## Decision

Three voices, each committed to one cognitive mode:

- **Sol** — heart. Attunement, care, the human being in front of you.
- **Socrates** — inquiry. The question under the question; what is being assumed.
- **Optimus** — execution. What actually gets done, and by when.

**Cosmo moderates and does not participate.** Cosmo holds the exchange, decides what surfaces, and speaks to the person. It is not a fourth opinion, because a moderator with a position stops moderating.

Lives at `packages/ai/triad/`.

## Consequences

- Responses carry more than one angle, and the tension is visible rather than smoothed away.
- The separation is only real if each voice stays committed to its mode. A Sol that starts giving execution advice, or an Optimus that starts being reassuring, collapses the structure back into the blended voice this exists to avoid.
- Cosmo's neutrality is load-bearing. Giving Cosmo a stance of its own would make it the loudest participant rather than the one holding the room.
- More inference per response than a single-voice design.
- The triad is a structure for producing a response, not a feature to expose. A person talks to Cosmo.

## Alternatives considered

- **One blended assistant persona.** Rejected: averaging the stances produces something agreeable and thin. The disagreement is the value.
- **Let the user pick a voice.** Rejected: it makes the person do the routing, and the interesting case is precisely the one where they do not yet know whether they need care, a better question, or a plan.
- **Cosmo as a fourth voice in the exchange.** Rejected: a moderator who advocates stops moderating, and the synthesis would tilt toward whichever stance Cosmo held.
