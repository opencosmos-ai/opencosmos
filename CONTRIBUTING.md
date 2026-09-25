# Contributing to OpenCosmos

Thank you for your interest in contributing! This project is built on the belief that human-centered design can be proven through architecture, not just claimed — and contributions that share that vision are welcome.

## First: is this the right repository?

This repository is the **site**, opencosmos.ai. Most of what a reader wants to
improve lives next door:

| You want to… | Go to |
|---|---|
| Fix a typo or transcription error in a Library text, or contest a quote | [knowledge](https://github.com/opencosmos-ai/knowledge). Every Library page ends with **Suggest an edit**, which opens the right file |
| Report something Cosmo said, or propose a change to its voice | [cosmo](https://github.com/opencosmos-ai/cosmo) |
| Argue with a line of the Tao Te Ching or I Ching | [taoteching](https://github.com/opencosmos-ai/taoteching), [iching](https://github.com/opencosmos-ai/iching) |
| Change a UI component | [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) |
| Fix or improve the site itself | here |

## Getting Started

1. **Read the philosophy first:** [WELCOME.md](WELCOME.md) is the front door. [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) outlines the four principles that guide every decision.
2. **Understand the architecture:** [AGENTS.md](AGENTS.md) covers coding standards, file organization, and workflows.
3. **Set up your environment:**

```bash
git clone https://github.com/opencosmos-ai/opencosmos.git
cd opencosmos
pnpm install
pnpm dev      # fetches the corpus and Cosmo, then serves localhost:3000
```

### Prerequisites

- Node.js 24+ (see `.nvmrc`)
- pnpm 10 (pinned in `package.json`)

## How to Contribute

### Reporting Bugs

- Open an issue on [GitHub Issues](https://github.com/opencosmos-ai/opencosmos/issues)
- Include: steps to reproduce, expected vs actual behavior, browser/OS, and screenshots if applicable
- Check existing issues first to avoid duplicates

### Suggesting Features

- Open a feature request issue describing the use case, not just the solution
- Explain how it aligns with the [design philosophy](DESIGN-PHILOSOPHY.md)

### Submitting Code

1. Fork the repository and create a branch: `type/brief-description` (e.g., `feat/motion-slider`, `fix/button-focus`)
2. Follow the coding standards in [AGENTS.md](AGENTS.md)
3. Ensure `pnpm build` passes (it type-checks), and check UI changes in a browser
4. Write a clear commit message following conventional commits:
   ```
   type(scope): description
   ```
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
5. Open a pull request against `main`

### Adding Components

If you're adding a new component to `@opencosmos/ui`, that work happens in the [opencosmos-ui](https://github.com/opencosmos-ai/opencosmos-ui) repository, not here.

## Code Standards

- **Accessibility is non-negotiable.** Every component must be keyboard navigable, screen reader compatible, and work with `prefers-reduced-motion: reduce`.
- **Use design system components first.** Don't create one-off solutions when a shared component exists or could be created.
- **CSS variables over hardcoded colors.** All styling must respect the active theme.
- **Motion must respect preferences.** Always use `useMotionPreference()` — intensity 0 must work perfectly.

## Decision Framework

When making choices, follow this priority:

1. **Functional** — It must work
2. **Honest** — It must be true to what it claims
3. **Lovable** — It should delight
4. **Perfect** — Polish comes last

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
