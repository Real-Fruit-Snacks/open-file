# AGENTS.md — Repository Guardrails (open-file)

This repository is part of **Real-Fruit-Snacks** (**RFS**) and follows the **Cyclorama Dawn `v2.1.0` — Steel & Beacon Orange + Signal Crimson Fault** brand system (`Real-Fruit-Snacks/rfs-brand`).

## Core Commitments

1. **Local-first offline chess trainer:** Runs entirely in the browser with Stockfish WASM and optional Maia-3 ONNX; zero accounts, zero tracking, and optional network features off by default.
2. **British English & plain, honest voice:** Keep UI copy in British English with no emoji, no hype copy, and no exclamation marks in headings or descriptions.
3. **Strict CI gates:** Keep `npm run check` (`lint`, `lint:dead`, `format:check`, `typecheck`, `test`, `build`, `bundle:check`), Playwright E2E + `axe-core` WCAG 2.1 A/AA contrast sweeps, Lighthouse, and visual baselines green.

## Brand & UI Rules (`rfs-brand` v2.1.0)

- **Theme & Motion:** Matte Dark (`#050507`, `LX 263`) is the explicit default (`<meta name="color-scheme" content="dark">`, `DEFAULT_SETTINGS.colorScheme = 'dark'`); Alabaster Day (`#F5F7F9`, `LX 512`) and `System` are opt-in choices synchronized with `rfs-theme` (`localStorage`) and radial View Transitions under `prefers-reduced-motion: no-preference`.
- **Palette:** Glacial Steel (`#1F547A` / `#74B8E8` / `#164669`), Maritime Beacon Orange (`#F06E2B` / `#BD4811` / `#FF9254` / `#AD3D0A`), Signal Crimson Fault (`#FF5C6C` / `#C92438` / `#E02E44` dark, `#B91C2E` / `#991525` light, `#FFFFFF` on-fault), Amber (`#FFC247` / `#885800`), Mint (`#3DDC97` / `#127247`). Interpolate primary and horizon gradients in Cartesian `in oklab` (never `in oklch`), with zero neon glows.
- **Typography:** Six self-hosted variable `.woff2` files in `src/styles/fonts/` (`Big Shoulders Stencil`, `Albert Sans`, `Azeret Mono`, latin + latin-ext) licensed under `LICENSES/OFL-1.1.txt` (published as `licence-ofl.txt`).
- **Shapes & Dialogs:** Use sharp technical radii (`4px`/`6px`/`8px`) with no capsule pills on badges or chips. Never use `window.alert()`, `window.confirm()`, or `window.prompt()`; use `<Dialog>` / `<ConfirmDialog danger>` with `autoFocus` on **Cancel** and solid Signal Crimson confirm buttons.
- **Board Readability:** Never tint or alter chess board square themes or piece sets — keep every board palette and piece graphic razor-sharp in both `LX 263` and `LX 512`.
- **README & Docs (`BRAND.md` §14):** Keep `README.md` ultra-minimal (40–60 lines); put detailed guides, screenshots, known issues, and hosting instructions in `docs/*.md` (never GitHub Wiki).
