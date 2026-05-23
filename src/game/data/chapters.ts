export type ChapterId = "chapter-1" | "chapter-2" | "chapter-3" | "chapter-4";

export type LocationId =
  | "taxi"
  | "hospital"
  | "road"
  | "bosquete"
  | "valley"
  | "ravine"
  | "river"
  | "night"
  | "room";

export type Mood =
  | "idle"
  | "walk"
  | "soft"
  | "happy"
  | "laughing"
  | "nervous"
  | "surprised"
  | "shy"
  | "thinking"
  | "talking"
  | "finale";

export type ActorId = "alexis" | "kiara";

export type ActorPose = "back" | "side" | "sitting" | "walking-side";

export type StoryStatId = "ternura" | "nervios" | "sueno";

export type ActorBeatState = {
  x: number;
  y: number;
  scale?: number;
  mood: Mood;
  expression?: string;
  facing?: "left" | "right";
  pose?: ActorPose;
  visible?: boolean;
  reaction?: string;
};

export type SceneProp = {
  texture: string;
  x: number;
  y: number;
  scale?: number;
  depth?: number;
  alpha?: number;
  flipX?: boolean;
  float?: number;
};

export type StoryBeat = {
  id: string;
  location: LocationId;
  speaker: "Alexis" | "Kiara" | "Ambos" | "Narrador" | "Chofer";
  text: string;
  actors: Record<ActorId, ActorBeatState>;
  camera?: {
    x?: number;
    y?: number;
    zoom?: number;
    duration?: number;
    driftX?: number;
    driftY?: number;
    driftSpeed?: number;
  };
  cinematic?: {
    letterbox?: boolean | number;
    warmth?: number;
    vignette?: number;
    flash?: boolean;
    shake?: number;
    shakeDuration?: number;
  };
  memory?: {
    id: string;
    label: string;
    text: string;
    x: number;
    y: number;
  };
  props?: SceneProp[];
  choices?: StoryChoice[];
  completeChapter?: boolean;
};

