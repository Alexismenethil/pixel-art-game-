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
- Layered PNG backgrounds for chapter 1 locations in `public/assets/chapter-1`.
- Full-frame character sprite replacement for emotions. No runtime face patches.
- Character actor system with mood states: walk, happy, nervous, surprised, shy, talking, thinking and finale.
- Optional guides and memory markers that can be hidden for immersion.
- Local progress saved in `localStorage`.
- Portrait-phone orientation hint; gameplay is designed for landscape.

## Commands

```bash
npm install
npm run generate:art
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

## Character Frames

Character frames live in:

```text
public/assets/characters/alexis/
public/assets/characters/kiara/
```

Each emotion is a complete PNG frame, for example:

```text
alexis/happy.png
alexis/surprised.png
kiara/talking.png
kiara/scared.png
```

Important: do not build expressions by drawing eyes or mouths on top at runtime. If an emotion changes, replace the entire PNG frame. That keeps the pixel art clean and avoids deformed faces.

The current generated frames are structural placeholders. The next art pass should replace each file with a final full-body pixel-art frame for that exact emotion.

## Music

Put audio files in:

```text
public/assets/audio/
```

Recommended names:

```text
home.mp3
chapter-1.mp3
chapter-2.mp3
```

Use `.ogg` too if you want better browser compatibility:

```text
home.ogg
chapter-1.ogg
```

Do not use copyrighted YouTube music in a public deployed game unless you have permission or a license. Good options are: your own music, commissioned music, royalty-free libraries, or music with a Creative Commons license that allows reuse.

## Next Story Inputs Needed

For chapter 1, describe the real sequence:

- Where the hospital part happened.
- Why the date moved from there.
- What happened in the bosquete.
- How you arrived at the river.
- What Kiara said or did that you remember clearly.
- One object, joke or small detail to turn into an interaction.
- How the chapter should end.
