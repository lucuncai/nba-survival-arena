# Street Legends: Last Stand

A modern, browser-based streetball action-defense game. Protect the center rim, read incoming
shots, build a combo, and survive five escalating possessions.

This repository contains a ground-up TypeScript/Phaser rebuild of the original NBA Survival Arena.
The previous self-contained implementation remains in [`legacy/`](./legacy/) for reference.

## Play

The production build is deployed through GitHub Pages after changes reach `main`:

https://lucuncai.github.io/nba-survival-arena/

For local development:

```bash
npm install
npm run dev
```

Vite prints the local URL. The game is designed for a 16:9 landscape viewport.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse | Aim |
| Hold left click or J | Swat |
| Q | Chasedown Block |
| E | Power Drive |
| R | Court Quake |
| Space | King's Court ultimate |
| Escape | Pause |

Touch devices receive a left virtual stick and dedicated action buttons.

## Current vertical slice

- Five authored waves culminating in a multi-shot boss.
- Manual aiming and character-specific melee defense.
- Curved, readable basketball trajectories with body blocks and active interceptions.
- Three skills, a Hype-powered ultimate, combos, scoring, and nine run upgrades.
- Responsive HUD, pause/tutorial/results flows, procedural sound, and local best-run records.
- Procedurally authored street-court, character, projectile, lighting, and VFX assets.

## Architecture

```text
src/
├── core/                 # Typed events, deterministic RNG, versioned save storage
├── game/                 # Data, entities, wave director, audio and effects systems
├── scenes/               # Boot, menu, gameplay and results scene orchestration
├── ui/                   # Responsive and accessible DOM interface
├── main.ts               # Phaser bootstrap
└── styles.css            # Visual system and responsive layout
tests/
├── unit/                 # Deterministic game-logic tests
└── e2e/                  # Browser boot/playability smoke test
legacy/                   # Preserved v1 source and single-file build
```

The game uses composition and focused systems rather than prototype mixins or a full ECS. Gameplay
definitions are data-driven, project code uses ES modules, assets are generated independently of the
shipping HTML, and Vite produces the deployable bundle.

## Quality commands

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run test:e2e
npm run check
```

Pull requests run linting, unit tests, a production build, and the Playwright browser smoke test.
Merges to `main` deploy `dist/` through the GitHub Pages workflow.

## Product direction

This slice establishes the quality bar around The King. The next content layers are additional
legends with distinct basic attacks, elite modifiers, richer boss phases, authored sprite atlases,
music, accessibility settings, and more arenas. Online multiplayer and account systems remain
deliberately outside the core rebuild.

## License

MIT. The rebuild uses an original fictional streetball presentation; third-party trademarks and
athlete likenesses are intentionally excluded from the new game.