export type StoryChoice = {
  id: string;
  label: string;
  resultSpeaker?: "Alexis" | "Kiara" | "Ambos" | "Narrador" | "Chofer";
  resultText: string;
  stat?: {
    id: StoryStatId;
    label: string;
    amount?: number;
  };
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
    title: "Donde el rio nos vio",
    route: "Taxi > Hospital > Valle > Rio",
    lockedTeaser: "Empieza aqui.",
    beats: [
      {
        id: "taxi-late",
        location: "taxi",
        speaker: "Narrador",
        text:
          "Julio tenia frio suave. El taxi avanzaba, pero para Alexis cada semaforo parecia quedarse pensando demasiado.",
        actors: {
          alexis: { x: 464, y: 378, mood: "nervous", expression: "panic-late", facing: "left" },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.08, x: 356, y: 292, duration: 820, driftX: 10, driftY: 3, driftSpeed: 1.15 },
        cinematic: { vignette: 0.08, warmth: 0.02 }
      },
      {
        id: "taxi-message",
        location: "taxi",
        speaker: "Kiara",
        text: "Ya llegaste? Estoy cerca del hospital. Apurateee.",
        actors: {
          alexis: { x: 464, y: 378, mood: "surprised", expression: "panic-late", facing: "left" },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.12, x: 354, y: 294, duration: 720, driftX: 8, driftY: 2, driftSpeed: 1.2 },
        cinematic: { vignette: 0.1, shake: 0.0015, shakeDuration: 180 }
      },
      {
        id: "taxi-pressure",
        location: "taxi",
        speaker: "Alexis",
        text: "Jefe, por favor, un poquito mas rapido. No quiero llegar mas tarde de lo que ya estoy.",
        actors: {
          alexis: { x: 464, y: 378, mood: "talking", expression: "panic-late", facing: "left" },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.12, x: 354, y: 294, duration: 680, driftX: 6, driftY: 2, driftSpeed: 1.1 },
        cinematic: { vignette: 0.08 },
        choices: [
          {
            id: "taxi-special",
            label: "Es que ella es especial.",
            resultSpeaker: "Narrador",
            resultText: "El taxi siguio igual, pero Alexis ya habia confesado lo obvio: no era una cita cualquiera.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "taxi-nervous",
            label: "No quiero que se enoje.",
            resultSpeaker: "Narrador",
            resultText: "La prisa no era solo por llegar. Era por no arruinar algo que todavia ni empezaba.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "taxi-calm",
            label: "Respirar y mirar el camino.",
            resultSpeaker: "Narrador",
            resultText: "Alexis respiro hondo. El corazon, claramente, no quiso colaborar.",
            stat: { id: "nervios", label: "Nervios" }
          }
        ]
      },
      {
        id: "taxi-driver-tease",
        location: "taxi",
        speaker: "Chofer",
        text: "Tranquilo, joven. Si es para una chica, seguro igual lo va a esperar.",
        actors: {
          alexis: { x: 464, y: 378, mood: "nervous", expression: "awkward-smile", facing: "left" },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.14, x: 350, y: 294, duration: 820, driftX: 5, driftY: 2, driftSpeed: 0.95 },
        cinematic: { vignette: 0.08, warmth: 0.02 }
      },
      {
        id: "taxi-inner-drama",
        location: "taxi",
        speaker: "Narrador",
        text:
          "El chofer lo dijo como broma. Alexis, en cambio, lo escucho como si el destino acabara de pedirle explicaciones.",
        actors: {
          alexis: { x: 464, y: 378, mood: "thinking", expression: "looking-away-shy", facing: "left" },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.14, x: 350, y: 294, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.8 },
        cinematic: { vignette: 0.1 }
      },
      {
        id: "taxi-last-message",
        location: "taxi",
        speaker: "Kiara",
        text: "Te estoy esperando. No te pierdas.",
        actors: {
          alexis: { x: 464, y: 378, mood: "shy", expression: "soft-love", facing: "left" },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "npc-taxi-driver", x: 244, y: 386, scale: 0.5, depth: 29, alpha: 0.96 }],
        camera: { zoom: 1.14, x: 350, y: 294, duration: 760, driftX: 5, driftY: 2, driftSpeed: 0.9 },
        cinematic: { vignette: 0.08 }
      },
      {
        id: "hospital-first-step",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Cuando bajo del taxi, Alexis intento caminar normal. Spoiler: sus manos, sus ojos y su corazon decidieron actuar por separado.",
        actors: {
          alexis: { x: 392, y: 378, mood: "nervous", expression: "nervous-soft", facing: "right" },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        camera: { zoom: 1.08, x: 448, y: 294, duration: 780, driftX: 2, driftY: 1, driftSpeed: 0.6 },
        cinematic: { warmth: 0.02 }
      },
      {
        id: "kiara-reveal",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Y entonces la vio. Kiara estaba ahi, muy hermosa, como si el hospital hubiera guardado su parte mas bonita solo para ese instante.",
        actors: {
          alexis: { x: 374, y: 378, mood: "surprised", expression: "breathless", facing: "right" },
          kiara: { x: 568, y: 378, mood: "soft", expression: "gentle-smile", facing: "left" }
        },
        camera: { zoom: 1.2, x: 472, y: 294, duration: 1100, driftX: 2, driftY: 1, driftSpeed: 0.48 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.12, flash: true }
      },
      {
        id: "hospital-nerves",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Se miraron. Fueron apenas unos segundos, pero alcanzaron para que ninguno supiera que hacer con las manos.",
        actors: {
          alexis: { x: 374, y: 378, mood: "shy", expression: "awkward-smile", facing: "right" },
          kiara: { x: 568, y: 378, mood: "shy", expression: "close-nervous", facing: "left" }
        },
        camera: { zoom: 1.18, x: 472, y: 294, duration: 900, driftX: 1.5, driftY: 1, driftSpeed: 0.45 },
        cinematic: { letterbox: 22, warmth: 0.04, vignette: 0.1 }
      },
      {
        id: "hospital-unsaid",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Alexis habia ensayado frases en el taxi. Al verla, todas se escondieron. Solo quedo una sonrisa pequena y un monton de nervios.",
        actors: {
          alexis: { x: 376, y: 378, mood: "shy", expression: "looking-away-shy", facing: "right" },
          kiara: { x: 566, y: 378, mood: "soft", expression: "shy-soft", facing: "left" }
        },
        camera: { zoom: 1.18, x: 472, y: 294, duration: 980, driftX: 1.5, driftY: 1, driftSpeed: 0.42 },
        cinematic: { letterbox: 22, warmth: 0.04, vignette: 0.1 }
      },
      {
        id: "hospital-arrival",
        location: "hospital",
        speaker: "Kiara",
        text: "Llegaste tarde.",
        actors: {
          alexis: { x: 372, y: 378, mood: "nervous", expression: "nervous-soft", facing: "right" },
          kiara: { x: 558, y: 378, mood: "talking", expression: "teasing-smile", facing: "left" }
        },
        camera: { zoom: 1.12, x: 470, y: 296, duration: 620 },
        cinematic: { warmth: 0.02 }
      },
      {
        id: "hospital-save",
        location: "hospital",
        speaker: "Alexis",
        text: "Pero llegue.",
        actors: {
          alexis: { x: 382, y: 378, mood: "talking", expression: "trying-cool", facing: "right" },
          kiara: { x: 550, y: 378, mood: "shy", expression: "shy-soft", facing: "left" }
        },
        camera: { zoom: 1.13, x: 470, y: 296, duration: 680 },
        cinematic: { warmth: 0.02 }
      },
      {
        id: "hospital-awkward-joke",
        location: "hospital",
        speaker: "Narrador",
        text:
          "La frase quedo flotando entre los dos. No era una pelea, era peor: era ternura intentando hacerse la valiente.",
        actors: {
          alexis: { x: 382, y: 378, mood: "nervous", expression: "awkward-smile", facing: "right" },
          kiara: { x: 550, y: 378, mood: "thinking", expression: "looking-away-shy", facing: "left" }
        },
        camera: { zoom: 1.12, x: 470, y: 296, duration: 780, driftX: 1, driftY: 1, driftSpeed: 0.52 },
        cinematic: { letterbox: 18, vignette: 0.06 },
        choices: [
          {
            id: "break-ice-pretty",
            label: "Decirle que se ve muy bonita.",
            resultSpeaker: "Alexis",
            resultText: "Estas muy bonita. Lo dijo rapido, casi bajito, como si la frase le quemara de pura verdad.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "break-ice-wait",
            label: "Preguntar si espero mucho.",
            resultSpeaker: "Alexis",
            resultText: "Esperaste mucho? Alexis intento sonar tranquilo. Su voz salio suave, pero sus nervios llegaron primero.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "break-ice-walk",
            label: "Invitarla a caminar.",
            resultSpeaker: "Alexis",
            resultText: "Caminamos? Era una pregunta pequena, pero abrio la puerta para todo lo que venia.",
            stat: { id: "sueno", label: "Sueno compartido" }
          }
        ]
      },
      {
        id: "hospital-smile",
        location: "hospital",
        speaker: "Narrador",
        text: "Ella sonrio. Y con eso, por unos segundos, todo el retraso parecio tener perdon y hasta un poquito de suerte.",
        actors: {
          alexis: { x: 386, y: 378, mood: "shy", expression: "soft-love", facing: "right" },
          kiara: { x: 548, y: 378, mood: "happy", expression: "gentle-smile", facing: "left" }
        },
        memory: {
          id: "first-smile",
          label: "La primera sonrisa",
          text: "Una sonrisa que hizo que Alexis dejara de pensar en la hora y empezara a pensar en ella.",
          x: 704,
          y: 314
        },
        camera: { zoom: 1.19, x: 468, y: 298, duration: 960, driftX: 2, driftY: 1, driftSpeed: 0.48 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "hospital-first-step-together",
        location: "hospital",
        speaker: "Kiara",
        text: "Ya, vamos. Pero camina rapido, para recuperar el tiempo que perdiste.",
        actors: {
          alexis: { x: 384, y: 378, mood: "nervous", expression: "awkward-smile", facing: "right" },
          kiara: { x: 552, y: 378, mood: "laughing", expression: "laughing-haha", facing: "left", reaction: "haha" }
        },
        camera: { zoom: 1.12, x: 468, y: 296, duration: 700, driftX: 1, driftY: 1, driftSpeed: 0.52 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "hospital-narrator-warning",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Lector, aqui Alexis ya estaba perdido. Todavia no lo sabia, pero la historia ya lo habia elegido.",
        actors: {
          alexis: { x: 384, y: 378, mood: "shy", expression: "looking-away-shy", facing: "right" },
          kiara: { x: 552, y: 378, mood: "happy", expression: "gentle-smile", facing: "left" }
        },
        camera: { zoom: 1.08, x: 468, y: 296, duration: 860, driftX: 2, driftY: 1, driftSpeed: 0.42 },
        cinematic: { letterbox: 20, warmth: 0.03, vignette: 0.06 }
      },
      {
        id: "road-walk",
        location: "road",
        speaker: "Narrador",
        text: "Empezaron a caminar sin rumbo, desde el hospital hacia la carretera, hablando de todo y de nada, que a veces es la mejor forma de empezar.",
        actors: {
          alexis: { x: 318, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 462, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false }
        },
        props: [{ texture: "couple-walking-side-01", x: 480, y: 408, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1, x: 510, y: 292, duration: 900, driftX: 14, driftY: 3, driftSpeed: 0.65 }
      },
      {
        id: "road-little-talks",
        location: "road",
        speaker: "Narrador",
        text:
          "Al inicio hablaron con cuidado. Como quien sostiene algo pequeno y bonito, y teme apretarlo demasiado por miedo a que se rompa.",
        actors: {
          alexis: { x: 334, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 478, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false }
        },
        props: [{ texture: "couple-walking-side-02", x: 488, y: 408, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1, x: 516, y: 292, duration: 900, driftX: 16, driftY: 3, driftSpeed: 0.58 }
      },
      {
        id: "road-soft-silence",
        location: "road",
        speaker: "Narrador",
        text:
          "Tambien hubo silencios cortitos. No de esos que incomodan, sino de esos donde uno camina al lado de alguien y se siente acompanado.",
        actors: {
          alexis: { x: 340, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 486, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false }
        },
        props: [{ texture: "couple-walking-side-03", x: 496, y: 408, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1, x: 520, y: 292, duration: 1100, driftX: 20, driftY: 4, driftSpeed: 0.42 },
        cinematic: { warmth: 0.02, vignette: 0.04 }
      },
      {
        id: "road-trust",
        location: "road",
        speaker: "Kiara",
        text: "Y tu siempre llegas asi de tarde o hoy querias hacer drama?",
        actors: {
          alexis: { x: 354, y: 378, mood: "nervous", expression: "nervous-soft", facing: "right" },
          kiara: { x: 548, y: 378, mood: "talking", expression: "teasing-smile", facing: "left" }
        },
        camera: { zoom: 1.08, x: 468, y: 294, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.5 }
      },
      {
        id: "road-trust-answer",
        location: "road",
        speaker: "Alexis",
        text: "Hoy nomas. Bueno... espero que hoy nomas.",
        actors: {
          alexis: { x: 354, y: 378, mood: "talking", expression: "awkward-smile", facing: "right" },
          kiara: { x: 548, y: 378, mood: "laughing", expression: "laughing-haha", facing: "left" }
        },
        camera: { zoom: 1.1, x: 468, y: 294, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.52 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "road-happy",
        location: "road",
        speaker: "Narrador",
        text: "Cuando Kiara sonreia, Alexis sentia una felicidad torpe, grande, dificil de esconder.",
        actors: {
          alexis: { x: 344, y: 378, mood: "happy", expression: "soft-love", facing: "right" },
          kiara: { x: 500, y: 378, mood: "happy", expression: "gentle-smile", facing: "left" }
        },
        camera: { zoom: 1.06, x: 438, y: 292, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.5 },
        cinematic: { warmth: 0.04 }
      },
      {
        id: "road-without-map",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "La carretera quedo atras poco a poco. No tenian un plan perfecto, pero si algo mejor: ganas de seguir caminando.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-01", x: 480, y: 408, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.04, x: 492, y: 286, duration: 1100, driftX: 18, driftY: 5, driftSpeed: 0.38 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.04 }
      },
      {
        id: "road-without-map-2",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "A veces una cita no necesita destino. Necesita que dos personas se atrevan a perderse un poquito juntas.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-02", x: 480, y: 408, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.04, x: 492, y: 286, duration: 1100, driftX: 20, driftY: 5, driftSpeed: 0.36 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.04 }
      },
      {
        id: "purple-bike",
        location: "bosquete",
        speaker: "Kiara",
        text: "Me gusta ese color. Cuando tenga mi moto, va a ser morada.",
        actors: {
          alexis: { x: 332, y: 378, mood: "thinking", facing: "right" },
          kiara: { x: 540, y: 378, mood: "talking", expression: "flirty-soft", facing: "left" }
        },
        memory: {
          id: "purple-bike",
          label: "La moto morada",
          text: "Kiara dijo que su moto seria morada. Desde entonces, ese color dejo de ser un color cualquiera.",
          x: 730,
          y: 326
        },
        props: [{ texture: "prop-purple-moto", x: 850, y: 372, scale: 0.54, depth: 28, float: 0.4 }],
        camera: { zoom: 1.04, x: 492, y: 292, duration: 860, driftX: 6, driftY: 2, driftSpeed: 0.5 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "purple-bike-dream",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "No lo dijo como un comentario cualquiera. Lo dijo con esa seguridad de quien ya se imagino el viento, el camino y su propio color favorito esperandola.",
        actors: {
          alexis: { x: 332, y: 378, mood: "thinking", expression: "soft-love", facing: "right" },
          kiara: { x: 540, y: 378, mood: "happy", expression: "gentle-smile", facing: "left" }
        },
        props: [{ texture: "prop-purple-moto", x: 850, y: 372, scale: 0.54, depth: 28, float: 0.4 }],
        camera: { zoom: 1.06, x: 492, y: 292, duration: 920, driftX: 4, driftY: 2, driftSpeed: 0.45 },
        cinematic: { warmth: 0.04 }
      },
      {
        id: "purple-bike-color",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces el morado ya tiene duena.",
        actors: {
          alexis: { x: 342, y: 378, mood: "talking", expression: "flirty-shy", facing: "right" },
          kiara: { x: 540, y: 378, mood: "shy", expression: "shy-soft", facing: "left" }
        },
        props: [{ texture: "prop-purple-moto", x: 850, y: 372, scale: 0.54, depth: 28, float: 0.4 }],
        camera: { zoom: 1.08, x: 482, y: 292, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.52 }
      },
      {
        id: "purple-bike-joke",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces cuando tengas tu moto morada, me recoges para que ya no llegue tarde.",
        actors: {
          alexis: { x: 352, y: 378, mood: "talking", expression: "trying-cool", facing: "right" },
          kiara: { x: 542, y: 378, mood: "surprised", expression: "surprised-soft", facing: "left" }
        },
        props: [{ texture: "prop-purple-moto", x: 850, y: 372, scale: 0.54, depth: 28, float: 0.4 }],
        camera: { zoom: 1.1, x: 474, y: 292, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.55 },
        cinematic: { shake: 0.0012, shakeDuration: 160 }
      },
      {
        id: "purple-bike-answer",
        location: "bosquete",
        speaker: "Kiara",
        text: "Depende. Si sigues llegando tarde, te dejo caminando.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", expression: "awkward-smile", facing: "right" },
          kiara: { x: 548, y: 378, mood: "laughing", expression: "laughing-haha", facing: "left" }
        },
        props: [{ texture: "prop-purple-moto", x: 850, y: 372, scale: 0.54, depth: 28, float: 0.4 }],
        camera: { zoom: 1.11, x: 476, y: 292, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.52 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "valley-top",
        location: "valley",
        speaker: "Narrador",
        text: "Subieron por los pastizales hasta una pequena cima. Abajo, el valle parecia abrirse despacio, como si tambien quisiera conocerlos.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [{ texture: "couple-valley-back-wide", x: 480, y: 390, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1, x: 486, y: 258, duration: 1200, driftX: 22, driftY: 6, driftSpeed: 0.3 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "valley-wide-view",
        location: "valley",
        speaker: "Narrador",
        text:
          "Desde arriba se veia el rio, los cultivos y el valle entero. El mundo parecia respirar mas despacio, y ellos tambien.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [{ texture: "couple-valley-back-wide", x: 480, y: 390, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1.03, x: 488, y: 252, duration: 1300, driftX: 26, driftY: 6, driftSpeed: 0.28 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "valley-reader-view",
        location: "valley",
        speaker: "Narrador",
        text:
          "Si estuvieras parado ahi con ellos, tal vez tambien habrias hablado mas bajito: la vista pedia cuidado.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [{ texture: "couple-valley-back-close", x: 480, y: 390, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1.03, x: 488, y: 252, duration: 1200, driftX: 24, driftY: 6, driftSpeed: 0.26 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.07 }
      },
      {
        id: "valley-land-joke",
        location: "valley",
        speaker: "Alexis",
        text: "Un dia deberiamos quedarnos con un terrenito por aqui.",
        actors: {
          alexis: { x: 350, y: 366, mood: "talking", expression: "flirty-shy", facing: "right", scale: 0.42 },
          kiara: { x: 520, y: 366, mood: "thinking", expression: "thinking", facing: "left", scale: 0.42 }
        },
        camera: { zoom: 1.1, x: 476, y: 264, duration: 840, driftX: 2, driftY: 1, driftSpeed: 0.42 },
        cinematic: { letterbox: 18, warmth: 0.04 }
      },
      {
        id: "valley-almost-real",
        location: "valley",
        speaker: "Narrador",
        text:
          "La idea nacio como juego, pero por un segundo sonaba tan real que dio un poquito de miedo responder.",
        actors: {
          alexis: { x: 350, y: 366, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.42 },
          kiara: { x: 520, y: 366, mood: "shy", expression: "close-nervous", facing: "left", scale: 0.42 }
        },
        camera: { zoom: 1.12, x: 476, y: 264, duration: 940, driftX: 2, driftY: 1, driftSpeed: 0.38 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.05 }
      },
      {
        id: "valley-house",
        location: "valley",
        speaker: "Kiara",
        text: "Me gustaria una casita con jardin. Con plantitas. Un lugar bonito donde el dia empiece tranquilo.",
        actors: {
          alexis: { x: 336, y: 360, mood: "thinking", expression: "soft-love", facing: "right", scale: 0.42 },
          kiara: { x: 510, y: 360, mood: "talking", expression: "gentle-smile", facing: "left", scale: 0.42 }
        },
        camera: { zoom: 1.06, x: 474, y: 260, duration: 900, driftX: 3, driftY: 1, driftSpeed: 0.4 },
        cinematic: { letterbox: 20, warmth: 0.04 },
        choices: [
          {
            id: "house-valley",
            label: "Una casita con vista al valle.",
            resultSpeaker: "Alexis",
            resultText: "Una casita con jardin y vista al valle. Suena como un buen plan para algun dia.",
            stat: { id: "sueno", label: "Sueno compartido" }
          },
          {
            id: "house-bike",
            label: "Y una moto morada afuera.",
            resultSpeaker: "Alexis",
            resultText: "Y una moto morada estacionada afuera, para que nadie olvide quien eligio el color.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "house-you",
            label: "Mientras estes tu, estaria bien.",
            resultSpeaker: "Alexis",
            resultText: "Mientras estes tu, cualquier lugar se sentiria bonito. Cursi, si. Pero a veces la verdad sale asi.",
            stat: { id: "nervios", label: "Nervios" }
          }
        ]
      },
      {
        id: "valley-garden-detail",
        location: "valley",
        speaker: "Kiara",
        text: "Con flores, pastito, y un jardin bonito. No enorme, pero si cuidado.",
        actors: {
          alexis: { x: 336, y: 360, mood: "soft", expression: "soft-love", facing: "right", scale: 0.42 },
          kiara: { x: 510, y: 360, mood: "talking", expression: "caring", facing: "left", scale: 0.42 }
        },
        camera: { zoom: 1.1, x: 474, y: 260, duration: 880, driftX: 2, driftY: 1, driftSpeed: 0.38 },
        cinematic: { letterbox: 20, warmth: 0.05 }
      },
      {
        id: "valley-could",
        location: "valley",
        speaker: "Kiara",
        text: "Podriamos? Aunque sea imaginarlo por ahora.",
        actors: {
          alexis: { x: 336, y: 360, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.42 },
          kiara: { x: 510, y: 360, mood: "shy", expression: "shy-soft", facing: "left", scale: 0.42 }
        },
        camera: { zoom: 1.14, x: 474, y: 260, duration: 1000, driftX: 1, driftY: 1, driftSpeed: 0.32 },
        cinematic: { letterbox: 26, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "valley-someday",
        location: "valley",
        speaker: "Alexis",
        text: "Si. Algun dia. Y si no es aqui, en algun lugar que se sienta igual de nuestro.",
        actors: {
          alexis: { x: 338, y: 360, mood: "talking", expression: "soft-love", facing: "right", scale: 0.42 },
          kiara: { x: 510, y: 360, mood: "soft", expression: "gentle-smile", facing: "left", scale: 0.42 }
        },
        memory: {
          id: "garden-house",
          label: "La casita con jardin",
          text: "En la cima del valle, imaginaron una casa pequena, con jardin y un futuro que sonaba demasiado bonito.",
          x: 682,
          y: 244
        },
        camera: { zoom: 1.14, x: 474, y: 260, duration: 1100, driftX: 1, driftY: 1, driftSpeed: 0.3 },
        cinematic: { letterbox: 26, warmth: 0.07, vignette: 0.08 }
      },
      {
        id: "valley-silence-after-dream",
        location: "valley",
        speaker: "Narrador",
        text:
          "No firmaron nada, no prometieron nada. Pero el valle guardo la frase como si fuera una semilla.",
        actors: {
          alexis: { x: 338, y: 360, mood: "soft", facing: "right", scale: 0.42, visible: false },
          kiara: { x: 510, y: 360, mood: "soft", facing: "left", scale: 0.42, visible: false }
        },
        props: [{ texture: "couple-valley-back-close", x: 480, y: 390, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1.08, x: 474, y: 260, duration: 1100, driftX: 4, driftY: 2, driftSpeed: 0.28 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "downhill",
        location: "ravine",
        speaker: "Narrador",
        text:
          "Sin darse cuenta, ya bajaban por la quebrada. El camino era tierra, pasto y un silencio lleno de cosas que ninguno queria pisar muy fuerte.",
        actors: {
          alexis: { x: 330, y: 382, mood: "walk", facing: "right", visible: false },
          kiara: { x: 470, y: 382, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-03", x: 482, y: 410, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1, x: 502, y: 292, duration: 1200, driftX: 22, driftY: 5, driftSpeed: 0.32 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.04 }
      },
      {
        id: "downhill-careful",
        location: "ravine",
        speaker: "Kiara",
        text: "Cuidado por ahi, no te vayas a resbalar.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-02", x: 482, y: 410, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.08, x: 494, y: 286, duration: 900, driftX: 8, driftY: 3, driftSpeed: 0.45 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "downhill-response",
        location: "ravine",
        speaker: "Alexis",
        text: "Yo? No, yo bajo con total control.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-04", x: 482, y: 410, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.09, x: 494, y: 286, duration: 760, driftX: 5, driftY: 2, driftSpeed: 0.5 },
        cinematic: { letterbox: 18, warmth: 0.03, shake: 0.001, shakeDuration: 140 }
      },
      {
        id: "downhill-response-truth",
        location: "ravine",
        speaker: "Narrador",
        text:
          "Mentira. Iba calculando cada paso como si la tierra tuviera una entrevista pendiente con su orgullo.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-03", x: 482, y: 410, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.09, x: 494, y: 286, duration: 860, driftX: 5, driftY: 2, driftSpeed: 0.44 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "she-like-sky",
        location: "ravine",
        speaker: "Narrador",
        text:
          "Cada vez que Alexis la miraba, Kiara se sentia como el cielo: calma, miedo y belleza en el mismo lugar. Uno de esos cielos que no se pueden mirar rapido.",
        actors: {
          alexis: { x: 346, y: 378, mood: "shy", expression: "soft-love", facing: "right" },
          kiara: { x: 520, y: 378, mood: "soft", expression: "looking-away-shy", facing: "left" }
        },
        camera: { zoom: 1.14, x: 466, y: 292, duration: 1200, driftX: 2, driftY: 1, driftSpeed: 0.34 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "ravine-reader-step",
        location: "ravine",
        speaker: "Narrador",
        text:
          "Y tu, mirando desde cerquita, habrias bajado mas lento tambien. No por el camino, sino por no arruinar ese pedacito de mundo.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [{ texture: "couple-walking-back-04", x: 482, y: 410, scale: 0.47, depth: 32, float: 1 }],
        camera: { zoom: 1.04, x: 500, y: 284, duration: 1300, driftX: 18, driftY: 5, driftSpeed: 0.26 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.06 }
      },
      {
        id: "river-arrival",
        location: "river",
        speaker: "Narrador",
        text:
          "Entre cultivos de frutas llegaron a la orilla del rio. El agua sonaba tranquila, como si supiera guardar secretos bonitos.",
        actors: {
          alexis: { x: 326, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 498, y: 378, mood: "happy", facing: "right", pose: "walking-side", visible: false }
        },
        props: [{ texture: "couple-walking-side-04", x: 486, y: 408, scale: 0.5, depth: 32, float: 0.8 }],
        camera: { zoom: 1, x: 486, y: 292, duration: 1400, driftX: 24, driftY: 6, driftSpeed: 0.24 },
        cinematic: { letterbox: 18, warmth: 0.04, vignette: 0.04 }
      },
      {
        id: "river-first-breath",
        location: "river",
        speaker: "Narrador",
        text:
          "El rio no hacia ruido fuerte. Sonaba como una conversacion bajita, de esas que no quieren interrumpir a nadie.",
        actors: {
          alexis: { x: 326, y: 378, mood: "soft", expression: "soft-love", facing: "right" },
          kiara: { x: 536, y: 378, mood: "happy", expression: "gentle-smile", facing: "left" }
        },
        camera: { zoom: 1.05, x: 486, y: 292, duration: 1200, driftX: 10, driftY: 4, driftSpeed: 0.3 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "river-sit-down",
        location: "river",
        speaker: "Kiara",
        text: "Sentemonos aqui un ratito.",
        actors: {
          alexis: { x: 326, y: 378, mood: "soft", expression: "soft-love", facing: "right" },
          kiara: { x: 536, y: 378, mood: "talking", expression: "caring", facing: "left" }
        },
        camera: { zoom: 1.08, x: 486, y: 292, duration: 900, driftX: 6, driftY: 2, driftSpeed: 0.34 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "river-close-enough",
        location: "river",
        speaker: "Narrador",
        text:
          "Se sentaron cerca, no demasiado. Lo suficiente para que el silencio tuviera calor y para que Alexis cuidara hasta como respiraba.",
        actors: {
          alexis: { x: 328, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 532, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-normal", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.12, x: 484, y: 292, duration: 1100, driftX: 4, driftY: 2, driftSpeed: 0.32 },
        cinematic: { letterbox: 24, warmth: 0.05, vignette: 0.07 }
      },
      {
        id: "river-reader-breath",
        location: "river",
        speaker: "Narrador",
        text:
          "Si hubieras estado ahi, habrias entendido por que nadie tenia prisa: el rio, ellos y hasta el aire iban despacio.",
        actors: {
          alexis: { x: 328, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 532, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-normal", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.1, x: 486, y: 290, duration: 1300, driftX: 10, driftY: 4, driftSpeed: 0.25 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "river-snacks",
        location: "river",
        speaker: "Kiara",
        text: "Traje gomitas. Y este vasito con cereal y yogurt. Por si nos daba hambre.",
        actors: {
          alexis: { x: 336, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 540, y: 378, mood: "talking", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-snacks", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        memory: {
          id: "river-snacks",
          label: "Gomitas junto al rio",
          text: "No hubo mantel ni plan perfecto. Solo gomitas, cereal con yogurt y el rio acompanando.",
          x: 694,
          y: 334
        },
        camera: { zoom: 1.1, x: 472, y: 294, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.35 },
        cinematic: { letterbox: 20, warmth: 0.05, vignette: 0.05 }
      },
      {
        id: "river-snacks-choice",
        location: "river",
        speaker: "Narrador",
        text:
          "El picnic era improvisado, pero tenia algo que ningun plan caro compra: parecia pensado por ella.",
        actors: {
          alexis: { x: 336, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 540, y: 378, mood: "talking", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-snacks", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.1, x: 472, y: 294, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.34 },
        cinematic: { letterbox: 20, warmth: 0.05, vignette: 0.05 },
        choices: [
          {
            id: "snacks-thanks",
            label: "Agradecerle por traer dulces.",
            resultSpeaker: "Alexis",
            resultText: "Gracias por traer esto. Se siente bonito que hayas pensado en traer algo para los dos.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "snacks-joke",
            label: "Bromear con que vino preparada.",
            resultSpeaker: "Alexis",
            resultText: "Tu si viniste preparada. Yo vine con nervios y cero estrategia.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "snacks-share",
            label: "Pedir una gomita para compartir.",
            resultSpeaker: "Narrador",
            resultText: "Compartieron las gomitas como si fuera un ritual pequeno. Dulce, simple, peligroso para el corazon.",
            stat: { id: "sueno", label: "Sueno compartido" }
          }
        ]
      },
      {
        id: "river-tease",
        location: "river",
        speaker: "Kiara",
        text: "Alguien tenia que venir preparada. Tu ni llegaste temprano.",
        actors: {
          alexis: { x: 338, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "laughing", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-snacks", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.11, x: 472, y: 294, duration: 760, driftX: 3, driftY: 1, driftSpeed: 0.44 },
        cinematic: { letterbox: 18, warmth: 0.05, shake: 0.001, shakeDuration: 120 }
      },
      {
        id: "river-look",
        location: "river",
        speaker: "Narrador",
        text:
          "Alexis intentaba escucharla, pero cada vez que la miraba se le desordenaba la frase siguiente y se le ordenaba el corazon.",
        actors: {
          alexis: { x: 338, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-close", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.14, x: 470, y: 292, duration: 1200, driftX: 2, driftY: 1, driftSpeed: 0.3 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "river-not-anywhere-else",
        location: "river",
        speaker: "Narrador",
        text:
          "No queria estar en ningun otro lugar. Ni en su casa, ni en otra ciudad, ni en ningun universo donde ella no estuviera sentada ahi.",
        actors: {
          alexis: { x: 338, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-close", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.16, x: 470, y: 292, duration: 1250, driftX: 2, driftY: 1, driftSpeed: 0.28 },
        cinematic: { letterbox: 26, warmth: 0.07, vignette: 0.09 }
      },
      {
        id: "river-little-distance",
        location: "river",
        speaker: "Narrador",
        text:
          "El mundo les dejo un espacio pequeno. No para separarlos, sino para que ambos decidieran, sin apuro, si querian cruzarlo.",
        actors: {
          alexis: { x: 338, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-close", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.16, x: 468, y: 292, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.24 },
        cinematic: { letterbox: 28, warmth: 0.07, vignette: 0.1 }
      },
      {
        id: "river-silence",
        location: "river",
        speaker: "Narrador",
        text: "Hablaron al lado del rio. Luego el silencio cambio: ya no era incomodo, era lento, suave y peligrosamente bonito.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "couple-river-sitting-close", x: 480, y: 384, scale: 0.52, depth: 32, float: 1.2 }],
        camera: { zoom: 1.18, x: 464, y: 294, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.23 },
        cinematic: { letterbox: 30, warmth: 0.08, vignette: 0.11 },
        choices: [
          {
            id: "kiss-closer",
            label: "Acercarse despacio.",
            resultSpeaker: "Narrador",
            resultText: "Alexis se acerco apenas. Kiara no se alejo. El rio siguio hablando por los dos, bajito, como pidiendo cuidado.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "kiss-smile",
            label: "Mirarla y sonreir.",
            resultSpeaker: "Narrador",
            resultText: "Una sonrisa pequena basto para decir lo que ninguno se animaba a decir todavia.",
            stat: { id: "sueno", label: "Sueno compartido" }
          },
          {
            id: "kiss-river",
            label: "Decir algo nervioso del rio.",
            resultSpeaker: "Alexis",
            resultText: "El rio suena bonito, no? Si, Alexis. Muy poetico. Muy obvio. Muy tu.",
            stat: { id: "nervios", label: "Nervios" }
          }
        ]
      },
      {
        id: "almost-kiss",
        location: "river",
        speaker: "Narrador",
        text:
          "El espacio entre los dos empezo a hacerse pequeno. No de golpe. Despacito, con esa paciencia que tienen los momentos que importan.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "couple-almost-kiss-01", x: 480, y: 384, scale: 0.54, depth: 32, float: 0.8 }],
        camera: { zoom: 1.22, x: 464, y: 294, duration: 1400, driftX: 0.6, driftY: 0.6, driftSpeed: 0.2 },
        cinematic: { letterbox: 34, warmth: 0.09, vignette: 0.12 }
      },
      {
        id: "almost-kiss-world",
        location: "river",
        speaker: "Narrador",
        text:
          "El rio siguio corriendo. El valle siguio quieto. Y por alguna razon, todo parecia esperar con ellos.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "couple-almost-kiss-02", x: 480, y: 384, scale: 0.54, depth: 32, float: 0.8 }],
        camera: { zoom: 1.24, x: 464, y: 294, duration: 1500, driftX: 0.4, driftY: 0.4, driftSpeed: 0.18 },
        cinematic: { letterbox: 36, warmth: 0.1, vignette: 0.13 }
      },
      {
        id: "almost-kiss-reader-hold",
        location: "river",
        speaker: "Narrador",
        text:
          "Aqui uno casi quiere apartar la mirada, por respeto. Pero tambien quiere quedarse, porque algo hermoso esta a punto de pasar.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [{ texture: "couple-almost-kiss-03", x: 480, y: 384, scale: 0.54, depth: 32, float: 0.8 }],
        camera: { zoom: 1.25, x: 464, y: 294, duration: 1500, driftX: 0.35, driftY: 0.35, driftSpeed: 0.16 },
        cinematic: { letterbox: 38, warmth: 0.11, vignette: 0.14 }
      },
      {
        id: "first-kiss",
        location: "river",
        speaker: "Narrador",
        text:
          "Entonces paso. Su primer beso junto al rio. Fue corto, pero el mundo completo parecio prender una luz chiquita solo para ellos.",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [{ texture: "couple-kiss-sitting", x: 480, y: 384, scale: 0.56, depth: 32, float: 0.7 }],
        camera: { zoom: 1.3, x: 456, y: 292, duration: 1550, driftX: 0.25, driftY: 0.25, driftSpeed: 0.14 },
        cinematic: { letterbox: 42, warmth: 0.12, vignette: 0.12, flash: true, shake: 0.0015, shakeDuration: 260 }
      },
      {
        id: "first-kiss-universes",
        location: "river",
        speaker: "Narrador",
        text:
          "Fue un beso corto. Pero dentro de Alexis duro como si hubieran pasado por muchos universos en un segundo.",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [{ texture: "couple-kiss-sitting", x: 480, y: 384, scale: 0.56, depth: 32, float: 0.7 }],
        camera: { zoom: 1.34, x: 456, y: 292, duration: 1500, driftX: 0.2, driftY: 0.2, driftSpeed: 0.12 },
        cinematic: { letterbox: 44, warmth: 0.13, vignette: 0.1 }
      },
      {
        id: "first-kiss-heaven",
        location: "river",
        speaker: "Narrador",
        text:
          "Todo se sintio mas brillante: el agua, el aire, el cielo, ella. Sobre todo ella.",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [{ texture: "couple-kiss-sitting", x: 480, y: 384, scale: 0.56, depth: 32, float: 0.7 }],
        camera: { zoom: 1.36, x: 456, y: 292, duration: 1450, driftX: 0.2, driftY: 0.2, driftSpeed: 0.12 },
        cinematic: { letterbox: 44, warmth: 0.14, vignette: 0.08 }
      },
      {
        id: "after-kiss",
        location: "river",
        speaker: "Narrador",
        text: "Cuando se separaron, no hicieron falta palabras. A veces respirar juntito ya es bastante despues de un momento asi.",
        actors: {
          alexis: { x: 384, y: 378, mood: "shy", expression: "after-kiss-shy", facing: "right" },
          kiara: { x: 526, y: 378, mood: "shy", expression: "after-kiss-blush", facing: "left", reaction: "<3" }
        },
        camera: { zoom: 1.18, x: 456, y: 292, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.24 },
        cinematic: { letterbox: 30, warmth: 0.09, vignette: 0.08 }
      },
      {
        id: "chapter-1-end",
        location: "river",
        speaker: "Narrador",
        text: "Desde ese dia, ese lugar dejo de ser solo un rio. Fue donde el valle los vio imaginar una casa, reir bajito y besarse por primera vez.",
        actors: {
          alexis: { x: 366, y: 378, mood: "finale", facing: "right" },
          kiara: { x: 526, y: 378, mood: "finale", facing: "left" }
        },
        camera: { zoom: 1.02, x: 478, y: 288, duration: 1400, driftX: 12, driftY: 4, driftSpeed: 0.24 },
        cinematic: { letterbox: 20, warmth: 0.06, vignette: 0.05 },
        completeChapter: true
      }
    ]
  },
  {
    id: "chapter-2",
    number: 2,
    title: "Despues del primer beso",
    route: "Noche > Puente > Silencio",
    lockedTeaser: "Se desbloquea al terminar el capitulo 1.",
    beats: [
      {
        id: "kiss-placeholder",
        location: "night",
        speaker: "Narrador",
        text: "Este capitulo se escribira despues con lo que paso cuando el rio dejo de ser el final.",
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
