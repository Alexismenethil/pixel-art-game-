export type ChapterId = "chapter-1" | "chapter-2" | "chapter-3" | "chapter-4";

export type LocationId = "hospital" | "bosquete" | "river" | "night" | "room";

export type Mood =
  | "idle"
  | "walk"
  | "soft"
  | "happy"
  | "nervous"
  | "surprised"
  | "shy"
  | "thinking"
  | "finale";

export type ActorId = "alexis" | "kiara";

export type ActorBeatState = {
  x: number;
  y: number;
  scale?: number;
  mood: Mood;
  facing?: "left" | "right";
};

export type StoryBeat = {
  id: string;
  location: LocationId;
  speaker: "Alexis" | "Kiara" | "Ambos" | "Narrador";
  text: string;
  actors: Record<ActorId, ActorBeatState>;
  camera?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  memory?: {
    id: string;
    label: string;
    text: string;
    x: number;
    y: number;
  };
  completeChapter?: boolean;
};

export type Chapter = {
  id: ChapterId;
  number: number;
  title: string;
  route: string;
  lockedTeaser: string;
  beats: StoryBeat[];
};

export const chapters: Chapter[] = [
  {
    id: "chapter-1",
    number: 1,
    title: "La cita que llega al rio",
    route: "Hospital > Bosquete > Rio",
    lockedTeaser: "Empieza aqui.",
    beats: [
      {
        id: "hospital-start",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Aqui empezara la historia real: una cita que puede nacer en el hospital y moverse hasta el rio.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right" },
          kiara: { x: 580, y: 378, mood: "soft", facing: "left" }
        },
        camera: { zoom: 1 }
      },
      {
        id: "hospital-first-words",
        location: "hospital",
        speaker: "Alexis",
        text:
          "Cuando me cuentes que paso exactamente, este dialogo sera tu primera frase real.",
        actors: {
          alexis: { x: 382, y: 378, mood: "thinking", facing: "right" },
          kiara: { x: 552, y: 378, mood: "shy", facing: "left" }
        },
        camera: { zoom: 1.08, x: 470, y: 292 }
      },
      {
        id: "bosquete-walk",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "La escena puede cambiar sin cortar la historia: salen, caminan por el bosquete y el mapa respira alrededor.",
        actors: {
          alexis: { x: 330, y: 378, mood: "walk", facing: "right" },
          kiara: { x: 510, y: 378, mood: "walk", facing: "right" }
        },
        camera: { zoom: 1 }
      },
      {
        id: "bosquete-memory",
        location: "bosquete",
        speaker: "Kiara",
        text:
          "Tambien podemos ocultar recuerdos para que aparezcan solo si ella explora o si tu decides mostrarlos.",
        actors: {
          alexis: { x: 350, y: 378, mood: "soft", facing: "right" },
          kiara: { x: 560, y: 378, mood: "thinking", facing: "left" }
        },
        memory: {
          id: "first-path",
          label: "Detalle del camino",
          text: "Un detalle pequeno del camino que despues podemos cambiar por algo real.",
          x: 744,
          y: 342
        }
      },
      {
        id: "river-arrival",
        location: "river",
        speaker: "Narrador",
        text:
          "Finalmente llegan al rio. El agua se mueve, los personajes reaccionan, y la cita sigue con un simple toque.",
        actors: {
          alexis: { x: 330, y: 378, mood: "happy", facing: "right" },
          kiara: { x: 545, y: 378, mood: "surprised", facing: "left" }
        },
        camera: { zoom: 1 }
      },
      {
        id: "chapter-1-end",
        location: "river",
        speaker: "Ambos",
        text:
          "Capitulo 1 queda listo como estructura. Ahora falta tu historia real para volverlo personal.",
        actors: {
          alexis: { x: 360, y: 378, mood: "finale", facing: "right" },
          kiara: { x: 520, y: 378, mood: "finale", facing: "left" }
        },
        completeChapter: true
      }
    ]
  },
  {
    id: "chapter-2",
    number: 2,
    title: "Primer beso",
    route: "Noche > Puente > Silencio",
    lockedTeaser: "Se desbloquea al terminar el capitulo 1.",
    beats: [
      {
        id: "kiss-placeholder",
        location: "night",
        speaker: "Narrador",
        text: "Este capitulo se escribira despues con el recuerdo real del primer beso.",
        actors: {
          alexis: { x: 360, y: 378, mood: "soft", facing: "right" },
          kiara: { x: 540, y: 378, mood: "shy", facing: "left" }
        },
        completeChapter: true
      }
    ]
  },
  {
    id: "chapter-3",
    number: 3,
    title: "Primera salida",
    route: "Ciudad > Dulce > Promesa",
    lockedTeaser: "Se desbloquea al terminar el capitulo 2.",
    beats: [
      {
        id: "outing-placeholder",
        location: "bosquete",
        speaker: "Narrador",
        text: "Aqui ira la primera salida con objetos, bromas y pequenas decisiones.",
        actors: {
          alexis: { x: 350, y: 378, mood: "happy", facing: "right" },
          kiara: { x: 545, y: 378, mood: "happy", facing: "left" }
        },
        completeChapter: true
      }
    ]
  },
  {
    id: "chapter-4",
    number: 4,
    title: "Cuarto de recuerdos",
    route: "Album > Juegos > Final",
    lockedTeaser: "Se desbloquea al terminar el capitulo 3.",
    beats: [
      {
        id: "room-placeholder",
        location: "room",
        speaker: "Ambos",
        text: "El cuarto sera el album jugable con escenas, minijuegos y finales secretos.",
        actors: {
          alexis: { x: 360, y: 378, mood: "finale", facing: "right" },
          kiara: { x: 520, y: 378, mood: "finale", facing: "left" }
        },
        completeChapter: true
      }
    ]
  }
];
