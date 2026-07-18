# AGENTS.md

## Cursor Cloud specific instructions

This repo is **NBA Survival Arena — Hoop Defense**, a client-side 2D browser game
built on Phaser 3. There is **no backend, no package manager, and no npm/node
dependencies**. The only runtime requirement is Python 3 (stdlib only), which is
preinstalled. The game ships as a single self-contained `index.html`.

### Services
There is exactly one "service": a static file server hosting `index.html`.
Standard run/build commands are documented in `README.md`; the notes below only
capture the non-obvious caveats.

- **Run (dev):** `python3 -m http.server 8080` from the repo root, then open
  `http://localhost:8080/index.html`. The Phaser game is exposed on
  `window._phaserGame`, which is handy for driving it in headless tests.
- **Build:** `python3 assemble.py` (writes `index_v2.html`), then
  `cp index_v2.html index.html`. `index_v2.html` is a gitignored build artifact.
- **Lint / tests:** none exist (no `package.json`, no test files, no linter
  config). "Lint/build" for this repo effectively means running `assemble.py`,
  which self-verifies script-tag balance and the presence of key blocks.

### Critical build gotcha
`assemble.py` **reads the existing `index.html`** to extract the embedded Phaser
engine (~1.2 MB) and the `SPRITE_DATA` block (~1.7 MB), then re-concatenates them
with the modules in `src/`. Consequences:
- Never delete `index.html` — it is the source of truth for the Phaser engine and
  the base64 sprite sheets. `src/` only holds the game logic modules.
- Editing files under `src/` has **no effect** until you rebuild and copy
  `index_v2.html` over `index.html`.

### Verifying it works (headless)
Chrome is available at `/usr/local/bin/google-chrome`. You can drive the game
headlessly with Playwright: load the page, wait for `window._phaserGame` and the
`Menu` scene, then `window._phaserGame.scene.start('Game', { charIndex: 1 })` to
jump into gameplay. Game state lives on the `Game` scene (`gameTime`, `kills`,
`hoop.hp`, `player.level`, `enemies`). A stray `404 /favicon.ico` from the static
server is expected and harmless.
