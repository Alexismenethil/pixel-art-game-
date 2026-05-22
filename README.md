# Alexis & Kiara Pixel Story Game

Web game base for an interactive pixel-art love story.

## Stack

- Vite for fast local development and static deployment.
- TypeScript for safer game data and scene contracts.
- Phaser for maps, camera movement, scenes, character actors, animations, input and transitions.
- Static assets in `public/assets` so the game works after production build.

No backend is needed yet. Add one later only if the game needs cloud saves, accounts, editable content, analytics or shared galleries.

## Current Features

- Boot/loading scene.
- Home scene with chapter cards.
- Chapters unlock after completing the previous one.
- Story scene advances by tapping/clicking the screen, without continue buttons.
- Multiple map locations inside one chapter: hospital, bosquete and river.
- Animated pixel backgrounds generated in Phaser.
- Character actor system with mood states: walk, happy, nervous, surprised, shy, thinking and finale.
- Optional guides and memory markers that can be hidden for immersion.
- Local progress saved in `localStorage`.
- Portrait-phone orientation hint; gameplay is designed for landscape.

## Commands

```bash
npm install
npm run dev
npm run build
```

Local dev URL:

```text
http://127.0.0.1:5173
```

If that port is busy, Vite will print the next available port.

## Where To Write The Story

Story content lives in:

```text
src/game/data/chapters.ts
```

Each beat can change:

- location/map
- speaker and text
- character position
- character mood/reaction
- camera zoom/pan
- optional memory marker
- chapter completion

## Next Story Inputs Needed

For chapter 1, describe the real sequence:

- Where the hospital part happened.
- Why the date moved from there.
- What happened in the bosquete.
- How you arrived at the river.
- What Kiara said or did that you remember clearly.
- One object, joke or small detail to turn into an interaction.
- How the chapter should end.
