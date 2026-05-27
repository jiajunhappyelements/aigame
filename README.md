# AI GameJam Sling Guardians Prototype

A small Phaser + TypeScript prototype for an AI GameJam.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
```

The static output is generated in `dist/`.

## Current Gameplay

- Choose an unlocked unit card to spend stamina and load it into the slingshot.
- Drag the pending unit and release to launch it onto the battlefield.
- Units fight automatically after landing.
- Stamina regenerates over time; kills grant coins.
- Click the left upgrade button to buy a three-card random upgrade choice.

## Asset Workflow

- Keep static gameplay art as individual PNG files in `public/assets/sprites/`. These are loaded through `src/config/sprites.ts`.
- Placeholder-only characters remain procedural until final art is ready, so prototype gameplay does not wait for production assets.
- Put each transparent character or effect frame under `public/assets/animation-source/<group>/<id>/<action>/`, using the same canvas size and foot anchor throughout a sequence, then register playable sequences in `src/config/animations.ts`.
- Publish only animation frames into the runtime atlas:

```bash
npm run assets:animations
```

This writes `public/assets/atlas/animations.png` and `animations.json` in Phaser 3 multiatlas format. Animation frames are deliberately packed without trimming so playback does not resize or shift between poses. Commit both the source frames and generated atlas output so teammates can run the game without installing TexturePacker.
