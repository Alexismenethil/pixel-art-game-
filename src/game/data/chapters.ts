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
    heartbeat?: number;
    intimate?: boolean;
    bloom?: number;
    chromatic?: boolean;
    slowmo?: number;
    magicShift?: boolean;
    godrays?: number;
    petals?: boolean;
    locationCard?: { title: string; subtitle?: string };
    whisper?: string;
    holdMs?: number;
    hideDialogue?: boolean;
    persistDialogue?: boolean;
    lockInput?: boolean;
  };
  pace?: "slow" | "normal" | "fast" | "urgent" | "freeze";
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
          alexis: { x: 464, y: 378, mood: "nervous", facing: "left", visible: false },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 610, y: 532, scale: 0.54, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 540, y: 342, duration: 920, driftX: 6, driftY: 2, driftSpeed: 1.05 },
        cinematic: {
          vignette: 0.08,
          warmth: 0.04,
          locationCard: { title: "Taxi", subtitle: "Julio · tarde · ya muy tarde" }
        },
        pace: "fast"
      },
      {
        id: "taxi-message",
        location: "taxi",
        speaker: "Kiara",
        text: "Ya llegaste? Estoy cerca del hospital. Apurateee.",
        actors: {
          alexis: { x: 464, y: 378, mood: "surprised", facing: "left", visible: false },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 532, scale: 0.62, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.3, x: 640, y: 352, duration: 720, driftX: 4, driftY: 2, driftSpeed: 1.2 },
        cinematic: { vignette: 0.1, shake: 0.0015, shakeDuration: 180 },
        pace: "urgent"
      },
      {
        id: "taxi-pressure",
        location: "taxi",
        speaker: "Alexis",
        text: "Jefe, por favor, un poquito mas rapido. No quiero llegar mas tarde de lo que ya estoy.",
        actors: {
          alexis: { x: 464, y: 378, mood: "talking", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 532, scale: 0.64, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.32, x: 640, y: 354, duration: 680, driftX: 3, driftY: 1, driftSpeed: 1.1 },
        cinematic: { vignette: 0.08 },
        pace: "fast",
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
          alexis: { x: 464, y: 378, mood: "nervous", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 532, scale: 0.58, depth: 32, alpha: 0.9, float: 0.25 }
        ],
        camera: { zoom: 1.14, x: 360, y: 342, duration: 720, driftX: 4, driftY: 2, driftSpeed: 0.9 },
        cinematic: { vignette: 0.1, warmth: 0.05, bloom: 0.05, whisper: "la voz del chofer llego desde adelante" },
        pace: "normal"
      },
      {
        id: "taxi-inner-drama",
        location: "taxi",
        speaker: "Narrador",
        text:
          "El chofer lo dijo como broma. Alexis, en cambio, lo escucho como si el destino acabara de pedirle explicaciones.",
        actors: {
          alexis: { x: 464, y: 378, mood: "thinking", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 532, scale: 0.66, depth: 32, float: 0.22 }
        ],
        camera: { zoom: 1.36, x: 640, y: 354, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.8 },
        cinematic: { vignette: 0.1, whisper: "el corazon no quiso colaborar" }
      },
      {
        id: "taxi-last-message",
        location: "taxi",
        speaker: "Kiara",
        text: "Te estoy esperando. No te pierdas.",
        actors: {
          alexis: { x: 464, y: 378, mood: "shy", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 532, scale: 0.68, depth: 32, float: 0.22 }
        ],
        camera: { zoom: 1.38, x: 642, y: 356, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.9 },
        cinematic: { vignette: 0.08, bloom: 0.06, whisper: "no te pierdas..." },
        pace: "slow"
      },
      {
        id: "hospital-establishing",
        location: "hospital",
        speaker: "Narrador",
        text:
          "El taxi paro frente al antiguo hospital. Era un edificio conocido, si, pero ese dia parecia iluminado de otra forma, como si supiera que iba a guardar un secreto.",
        actors: {
          alexis: { x: 0, y: 0, mood: "idle", facing: "right", visible: false },
          kiara: { x: 0, y: 0, mood: "idle", facing: "left", visible: false }
        },
        props: [{ texture: "scene-hospital-wide-old", x: 480, y: 540, scale: 0.574, depth: 23 }],
        camera: { zoom: 0.96, x: 480, y: 270, duration: 1100, driftX: 6, driftY: 2, driftSpeed: 0.4 },
        cinematic: {
          letterbox: 38,
          warmth: 0.05,
          vignette: 0.06,
          bloom: 0.06,
          flash: true,
          locationCard: { title: "Hospital", subtitle: "Aqui empieza todo" }
        },
        pace: "slow"
      },
      {
        id: "hospital-first-step",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Alexis bajo intentando verse tranquilo. El plan duro exactamente dos pasos: el celular aun pesaba en su mano y el corazon ya iba corriendo antes que el.",
        actors: {
          alexis: { x: 438, y: 452, mood: "nervous", expression: "looking-phone", facing: "right", scale: 0.56 },
          kiara: { x: 0, y: 0, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "prop-taxi", x: 130, y: 525, scale: 0.42, depth: 29, alpha: 0.82 }
        ],
        camera: { zoom: 1.16, x: 438, y: 314, duration: 900, driftX: 4, driftY: 1, driftSpeed: 0.5 },
        cinematic: {
          warmth: 0.03,
          locationCard: { title: "Hospital", subtitle: "Aqui empieza todo" },
          whisper: "respira hondo, ya llegaste"
        },
        pace: "slow"
      },
      {
        id: "hospital-spot-kiara",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Levanto la vista. Al otro lado de la entrada, entre la luz tibia y las sombras de los arboles, Kiara estaba esperando.",
        actors: {
          alexis: { x: 398, y: 452, mood: "surprised", expression: "wide-eyes-love", facing: "right", scale: 0.54 },
          kiara: { x: 580, y: 448, mood: "soft", expression: "gentle-smile", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 492, y: 314, duration: 1000, driftX: 4, driftY: 1, driftSpeed: 0.45 },
        cinematic: {
          warmth: 0.05,
          bloom: 0.06,
          whisper: "ahi estaba ella"
        },
        pace: "slow"
      },
      {
        id: "hospital-approaching",
        location: "hospital",
        speaker: "Narrador",
        text:
          "El lector puede verlo desde aqui: Alexis avanzo como si el piso se hubiera vuelto un escenario y todos sus nervios pidieran microfono.",
        actors: {
          alexis: { x: 418, y: 454, mood: "nervous", expression: "hand-on-cheek", facing: "right", scale: 0.54 },
          kiara: { x: 548, y: 452, mood: "shy", expression: "looking-down-soft", facing: "left", scale: 0.54 }
        },
        props: [{ texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 488, y: 316, duration: 1100, driftX: 3, driftY: 1, driftSpeed: 0.4 },
        cinematic: {
          warmth: 0.06,
          vignette: 0.05,
          bloom: 0.06
        },
        pace: "slow"
      },
      {
        id: "kiara-reveal",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Y entonces la vio bien. Kiara estaba muy hermosa, con esa presencia que no hace ruido, pero cambia todo el lugar donde aparece.",
        actors: {
          alexis: { x: 374, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 568, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-hospital-meet-wide", x: 480, y: 508, scale: 0.72, depth: 32, float: 0.3 }
        ],
        camera: { zoom: 1.16, x: 480, y: 330, duration: 1100, driftX: 2, driftY: 1, driftSpeed: 0.48 },
        cinematic: {
          letterbox: 24,
          warmth: 0.06,
          vignette: 0.12,
          flash: true,
          bloom: 0.12,
          godrays: 0.55,
          whisper: "el tiempo se detuvo un segundo",
          slowmo: 0.35
        },
        pace: "slow"
      },
      {
        id: "hospital-nerves",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Se miraron de cerca. Fueron apenas unos segundos, pero alcanzaron para que ninguno supiera que hacer con las manos, ni con la sonrisa, ni con el aire.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "awkward-smile", facing: "right", visible: false },
          kiara: { x: 580, y: 540, mood: "shy", expression: "close-nervous", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-hospital-meet-close", x: 480, y: 508, scale: 0.64, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.2, x: 480, y: 338, duration: 900, driftX: 1.5, driftY: 1, driftSpeed: 0.45 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.1 },
        pace: "slow"
      },
      {
        id: "hospital-unsaid",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Alexis habia ensayado frases en el taxi. Al verla, todas se escondieron. Solo quedo una sonrisa pequena, demasiado honesta para fingir seguridad.",
        actors: {
          alexis: { x: 404, y: 454, mood: "shy", expression: "hand-on-cheek", facing: "right", scale: 0.5 },
          kiara: { x: 560, y: 452, mood: "soft", expression: "looking-down-soft", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.2, x: 484, y: 322, duration: 980, driftX: 1, driftY: 1, driftSpeed: 0.4 },
        cinematic: {
          letterbox: 24,
          warmth: 0.05,
          vignette: 0.1,
          bloom: 0.05,
          whisper: "todas las frases se escondieron"
        },
        pace: "slow"
      },
      {
        id: "hospital-arrival",
        location: "hospital",
        speaker: "Kiara",
        text: "Llegaste tarde.",
        actors: {
          alexis: { x: 404, y: 454, mood: "nervous", expression: "panic-late", facing: "right", scale: 0.5 },
          kiara: { x: 560, y: 452, mood: "talking", expression: "teasing-smile", facing: "left", scale: 0.54 }
        },
        props: [{ texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.28, x: 548, y: 324, duration: 540 },
        cinematic: { warmth: 0.05, vignette: 0.04 }
      },
      {
        id: "hospital-save",
        location: "hospital",
        speaker: "Alexis",
        text: "Pero llegue.",
        actors: {
          alexis: { x: 404, y: 454, mood: "talking", expression: "trying-cool", facing: "right", scale: 0.54 },
          kiara: { x: 560, y: 452, mood: "shy", expression: "hand-near-mouth", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.28, x: 414, y: 324, duration: 540 },
        cinematic: { warmth: 0.05, vignette: 0.04 }
      },
      {
        id: "hospital-awkward-joke",
        location: "hospital",
        speaker: "Narrador",
        text:
          "La frase quedo flotando entre los dos. No era una pelea, era peor: era ternura intentando hacerse la valiente.",
        actors: {
          alexis: { x: 404, y: 454, mood: "nervous", expression: "awkward-smile", facing: "right", scale: 0.5 },
          kiara: { x: 560, y: 452, mood: "thinking", expression: "looking-away-shy", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 486, y: 322, duration: 780, driftX: 1, driftY: 1, driftSpeed: 0.52 },
        cinematic: { letterbox: 18, vignette: 0.06, whisper: "ternura intentando hacerse la valiente" },
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
        text:
          "Ella sonrio. Primero poquito, luego de verdad. Y con eso, por unos segundos, todo el retraso parecio tener perdon y hasta un poquito de suerte.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "soft-love", facing: "right", visible: false },
          kiara: { x: 582, y: 540, mood: "happy", expression: "gentle-smile", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-laugh-shared", x: 490, y: 508, scale: 0.58, depth: 32, float: 0.22 }
        ],
        memory: {
          id: "first-smile",
          label: "La primera sonrisa",
          text: "Una sonrisa que hizo que Alexis dejara de pensar en la hora y empezara a pensar en ella.",
          x: 746,
          y: 302
        },
        camera: { zoom: 1.16, x: 486, y: 328, duration: 980, driftX: 1, driftY: 1, driftSpeed: 0.4 },
        cinematic: {
          letterbox: 26,
          warmth: 0.08,
          vignette: 0.08,
          bloom: 0.12,
          chromatic: true,
          whisper: "guardalo. este momento ya vale para siempre."
        },
        pace: "slow"
      },
      {
        id: "hospital-first-step-together",
        location: "hospital",
        speaker: "Kiara",
        text: "Ya, vamos. Pero camina rapido, para recuperar el tiempo que perdiste.",
        actors: {
          alexis: { x: 386, y: 540, mood: "nervous", expression: "awkward-smile", facing: "right", visible: false },
          kiara: { x: 578, y: 540, mood: "laughing", expression: "laughing-haha", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-hand-touch", x: 500, y: 530, scale: 0.43, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.12, x: 500, y: 366, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.45 },
        cinematic: { warmth: 0.05, vignette: 0.04, whisper: "la primera caminata empezo con una amenaza tierna" }
      },
      {
        id: "hospital-narrator-warning",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Lector, fijate bien: aqui Alexis ya estaba perdido. Todavia no lo sabia, pero la historia ya lo habia elegido y Kiara iba caminando justo al lado.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "soft-love", facing: "right", visible: false },
          kiara: { x: 582, y: 540, mood: "happy", expression: "gentle-smile", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-hand-touch", x: 516, y: 530, scale: 0.42, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 514, y: 360, duration: 860, driftX: 6, driftY: 2, driftSpeed: 0.38 },
        cinematic: { letterbox: 20, warmth: 0.05, vignette: 0.06, bloom: 0.04, whisper: "el destino ya lo habia elegido" }
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
        props: [
          { texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.86 },
          { texture: "couple-walking-side-01", x: 500, y: 520, scale: 0.48, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.02, x: 512, y: 348, duration: 900, driftX: 14, driftY: 3, driftSpeed: 0.65 },
        cinematic: { locationCard: { title: "Camino", subtitle: "hacia ningun lado en particular" } }
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
        props: [
          { texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.86 },
          { texture: "couple-walking-side-02", x: 508, y: 520, scale: 0.48, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.02, x: 518, y: 348, duration: 900, driftX: 16, driftY: 3, driftSpeed: 0.58 }
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
        props: [
          { texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 },
          { texture: "couple-walking-side-03", x: 516, y: 520, scale: 0.48, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.02, x: 524, y: 348, duration: 1100, driftX: 20, driftY: 4, driftSpeed: 0.42 },
        cinematic: { warmth: 0.02, vignette: 0.04 }
      },
      {
        id: "road-trust",
        location: "road",
        speaker: "Kiara",
        text: "Y tu siempre llegas asi de tarde o hoy querias hacer drama?",
        actors: {
          alexis: { x: 382, y: 454, mood: "nervous", expression: "nervous-soft", facing: "right", scale: 0.5 },
          kiara: { x: 552, y: 452, mood: "talking", expression: "teasing-smile", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 }],
        camera: { zoom: 1.12, x: 468, y: 322, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.5 }
      },
      {
        id: "road-trust-answer",
        location: "road",
        speaker: "Alexis",
        text: "Hoy nomas. Bueno... espero que hoy nomas.",
        actors: {
          alexis: { x: 382, y: 454, mood: "talking", expression: "awkward-smile", facing: "right", scale: 0.5 },
          kiara: { x: 552, y: 452, mood: "laughing", expression: "hand-near-mouth", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 }],
        camera: { zoom: 1.12, x: 468, y: 322, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.52 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "road-happy",
        location: "road",
        speaker: "Narrador",
        text: "Cuando Kiara sonreia, Alexis sentia una felicidad torpe, grande, dificil de esconder.",
        actors: {
          alexis: { x: 382, y: 454, mood: "happy", expression: "soft-love", facing: "right", scale: 0.5 },
          kiara: { x: 552, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.82 }],
        camera: { zoom: 1.1, x: 468, y: 322, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.5 },
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
        props: [
          { texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-01", x: 480, y: 520, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.04, x: 492, y: 348, duration: 1100, driftX: 18, driftY: 5, driftSpeed: 0.38 },
        cinematic: {
          letterbox: 18,
          warmth: 0.03,
          vignette: 0.04,
          locationCard: { title: "Campo", subtitle: "sin plan, con compania" }
        }
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
        props: [
          { texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-02", x: 480, y: 520, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.04, x: 492, y: 348, duration: 1100, driftX: 20, driftY: 5, driftSpeed: 0.36 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.04 }
      },
      {
        id: "purple-bike",
        location: "bosquete",
        speaker: "Kiara",
        text: "Me gusta ese color. Cuando tenga mi moto, va a ser morada.",
        actors: {
          alexis: { x: 364, y: 454, mood: "thinking", facing: "right", scale: 0.5 },
          kiara: { x: 556, y: 452, mood: "talking", expression: "flirty-soft", facing: "left", scale: 0.5 }
        },
        memory: {
          id: "purple-bike",
          label: "La moto morada",
          text: "Kiara dijo que su moto seria morada. Desde entonces, ese color dejo de ser un color cualquiera.",
          x: 760,
          y: 292
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.12, x: 506, y: 322, duration: 860, driftX: 6, driftY: 2, driftSpeed: 0.5 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "purple-bike-dream",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "No lo dijo como un comentario cualquiera. Lo dijo con esa seguridad de quien ya se imagino el viento, el camino y su propio color favorito esperandola.",
        actors: {
          alexis: { x: 364, y: 454, mood: "thinking", expression: "soft-love", facing: "right", scale: 0.5 },
          kiara: { x: 556, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.12, x: 506, y: 322, duration: 920, driftX: 4, driftY: 2, driftSpeed: 0.45 },
        cinematic: { warmth: 0.04 }
      },
      {
        id: "purple-bike-color",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces el morado ya tiene duena.",
        actors: {
          alexis: { x: 364, y: 454, mood: "talking", expression: "flirty-shy", facing: "right", scale: 0.51 },
          kiara: { x: 556, y: 452, mood: "shy", expression: "shy-soft", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.14, x: 486, y: 322, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.52 }
      },
      {
        id: "purple-bike-joke",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces cuando tengas tu moto morada, me recoges para que ya no llegue tarde.",
        actors: {
          alexis: { x: 364, y: 454, mood: "talking", expression: "trying-cool", facing: "right", scale: 0.51 },
          kiara: { x: 556, y: 452, mood: "surprised", expression: "surprised-soft", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.14, x: 486, y: 322, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.55 },
        cinematic: { shake: 0.0012, shakeDuration: 160 }
      },
      {
        id: "purple-bike-answer",
        location: "bosquete",
        speaker: "Kiara",
        text: "Depende. Si sigues llegando tarde, te dejo caminando.",
        actors: {
          alexis: { x: 364, y: 454, mood: "nervous", expression: "awkward-smile", facing: "right", scale: 0.5 },
          kiara: { x: 556, y: 452, mood: "laughing", expression: "hand-near-mouth", facing: "left", scale: 0.51 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 486, y: 322, duration: 760, driftX: 2, driftY: 1, driftSpeed: 0.52 },
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
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-wide", x: 480, y: 520, scale: 0.52, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1, x: 486, y: 348, duration: 1200, driftX: 22, driftY: 6, driftSpeed: 0.3 },
        cinematic: {
          letterbox: 20,
          warmth: 0.04,
          vignette: 0.05,
          locationCard: { title: "Valle", subtitle: "vista desde la cima" },
          bloom: 0.06,
          godrays: 0.5
        },
        pace: "slow"
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
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-wide", x: 480, y: 520, scale: 0.52, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.03, x: 488, y: 346, duration: 1300, driftX: 26, driftY: 6, driftSpeed: 0.28 },
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
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-close", x: 480, y: 520, scale: 0.54, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.03, x: 488, y: 346, duration: 1200, driftX: 24, driftY: 6, driftSpeed: 0.26 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.07 }
      },
      {
        id: "valley-land-joke",
        location: "valley",
        speaker: "Alexis",
        text: "Un dia deberiamos quedarnos con un terrenito por aqui.",
        actors: {
          alexis: { x: 398, y: 454, mood: "talking", expression: "flirty-shy", facing: "right", scale: 0.52 },
          kiara: { x: 550, y: 452, mood: "thinking", expression: "thinking", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.14, x: 486, y: 322, duration: 840, driftX: 2, driftY: 1, driftSpeed: 0.42 },
        cinematic: { letterbox: 18, warmth: 0.04 }
      },
      {
        id: "valley-almost-real",
        location: "valley",
        speaker: "Narrador",
        text:
          "La idea nacio como juego, pero por un segundo sonaba tan real que dio un poquito de miedo responder.",
        actors: {
          alexis: { x: 404, y: 454, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.54 },
          kiara: { x: 540, y: 452, mood: "shy", expression: "close-nervous", facing: "left", scale: 0.54 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 482, y: 320, duration: 940, driftX: 2, driftY: 1, driftSpeed: 0.38 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.05 }
      },
      {
        id: "valley-house",
        location: "valley",
        speaker: "Kiara",
        text: "Me gustaria una casita con jardin. Con plantitas. Un lugar bonito donde el dia empiece tranquilo.",
        actors: {
          alexis: { x: 398, y: 454, mood: "thinking", expression: "soft-love", facing: "right", scale: 0.52 },
          kiara: { x: 550, y: 452, mood: "talking", expression: "gentle-smile", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.14, x: 486, y: 322, duration: 900, driftX: 3, driftY: 1, driftSpeed: 0.4 },
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
          alexis: { x: 398, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.52 },
          kiara: { x: 550, y: 452, mood: "talking", expression: "caring", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.15, x: 486, y: 322, duration: 880, driftX: 2, driftY: 1, driftSpeed: 0.38 },
        cinematic: { letterbox: 20, warmth: 0.05 }
      },
      {
        id: "valley-could",
        location: "valley",
        speaker: "Kiara",
        text: "Podriamos? Aunque sea imaginarlo por ahora.",
        actors: {
          alexis: { x: 410, y: 454, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.55 },
          kiara: { x: 540, y: 452, mood: "shy", expression: "looking-down-soft", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.22, x: 486, y: 320, duration: 1000, driftX: 1, driftY: 1, driftSpeed: 0.32 },
        cinematic: { letterbox: 26, warmth: 0.06, vignette: 0.08, whisper: "por un segundo, el futuro se acerco" }
      },
      {
        id: "valley-someday",
        location: "valley",
        speaker: "Alexis",
        text: "Si. Algun dia. Y si no es aqui, en algun lugar que se sienta igual de nuestro.",
        actors: {
          alexis: { x: 412, y: 454, mood: "shy", expression: "after-kiss-shy", facing: "right", scale: 0.55 },
          kiara: { x: 538, y: 452, mood: "shy", expression: "after-kiss-blush", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        memory: {
          id: "garden-house",
          label: "La casita con jardin",
          text: "En la cima del valle, imaginaron una casa pequena, con jardin y un futuro que sonaba demasiado bonito.",
          x: 706,
          y: 250
        },
        camera: { zoom: 1.22, x: 486, y: 320, duration: 1100, driftX: 1, driftY: 1, driftSpeed: 0.3 },
        cinematic: { letterbox: 28, warmth: 0.08, vignette: 0.09, whisper: "lo dijo bajito" }
      },
      {
        id: "valley-silence-after-dream",
        location: "valley",
        speaker: "Narrador",
        text: "No prometieron nada. Pero el valle guardo la frase como una semilla.",
        actors: {
          alexis: { x: 338, y: 360, mood: "soft", facing: "right", scale: 0.42, visible: false },
          kiara: { x: 510, y: 360, mood: "soft", facing: "left", scale: 0.42, visible: false }
        },
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-close", x: 480, y: 520, scale: 0.54, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.06, x: 474, y: 346, duration: 1100, driftX: 4, driftY: 2, driftSpeed: 0.28 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "downhill",
        location: "ravine",
        speaker: "Narrador",
        text: "Bajaron por la quebrada. Tierra, pasto y un silencio que nadie queria romper.",
        actors: {
          alexis: { x: 330, y: 382, mood: "walk", facing: "right", visible: false },
          kiara: { x: 470, y: 382, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-03", x: 482, y: 522, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1, x: 502, y: 348, duration: 1200, driftX: 22, driftY: 5, driftSpeed: 0.32 },
        cinematic: {
          letterbox: 18,
          warmth: 0.03,
          vignette: 0.04,
          locationCard: { title: "Quebrada", subtitle: "el camino baja despacio" }
        }
      },
      {
        id: "downhill-careful",
        location: "ravine",
        speaker: "Kiara",
        text: "Cuidado por ahi.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-02", x: 482, y: 522, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.08, x: 494, y: 348, duration: 900, driftX: 8, driftY: 3, driftSpeed: 0.45 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "downhill-response",
        location: "ravine",
        speaker: "Alexis",
        text: "Yo? Todo bajo control.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-04", x: 482, y: 522, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.09, x: 494, y: 348, duration: 760, driftX: 5, driftY: 2, driftSpeed: 0.5 },
        cinematic: { letterbox: 18, warmth: 0.03, shake: 0.001, shakeDuration: 140 }
      },
      {
        id: "downhill-response-truth",
        location: "ravine",
        speaker: "Narrador",
        text: "Mentira. Alexis calculaba cada paso para no pelearse con el suelo.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-03", x: 482, y: 522, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.09, x: 494, y: 348, duration: 860, driftX: 5, driftY: 2, driftSpeed: 0.44 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "she-like-sky",
        location: "ravine",
        speaker: "Narrador",
        text: "Cuando Alexis la miraba, Kiara parecia cielo: calma, nervios y belleza en un solo lugar.",
        actors: {
          alexis: { x: 392, y: 454, mood: "shy", expression: "soft-love", facing: "right", scale: 0.52 },
          kiara: { x: 544, y: 452, mood: "shy", expression: "looking-away-shy", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 470, y: 322, duration: 1200, driftX: 2, driftY: 1, driftSpeed: 0.34 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "ravine-reader-step",
        location: "ravine",
        speaker: "Narrador",
        text: "Y tu tambien habrias bajado mas lento. Ese tramo pedia cuidado.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-04", x: 482, y: 522, scale: 0.5, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1.04, x: 500, y: 348, duration: 1300, driftX: 18, driftY: 5, driftSpeed: 0.26 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-side-04", x: 486, y: 520, scale: 0.48, depth: 32, float: 0.35 }
        ],
        camera: { zoom: 1, x: 486, y: 348, duration: 1400, driftX: 24, driftY: 6, driftSpeed: 0.24 },
        cinematic: {
          letterbox: 18,
          warmth: 0.04,
          vignette: 0.04,
          locationCard: { title: "Rio", subtitle: "donde se quedan los recuerdos" },
          bloom: 0.05,
          godrays: 0.42
        },
        pace: "slow"
      },
      {
        id: "river-first-breath",
        location: "river",
        speaker: "Narrador",
        text:
          "El rio no hacia ruido fuerte. Sonaba como una conversacion bajita, de esas que no quieren interrumpir a nadie.",
        actors: {
          alexis: { x: 384, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.5 },
          kiara: { x: 556, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.1, x: 480, y: 324, duration: 1200, driftX: 8, driftY: 3, driftSpeed: 0.3 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "river-sit-down",
        location: "river",
        speaker: "Kiara",
        text: "Sentemonos aqui un ratito.",
        actors: {
          alexis: { x: 384, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.5 },
          kiara: { x: 556, y: 452, mood: "talking", expression: "caring", facing: "left", scale: 0.5 }
        },
        props: [{ texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.12, x: 480, y: 324, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.34 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-normal", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 484, y: 360, duration: 1100, driftX: 4, driftY: 2, driftSpeed: 0.32 },
        cinematic: {
          letterbox: 24,
          warmth: 0.05,
          vignette: 0.07,
          intimate: true,
          whisper: "respira despacio"
        },
        pace: "slow"
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-normal", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.05, x: 486, y: 358, duration: 1300, driftX: 10, driftY: 4, driftSpeed: 0.25 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        memory: {
          id: "river-snacks",
          label: "Gomitas junto al rio",
          text: "No hubo mantel ni plan perfecto. Solo gomitas, cereal con yogurt y el rio acompanando.",
          x: 712,
          y: 312
        },
        camera: { zoom: 1.1, x: 480, y: 362, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.35 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.1, x: 480, y: 362, duration: 900, driftX: 4, driftY: 2, driftSpeed: 0.34 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.12, x: 480, y: 362, duration: 760, driftX: 3, driftY: 1, driftSpeed: 0.44 },
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.16, x: 478, y: 364, duration: 1200, driftX: 2, driftY: 1, driftSpeed: 0.3 },
        cinematic: {
          letterbox: 24,
          warmth: 0.06,
          vignette: 0.08,
          intimate: true,
          whisper: "no la apartes la mirada"
        },
        pace: "slow"
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.18, x: 478, y: 366, duration: 1250, driftX: 2, driftY: 1, driftSpeed: 0.28 },
        cinematic: {
          letterbox: 26,
          warmth: 0.07,
          vignette: 0.09,
          intimate: true,
          bloom: 0.05
        },
        pace: "slow"
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
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.2, x: 478, y: 368, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.24 },
        cinematic: {
          letterbox: 28,
          warmth: 0.07,
          vignette: 0.1,
          intimate: true,
          bloom: 0.06,
          whisper: "no apartes la mirada"
        },
        pace: "slow"
      },
      {
        id: "river-silence",
        location: "river",
        speaker: "Narrador",
        text: "El rio sonaba igual, pero algo habia cambiado entre ellos: el silencio ya no incomodaba, acercaba.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 520, scale: 0.58, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.22, x: 478, y: 370, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.23 },
        cinematic: {
          letterbox: 30,
          warmth: 0.08,
          vignette: 0.11,
          intimate: true,
          bloom: 0.08,
          chromatic: true,
          magicShift: true,
          whisper: "algo bonito estaba por ocurrir"
        },
        pace: "slow"
      },
      {
        id: "almost-kiss",
        location: "river",
        speaker: "Narrador",
        text:
          "Alexis se acerco apenas. Kiara no se alejo. El rio siguio hablando por los dos, bajito, como pidiendo cuidado.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-01", x: 480, y: 512, scale: 0.66, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.255, x: 478, y: 372, duration: 1600, driftX: 0.45, driftY: 0.45, driftSpeed: 0.18 },
        cinematic: {
          letterbox: 34,
          warmth: 0.09,
          vignette: 0.12,
          intimate: true,
          bloom: 0.1,
          chromatic: true,
          slowmo: 0.18,
          whisper: "el mundo se hizo pequenito",
          holdMs: 1300,
          lockInput: true
        },
        pace: "slow"
      },
      {
        id: "almost-kiss-world",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-02", x: 480, y: 512, scale: 0.68, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.27, x: 478, y: 373, duration: 1700, driftX: 0.34, driftY: 0.34, driftSpeed: 0.16 },
        cinematic: {
          letterbox: 36,
          warmth: 0.1,
          vignette: 0.13,
          intimate: true,
          bloom: 0.12,
          chromatic: true,
          slowmo: 0.28,
          holdMs: 960,
          persistDialogue: true,
          lockInput: true
        },
        pace: "slow"
      },
      {
        id: "almost-kiss-reader-hold",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-03", x: 480, y: 512, scale: 0.7, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.285, x: 478, y: 374, duration: 1750, driftX: 0.28, driftY: 0.28, driftSpeed: 0.14 },
        cinematic: {
          letterbox: 38,
          warmth: 0.11,
          vignette: 0.14,
          intimate: true,
          bloom: 0.14,
          chromatic: true,
          slowmo: 0.45,
          whisper: "...",
          holdMs: 1040,
          persistDialogue: true,
          lockInput: true
        },
        pace: "freeze"
      },
      {
        id: "almost-kiss-final-breath",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-04", x: 480, y: 512, scale: 0.71, depth: 32, float: 0.24 }
        ],
        camera: { zoom: 1.3, x: 478, y: 375, duration: 1650, driftX: 0.24, driftY: 0.24, driftSpeed: 0.13 },
        cinematic: {
          letterbox: 40,
          warmth: 0.115,
          vignette: 0.14,
          intimate: true,
          bloom: 0.16,
          chromatic: true,
          slowmo: 0.5,
          holdMs: 900,
          persistDialogue: true,
          lockInput: true
        },
        pace: "freeze"
      },
      {
        id: "first-kiss",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-kiss-sitting", x: 480, y: 512, scale: 0.72, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.315, x: 478, y: 376, duration: 1750, driftX: 0.2, driftY: 0.2, driftSpeed: 0.12 },
        cinematic: {
          letterbox: 42,
          warmth: 0.12,
          vignette: 0.12,
          shake: 0.0007,
          shakeDuration: 180,
          heartbeat: 0.92,
          intimate: true,
          bloom: 0.22,
          chromatic: true,
          slowmo: 0.55,
          godrays: 0.3,
          petals: true,
          holdMs: 1500,
          persistDialogue: true,
          lockInput: true
        },
        pace: "slow"
      },
      {
        id: "first-kiss-universes",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-kiss-sitting", x: 480, y: 512, scale: 0.72, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.328, x: 478, y: 377, duration: 1700, driftX: 0.18, driftY: 0.18, driftSpeed: 0.11 },
        cinematic: {
          letterbox: 44,
          warmth: 0.13,
          vignette: 0.1,
          intimate: true,
          bloom: 0.18,
          chromatic: true,
          slowmo: 0.4,
          holdMs: 980,
          persistDialogue: true,
          lockInput: true
        },
        pace: "slow"
      },
      {
        id: "first-kiss-heaven",
        location: "river",
        speaker: "Narrador",
        text: "",
        actors: {
          alexis: { x: 406, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 506, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-close-faces", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-kiss-sitting", x: 480, y: 512, scale: 0.72, depth: 32, float: 0.28 }
        ],
        camera: { zoom: 1.34, x: 478, y: 378, duration: 1700, driftX: 0.16, driftY: 0.16, driftSpeed: 0.1 },
        cinematic: {
          letterbox: 44,
          warmth: 0.14,
          vignette: 0.08,
          intimate: true,
          bloom: 0.16,
          chromatic: true,
          slowmo: 0.32,
          holdMs: 900,
          persistDialogue: true,
          lockInput: true
        },
        pace: "slow"
      },
      {
        id: "after-kiss",
        location: "river",
        speaker: "Narrador",
        text: "Cuando se separaron, no hicieron falta palabras. A veces respirar juntito ya es bastante despues de un momento asi.",
        actors: {
          alexis: { x: 384, y: 378, mood: "shy", facing: "right", visible: false },
          kiara: { x: 526, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-post-kiss-shy", x: 480, y: 520, scale: 0.58, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.22, x: 478, y: 374, duration: 1300, driftX: 1, driftY: 1, driftSpeed: 0.24 },
        cinematic: {
          letterbox: 30,
          warmth: 0.09,
          vignette: 0.08,
          intimate: true,
          bloom: 0.08,
          whisper: "no hicieron falta palabras"
        },
        pace: "slow"
      },
      {
        id: "chapter-1-end",
        location: "river",
        speaker: "Narrador",
        text: "Desde ese dia, ese rinconcito junto al rio dejo de ser paisaje. Fue donde el valle los vio imaginar una casa, reir bajito y guardar su primer beso.",
        actors: {
          alexis: { x: 366, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 526, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-post-kiss-shy", x: 480, y: 520, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.04, x: 484, y: 348, duration: 1400, driftX: 12, driftY: 4, driftSpeed: 0.24 },
        cinematic: {
          letterbox: 20,
          warmth: 0.06,
          vignette: 0.05,
          intimate: true,
          bloom: 0.06,
          whisper: "fin del capitulo 1"
        },
        pace: "slow",
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
