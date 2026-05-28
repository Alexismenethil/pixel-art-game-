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
    riverMagic?: number;
    godrays?: number;
    petals?: boolean;
    locationCard?: { title: string; subtitle?: string };
    whisper?: string;
    holdMs?: number;
    hideDialogue?: boolean;
    hideHud?: boolean;
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
    title: "Donde el río nos vio",
    route: "Taxi > Hospital > Valle > Río",
    lockedTeaser: "Empieza aquí.",
    beats: [
      {
        id: "taxi-late",
        location: "taxi",
        speaker: "Narrador",
        text:
          "Era julio y hacía un frío suave. El taxi avanzaba, pero para Alexis cada semáforo parecía quedarse pensando demasiado.",
        actors: {
          alexis: { x: 464, y: 378, mood: "nervous", facing: "left", visible: false },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 610, y: 528, scale: 0.6, depth: 32, float: 0.18 }
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
        text: "¿Ya llegaste? Estoy cerca del hospital. Apúrateee.",
        actors: {
          alexis: { x: 464, y: 378, mood: "surprised", facing: "left", visible: false },
          kiara: { x: 622, y: 378, mood: "thinking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 528, scale: 0.66, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.3, x: 640, y: 352, duration: 720, driftX: 4, driftY: 2, driftSpeed: 1.2 },
        cinematic: { vignette: 0.1, shake: 0.0015, shakeDuration: 180 },
        pace: "urgent"
      },
      {
        id: "taxi-pressure",
        location: "taxi",
        speaker: "Alexis",
        text: "Jefe, por favor, un poquito más rápido. No quiero llegar más tarde de lo que ya estoy.",
        actors: {
          alexis: { x: 464, y: 378, mood: "talking", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 528, scale: 0.68, depth: 32, float: 0.18 }
        ],
        camera: { zoom: 1.32, x: 640, y: 354, duration: 680, driftX: 3, driftY: 1, driftSpeed: 1.1 },
        cinematic: { vignette: 0.08 },
        pace: "fast",
        choices: [
          {
            id: "taxi-special",
            label: "Es que ella es especial.",
            resultSpeaker: "Narrador",
            resultText: "El taxi siguió igual, pero Alexis ya había confesado lo obvio: no era una cita cualquiera.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "taxi-nervous",
            label: "No quiero que se enoje.",
            resultSpeaker: "Narrador",
            resultText: "La prisa no era solo por llegar. Era por no arruinar algo que todavía ni empezaba.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "taxi-calm",
            label: "Respirar y mirar el camino.",
            resultSpeaker: "Narrador",
            resultText: "Alexis respiró hondo. El corazón, claramente, no quiso colaborar.",
            stat: { id: "nervios", label: "Nervios" }
          }
        ]
      },
      {
        id: "taxi-driver-tease",
        location: "taxi",
        speaker: "Chofer",
        text: "Tranquilo, joven. Si es por una chica, seguro todavía lo espera.",
        actors: {
          alexis: { x: 464, y: 378, mood: "nervous", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 528, scale: 0.62, depth: 32, alpha: 0.9, float: 0.18 }
        ],
        camera: { zoom: 1.14, x: 360, y: 342, duration: 720, driftX: 4, driftY: 2, driftSpeed: 0.9 },
        cinematic: { vignette: 0.1, warmth: 0.05, bloom: 0.05, whisper: "la voz del chofer llegó desde adelante" },
        pace: "normal"
      },
      {
        id: "taxi-inner-drama",
        location: "taxi",
        speaker: "Narrador",
        text:
          "El chofer lo dijo como broma. Alexis, en cambio, lo escuchó como si el destino acabara de pedirle explicaciones.",
        actors: {
          alexis: { x: 464, y: 378, mood: "thinking", facing: "left", visible: false },
          kiara: { x: 624, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-taxi-back-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-taxi-back-seat", x: 660, y: 528, scale: 0.7, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.36, x: 640, y: 354, duration: 720, driftX: 2, driftY: 1, driftSpeed: 0.8 },
        cinematic: { vignette: 0.1, whisper: "el corazón no quiso colaborar" }
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
          { texture: "couple-taxi-back-seat", x: 660, y: 528, scale: 0.72, depth: 32, float: 0.16 }
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
          "El taxi se detuvo frente al antiguo hospital. Era un edificio conocido, sí, pero ese día parecía iluminado de otra forma, como si ya supiera que iba a guardar un secreto.",
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
          locationCard: { title: "Hospital", subtitle: "Aquí empieza todo" }
        },
        pace: "slow"
      },
      {
        id: "hospital-first-step",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Alexis bajó intentando verse tranquilo. El plan duró exactamente dos pasos: el celular aún pesaba en su mano y el corazón ya iba corriendo antes que él.",
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
          locationCard: { title: "Hospital", subtitle: "Aquí empieza todo" },
          whisper: "respira hondo, ya llegaste"
        },
        pace: "slow"
      },
      {
        id: "hospital-spot-kiara",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Levantó la vista. Al otro lado de la entrada, entre la luz tibia y las sombras de los árboles, Kiara estaba esperando.",
        actors: {
          alexis: { x: 398, y: 452, mood: "surprised", expression: "wide-eyes-love", facing: "right", scale: 0.54 },
          kiara: { x: 580, y: 448, mood: "soft", expression: "gentle-smile", facing: "left", scale: 0.52 }
        },
        props: [{ texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 492, y: 314, duration: 1000, driftX: 4, driftY: 1, driftSpeed: 0.45 },
        cinematic: {
          warmth: 0.05,
          bloom: 0.06,
          whisper: "ahí estaba ella"
        },
        pace: "slow"
      },
      {
        id: "hospital-approaching",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Si lo hubieras visto desde aquí, habrías notado el desastre: Alexis avanzó como si el piso fuera un escenario y todos sus nervios pidieran micrófono.",
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
          "Y entonces la vio bien. Kiara estaba hermosa, de esa forma tranquila que no hace ruido, pero cambia el lugar entero cuando aparece.",
        actors: {
          alexis: { x: 374, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 568, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-hospital-meet-wide", x: 480, y: 508, scale: 0.78, depth: 32, float: 0.3 }
        ],
        camera: { zoom: 1.18, x: 480, y: 326, duration: 1100, driftX: 1.6, driftY: 0.8, driftSpeed: 0.42 },
        cinematic: {
          letterbox: 24,
          warmth: 0.06,
          vignette: 0.12,
          flash: true,
          bloom: 0.12,
          godrays: 0.55,
          hideHud: true,
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
          "Se miraron de cerca. Fueron apenas unos segundos, pero alcanzaron para que ninguno supiera qué hacer con las manos, ni con la sonrisa, ni con el aire.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "awkward-smile", facing: "right", visible: false },
          kiara: { x: 580, y: 540, mood: "shy", expression: "close-nervous", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-hospital-meet-close", x: 480, y: 508, scale: 0.7, depth: 32, float: 0.24 }
        ],
        camera: { zoom: 1.23, x: 480, y: 336, duration: 900, driftX: 1, driftY: 0.7, driftSpeed: 0.38 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.1 },
        pace: "slow"
      },
      {
        id: "hospital-unsaid",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Alexis había ensayado frases en el taxi. Al verla, todas se escondieron. Solo quedó una sonrisa pequeña, demasiado honesta para fingir seguridad.",
        actors: {
          alexis: { x: 404, y: 454, mood: "shy", expression: "hand-on-cheek", facing: "right", scale: 0.54 },
          kiara: { x: 560, y: 452, mood: "soft", expression: "looking-down-soft", facing: "left", scale: 0.54 }
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
          alexis: { x: 404, y: 454, mood: "nervous", expression: "panic-late", facing: "right", scale: 0.54 },
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
        text: "Pero llegué.",
        actors: {
          alexis: { x: 404, y: 454, mood: "talking", expression: "trying-cool", facing: "right", scale: 0.54 },
          kiara: { x: 560, y: 452, mood: "shy", expression: "hand-near-mouth", facing: "left", scale: 0.54 }
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
          "La frase quedó flotando entre los dos. No era una pelea, era peor: era ternura intentando hacerse la valiente.",
        actors: {
          alexis: { x: 404, y: 454, mood: "nervous", expression: "awkward-smile", facing: "right", scale: 0.54 },
          kiara: { x: 560, y: 452, mood: "thinking", expression: "looking-away-shy", facing: "left", scale: 0.54 }
        },
        props: [{ texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 486, y: 322, duration: 780, driftX: 1, driftY: 1, driftSpeed: 0.52 },
        cinematic: { letterbox: 18, vignette: 0.06, whisper: "ternura intentando hacerse la valiente" },
        choices: [
          {
            id: "break-ice-pretty",
            label: "Decirle que se ve muy bonita.",
            resultSpeaker: "Alexis",
            resultText: "Estás muy bonita. Lo dijo rápido, casi bajito, como si la frase le quemara de pura verdad.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "break-ice-wait",
            label: "Preguntarle si esperó mucho.",
            resultSpeaker: "Alexis",
            resultText: "¿Esperaste mucho? Alexis intentó sonar tranquilo. Su voz salió suave, pero sus nervios llegaron primero.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "break-ice-walk",
            label: "Invitarla a caminar.",
            resultSpeaker: "Alexis",
            resultText: "¿Caminamos? Era una pregunta pequeña, pero abrió la puerta para todo lo que venía.",
            stat: { id: "sueno", label: "Sueño compartido" }
          }
        ]
      },
      {
        id: "hospital-smile",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Ella sonrió. Primero poquito, luego de verdad. Y con eso, por unos segundos, todo el retraso pareció tener perdón y hasta un poquito de suerte.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "soft-love", facing: "right", visible: false },
          kiara: { x: 582, y: 540, mood: "happy", expression: "gentle-smile", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-laugh-shared", x: 490, y: 508, scale: 0.64, depth: 32, float: 0.18 }
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
          hideHud: true,
          whisper: "guárdalo. este momento ya vale para siempre."
        },
        pace: "slow"
      },
      {
        id: "hospital-first-step-together",
        location: "hospital",
        speaker: "Kiara",
        text: "Ya, vamos. Pero camina rápido, para recuperar el tiempo que perdiste.",
        actors: {
          alexis: { x: 386, y: 540, mood: "nervous", expression: "awkward-smile", facing: "right", visible: false },
          kiara: { x: 578, y: 540, mood: "laughing", expression: "laughing-haha", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-close-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-hand-touch", x: 500, y: 524, scale: 0.48, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.14, x: 500, y: 358, duration: 760, driftX: 1.5, driftY: 0.8, driftSpeed: 0.42 },
        cinematic: { warmth: 0.05, vignette: 0.04, whisper: "la primera caminata empezó con una amenaza tierna" }
      },
      {
        id: "hospital-narrator-warning",
        location: "hospital",
        speaker: "Narrador",
        text:
          "Fíjate bien: aquí Alexis ya estaba perdido. Todavía no lo sabía, pero la historia ya lo había elegido y Kiara iba caminando justo al lado.",
        actors: {
          alexis: { x: 380, y: 540, mood: "shy", expression: "soft-love", facing: "right", visible: false },
          kiara: { x: 582, y: 540, mood: "happy", expression: "gentle-smile", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-hospital-entrance-day", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-hand-touch", x: 516, y: 524, scale: 0.48, depth: 32, float: 0.2 }
        ],
        camera: { zoom: 1.12, x: 514, y: 356, duration: 860, driftX: 5, driftY: 1.6, driftSpeed: 0.34 },
        cinematic: { letterbox: 20, warmth: 0.05, vignette: 0.06, bloom: 0.04, whisper: "el destino ya lo había elegido" }
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
          { texture: "couple-walking-side-01", x: 500, y: 516, scale: 0.54, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.06, x: 512, y: 342, duration: 900, driftX: 10, driftY: 2.4, driftSpeed: 0.55 },
        cinematic: { locationCard: { title: "Camino", subtitle: "hacia ningún lado en particular" } }
      },
      {
        id: "road-little-talks",
        location: "road",
        speaker: "Narrador",
        text:
          "Al inicio hablaron con cuidado. Como quien sostiene algo pequeño y bonito, y teme apretarlo demasiado por miedo a que se rompa.",
        actors: {
          alexis: { x: 334, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 478, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false }
        },
        props: [
          { texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.86 },
          { texture: "couple-walking-side-02", x: 508, y: 516, scale: 0.54, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.06, x: 518, y: 342, duration: 900, driftX: 11, driftY: 2.4, driftSpeed: 0.5 }
      },
      {
        id: "road-soft-silence",
        location: "road",
        speaker: "Narrador",
        text:
          "También hubo silencios cortitos. No de esos que incomodan, sino de esos donde uno camina al lado de alguien y se siente acompañado.",
        actors: {
          alexis: { x: 340, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 486, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false }
        },
        props: [
          { texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 },
          { texture: "couple-walking-side-03", x: 516, y: 516, scale: 0.54, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.06, x: 524, y: 342, duration: 1100, driftX: 13, driftY: 3, driftSpeed: 0.38 },
        cinematic: { warmth: 0.02, vignette: 0.04 }
      },
      {
        id: "road-trust",
        location: "road",
        speaker: "Kiara",
        text: "¿Y tú siempre llegas así de tarde o hoy querías hacer drama?",
        actors: {
          alexis: { x: 382, y: 454, mood: "nervous", expression: "nervous-soft", facing: "right", scale: 0.54 },
          kiara: { x: 552, y: 452, mood: "talking", expression: "teasing-smile", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 }],
        camera: { zoom: 1.16, x: 468, y: 318, duration: 720, driftX: 1.5, driftY: 0.8, driftSpeed: 0.46 }
      },
      {
        id: "road-trust-answer",
        location: "road",
        speaker: "Alexis",
        text: "Hoy nomás. Bueno... espero que hoy nomás.",
        actors: {
          alexis: { x: 382, y: 454, mood: "talking", expression: "awkward-smile", facing: "right", scale: 0.54 },
          kiara: { x: 552, y: 452, mood: "laughing", expression: "hand-near-mouth", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.84 }],
        camera: { zoom: 1.16, x: 468, y: 318, duration: 720, driftX: 1.5, driftY: 0.8, driftSpeed: 0.48 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "road-happy",
        location: "road",
        speaker: "Narrador",
        text: "Cuando Kiara sonreía, Alexis sentía una felicidad torpe, grande, difícil de esconder.",
        actors: {
          alexis: { x: 382, y: 454, mood: "happy", expression: "soft-love", facing: "right", scale: 0.54 },
          kiara: { x: 552, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-road-asphalt-path", x: 480, y: 540, scale: 1, depth: 23, alpha: 0.82 }],
        camera: { zoom: 1.15, x: 468, y: 318, duration: 900, driftX: 2.6, driftY: 1.4, driftSpeed: 0.46 },
        cinematic: { warmth: 0.04 }
      },
      {
        id: "road-without-map",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "La carretera quedó atrás poco a poco. No tenían un plan perfecto, pero sí algo mejor: ganas de seguir caminando.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-01", x: 480, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 492, y: 342, duration: 1100, driftX: 12, driftY: 3.6, driftSpeed: 0.34 },
        cinematic: {
          letterbox: 18,
          warmth: 0.03,
          vignette: 0.04,
          locationCard: { title: "Campo", subtitle: "sin plan, con compañía" }
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
          { texture: "couple-walking-back-02", x: 480, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 492, y: 342, duration: 1100, driftX: 13, driftY: 3.6, driftSpeed: 0.32 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.04 }
      },
      {
        id: "purple-bike",
        location: "bosquete",
        speaker: "Kiara",
        text: "Me gusta ese color. Cuando tenga mi moto, va a ser morada.",
        actors: {
          alexis: { x: 364, y: 454, mood: "thinking", facing: "right", scale: 0.54 },
          kiara: { x: 556, y: 452, mood: "talking", expression: "flirty-soft", facing: "left", scale: 0.55 }
        },
        memory: {
          id: "purple-bike",
          label: "La moto morada",
          text: "Kiara dijo que su moto sería morada. Desde entonces, ese color dejó de ser un color cualquiera.",
          x: 760,
          y: 292
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 506, y: 318, duration: 860, driftX: 4, driftY: 1.4, driftSpeed: 0.46 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "purple-bike-dream",
        location: "bosquete",
        speaker: "Narrador",
        text:
          "No lo dijo como un comentario cualquiera. Lo dijo con esa seguridad de quien ya se imaginó el viento, el camino y su propio color favorito esperándola.",
        actors: {
          alexis: { x: 364, y: 454, mood: "thinking", expression: "soft-love", facing: "right", scale: 0.54 },
          kiara: { x: 556, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 506, y: 318, duration: 920, driftX: 3, driftY: 1.3, driftSpeed: 0.42 },
        cinematic: { warmth: 0.04 }
      },
      {
        id: "purple-bike-color",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces el morado ya tiene dueña.",
        actors: {
          alexis: { x: 364, y: 454, mood: "talking", expression: "flirty-shy", facing: "right", scale: 0.55 },
          kiara: { x: 556, y: 452, mood: "shy", expression: "shy-soft", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 486, y: 318, duration: 760, driftX: 1.4, driftY: 0.8, driftSpeed: 0.48 }
      },
      {
        id: "purple-bike-joke",
        location: "bosquete",
        speaker: "Alexis",
        text: "Entonces, cuando tengas tu moto morada, me recoges para que ya no llegue tarde.",
        actors: {
          alexis: { x: 364, y: 454, mood: "talking", expression: "trying-cool", facing: "right", scale: 0.55 },
          kiara: { x: 556, y: 452, mood: "surprised", expression: "surprised-soft", facing: "left", scale: 0.55 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 486, y: 318, duration: 720, driftX: 1.4, driftY: 0.8, driftSpeed: 0.5 },
        cinematic: { shake: 0.0012, shakeDuration: 160 }
      },
      {
        id: "purple-bike-answer",
        location: "bosquete",
        speaker: "Kiara",
        text: "Depende. Si sigues llegando tarde, te dejo caminando.",
        actors: {
          alexis: { x: 364, y: 454, mood: "nervous", expression: "awkward-smile", facing: "right", scale: 0.54 },
          kiara: { x: 556, y: 452, mood: "laughing", expression: "hand-near-mouth", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-bosquete-clearing", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.2, x: 486, y: 318, duration: 760, driftX: 1.4, driftY: 0.8, driftSpeed: 0.46 },
        cinematic: { warmth: 0.03 }
      },
      {
        id: "valley-top",
        location: "valley",
        speaker: "Narrador",
        text: "Subieron por los pastizales hasta una pequeña cima. Abajo, el valle parecía abrirse despacio, como si también quisiera conocerlos.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-wide", x: 480, y: 516, scale: 0.58, depth: 32, float: 0.24 }
        ],
        camera: { zoom: 1.04, x: 486, y: 340, duration: 1200, driftX: 16, driftY: 4.4, driftSpeed: 0.28 },
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
          "Desde arriba se veía el río, los cultivos y el valle entero. El mundo parecía respirar más despacio, y ellos también.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-wide", x: 480, y: 516, scale: 0.58, depth: 32, float: 0.24 }
        ],
        camera: { zoom: 1.06, x: 488, y: 340, duration: 1300, driftX: 18, driftY: 4.4, driftSpeed: 0.25 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "valley-reader-view",
        location: "valley",
        speaker: "Narrador",
        text:
          "Si hubieras estado ahí con ellos, tal vez también habrías hablado más bajito: la vista pedía cuidado.",
        actors: {
          alexis: { x: 354, y: 376, mood: "soft", facing: "right", scale: 0.44, pose: "back", visible: false },
          kiara: { x: 500, y: 376, mood: "soft", facing: "left", scale: 0.44, pose: "back", visible: false }
        },
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-close", x: 480, y: 516, scale: 0.6, depth: 32, float: 0.22 }
        ],
        camera: { zoom: 1.06, x: 488, y: 340, duration: 1200, driftX: 16, driftY: 4, driftSpeed: 0.24 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.07 }
      },
      {
        id: "valley-land-joke",
        location: "valley",
        speaker: "Alexis",
        text: "Un día deberíamos quedarnos con un terrenito por aquí.",
        actors: {
          alexis: { x: 398, y: 454, mood: "talking", expression: "flirty-shy", facing: "right", scale: 0.56 },
          kiara: { x: 550, y: 452, mood: "thinking", expression: "thinking", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 486, y: 318, duration: 840, driftX: 1.4, driftY: 0.8, driftSpeed: 0.38 },
        cinematic: { letterbox: 18, warmth: 0.04 }
      },
      {
        id: "valley-almost-real",
        location: "valley",
        speaker: "Narrador",
        text:
          "La idea nació como juego, pero por un segundo sonó tan real que dio un poquito de miedo responder.",
        actors: {
          alexis: { x: 404, y: 454, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.57 },
          kiara: { x: 540, y: 452, mood: "shy", expression: "close-nervous", facing: "left", scale: 0.57 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.22, x: 482, y: 316, duration: 940, driftX: 1.2, driftY: 0.8, driftSpeed: 0.34 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.05 }
      },
      {
        id: "valley-house",
        location: "valley",
        speaker: "Kiara",
        text: "Me gustaría una casita con jardín. Con plantitas. Un lugar bonito donde el día empiece tranquilo.",
        actors: {
          alexis: { x: 398, y: 454, mood: "thinking", expression: "soft-love", facing: "right", scale: 0.56 },
          kiara: { x: 550, y: 452, mood: "talking", expression: "gentle-smile", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.18, x: 486, y: 318, duration: 900, driftX: 2, driftY: 0.8, driftSpeed: 0.36 },
        cinematic: { letterbox: 20, warmth: 0.04 },
        choices: [
          {
            id: "house-valley",
            label: "Una casita con vista al valle.",
            resultSpeaker: "Alexis",
            resultText: "Una casita con jardín y vista al valle. Suena como un buen plan para algún día.",
            stat: { id: "sueno", label: "Sueño compartido" }
          },
          {
            id: "house-bike",
            label: "Y una moto morada afuera.",
            resultSpeaker: "Alexis",
            resultText: "Y una moto morada estacionada afuera, para que nadie olvide quién eligió el color.",
            stat: { id: "ternura", label: "Ternura" }
          },
          {
            id: "house-you",
            label: "Mientras estés tú, estaría bien.",
            resultSpeaker: "Alexis",
            resultText: "Mientras estés tú, cualquier lugar se sentiría bonito. Cursi, sí. Pero a veces la verdad sale así.",
            stat: { id: "nervios", label: "Nervios" }
          }
        ]
      },
      {
        id: "valley-garden-detail",
        location: "valley",
        speaker: "Kiara",
        text: "Con flores, pastito y un jardín bonito. No enorme, pero sí cuidado.",
        actors: {
          alexis: { x: 398, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.56 },
          kiara: { x: 550, y: 452, mood: "talking", expression: "caring", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.19, x: 486, y: 318, duration: 880, driftX: 1.4, driftY: 0.8, driftSpeed: 0.34 },
        cinematic: { letterbox: 20, warmth: 0.05 }
      },
      {
        id: "valley-could",
        location: "valley",
        speaker: "Kiara",
        text: "¿Podríamos? Aunque sea imaginarlo por ahora.",
        actors: {
          alexis: { x: 410, y: 454, mood: "shy", expression: "looking-away-shy", facing: "right", scale: 0.58 },
          kiara: { x: 540, y: 452, mood: "shy", expression: "looking-down-soft", facing: "left", scale: 0.58 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.26, x: 486, y: 314, duration: 1000, driftX: 0.8, driftY: 0.6, driftSpeed: 0.28 },
        cinematic: { letterbox: 26, warmth: 0.06, vignette: 0.08, hideHud: true, whisper: "por un segundo, el futuro se acercó" }
      },
      {
        id: "valley-someday",
        location: "valley",
        speaker: "Alexis",
        text: "Sí. Algún día. Y si no es aquí, en algún lugar que se sienta igual de nuestro.",
        actors: {
          alexis: { x: 412, y: 454, mood: "shy", expression: "after-kiss-shy", facing: "right", scale: 0.58 },
          kiara: { x: 538, y: 452, mood: "shy", expression: "after-kiss-blush", facing: "left", scale: 0.58 }
        },
        props: [{ texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 }],
        memory: {
          id: "garden-house",
          label: "La casita con jardín",
          text: "En la cima del valle, imaginaron una casa pequeña, con jardín y un futuro que sonaba demasiado bonito.",
          x: 706,
          y: 250
        },
        camera: { zoom: 1.26, x: 486, y: 314, duration: 1100, driftX: 0.8, driftY: 0.6, driftSpeed: 0.26 },
        cinematic: { letterbox: 28, warmth: 0.08, vignette: 0.09, hideHud: true, whisper: "lo dijo bajito" }
      },
      {
        id: "valley-silence-after-dream",
        location: "valley",
        speaker: "Narrador",
        text: "No prometieron nada. Pero el valle guardó la frase como una semilla.",
        actors: {
          alexis: { x: 338, y: 360, mood: "soft", facing: "right", scale: 0.42, visible: false },
          kiara: { x: 510, y: 360, mood: "soft", facing: "left", scale: 0.42, visible: false }
        },
        props: [
          { texture: "scene-valley-cima-close", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-valley-back-close", x: 480, y: 516, scale: 0.6, depth: 32, float: 0.22 }
        ],
        camera: { zoom: 1.08, x: 474, y: 340, duration: 1100, driftX: 3, driftY: 1.5, driftSpeed: 0.24 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06, hideHud: true }
      },
      {
        id: "downhill",
        location: "ravine",
        speaker: "Narrador",
        text: "Bajaron por la quebrada. Tierra, pasto y un silencio que ninguno quería romper.",
        actors: {
          alexis: { x: 330, y: 382, mood: "walk", facing: "right", visible: false },
          kiara: { x: 470, y: 382, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-03", x: 482, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.06, x: 502, y: 342, duration: 1200, driftX: 15, driftY: 3.6, driftSpeed: 0.3 },
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
        text: "Cuidado por ahí.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-02", x: 482, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.1, x: 494, y: 342, duration: 900, driftX: 6, driftY: 2.3, driftSpeed: 0.4 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "downhill-response",
        location: "ravine",
        speaker: "Alexis",
        text: "¿Yo? Todo bajo control.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-04", x: 482, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.11, x: 494, y: 342, duration: 760, driftX: 4, driftY: 1.6, driftSpeed: 0.44 },
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
          { texture: "couple-walking-back-03", x: 482, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.11, x: 494, y: 342, duration: 860, driftX: 4, driftY: 1.6, driftSpeed: 0.4 },
        cinematic: { letterbox: 18, warmth: 0.03, vignette: 0.05 }
      },
      {
        id: "she-like-sky",
        location: "ravine",
        speaker: "Narrador",
        text: "Cuando Alexis la miraba, Kiara parecía cielo: calma, nervios y belleza en un solo lugar.",
        actors: {
          alexis: { x: 392, y: 454, mood: "shy", expression: "soft-love", facing: "right", scale: 0.56 },
          kiara: { x: 544, y: 452, mood: "shy", expression: "looking-away-shy", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.2, x: 470, y: 318, duration: 1200, driftX: 1.2, driftY: 0.8, driftSpeed: 0.3 },
        cinematic: { letterbox: 24, warmth: 0.06, vignette: 0.08 }
      },
      {
        id: "ravine-reader-step",
        location: "ravine",
        speaker: "Narrador",
        text: "Y tú también habrías bajado más lento. Ese tramo pedía cuidado.",
        actors: {
          alexis: { x: 366, y: 378, mood: "walk", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "walk", facing: "right", visible: false }
        },
        props: [
          { texture: "scene-ravine-path-down", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-back-04", x: 482, y: 516, scale: 0.56, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.08, x: 500, y: 342, duration: 1300, driftX: 12, driftY: 3.6, driftSpeed: 0.24 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.06 }
      },
      {
        id: "river-arrival",
        location: "river",
        speaker: "Narrador",
        text:
          "Entre cultivos de frutas llegaron a la orilla del río. El agua sonaba tranquila, como si supiera guardar secretos bonitos.",
        actors: {
          alexis: { x: 326, y: 378, mood: "walk", facing: "right", pose: "walking-side", visible: false },
          kiara: { x: 498, y: 378, mood: "happy", facing: "right", pose: "walking-side", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-walking-side-04", x: 486, y: 516, scale: 0.54, depth: 32, float: 0.25 }
        ],
        camera: { zoom: 1.06, x: 486, y: 342, duration: 1400, driftX: 16, driftY: 4.2, driftSpeed: 0.22 },
        cinematic: {
          letterbox: 18,
          warmth: 0.04,
          vignette: 0.04,
          locationCard: { title: "Río", subtitle: "donde se quedan los recuerdos" },
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
          "El río no hacía ruido fuerte. Sonaba como una conversación bajita, de esas que no quieren interrumpir a nadie.",
        actors: {
          alexis: { x: 384, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.55 },
          kiara: { x: 556, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.14, x: 480, y: 318, duration: 1200, driftX: 5, driftY: 2, driftSpeed: 0.28 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "river-sit-down",
        location: "river",
        speaker: "Kiara",
        text: "Sentémonos aquí un ratito.",
        actors: {
          alexis: { x: 384, y: 454, mood: "soft", expression: "soft-love", facing: "right", scale: 0.55 },
          kiara: { x: 556, y: 452, mood: "happy", expression: "gentle-smile", facing: "left", scale: 0.56 }
        },
        props: [{ texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 }],
        camera: { zoom: 1.16, x: 480, y: 318, duration: 900, driftX: 3, driftY: 1.4, driftSpeed: 0.32 },
        cinematic: { letterbox: 20, warmth: 0.04, vignette: 0.05 }
      },
      {
        id: "river-close-enough",
        location: "river",
        speaker: "Narrador",
        text:
          "Se sentaron cerca, no demasiado. Lo suficiente para que el silencio tuviera calor y para que Alexis cuidara hasta cómo respiraba.",
        actors: {
          alexis: { x: 328, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 532, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-normal", x: 482, y: 514, scale: 0.64, depth: 32, float: 0.18 }
        ],
        camera: { zoom: 1.11, x: 484, y: 354, duration: 1100, driftX: 3, driftY: 1.4, driftSpeed: 0.28 },
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
          "Si hubieras estado ahí, habrías entendido por qué nadie tenía prisa: el río, ellos y hasta el aire iban despacio.",
        actors: {
          alexis: { x: 328, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 532, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-normal", x: 482, y: 514, scale: 0.64, depth: 32, float: 0.18 }
        ],
        camera: { zoom: 1.08, x: 486, y: 354, duration: 1300, driftX: 7, driftY: 2.8, driftSpeed: 0.23 },
        cinematic: { letterbox: 22, warmth: 0.05, vignette: 0.06 }
      },
      {
        id: "river-snacks",
        location: "river",
        speaker: "Kiara",
        text: "Traje gomitas y este vasito con cereal y yogurt. Por si nos daba hambre.",
        actors: {
          alexis: { x: 336, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 540, y: 378, mood: "talking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 514, scale: 0.64, depth: 32, float: 0.18 }
        ],
        memory: {
          id: "river-snacks",
          label: "Gomitas junto al río",
          text: "No hubo mantel ni plan perfecto. Solo gomitas, cereal con yogurt y el río acompañando.",
          x: 712,
          y: 312
        },
        camera: { zoom: 1.13, x: 480, y: 356, duration: 900, driftX: 3, driftY: 1.4, driftSpeed: 0.32 },
        cinematic: { letterbox: 20, warmth: 0.05, vignette: 0.05 }
      },
      {
        id: "river-snacks-choice",
        location: "river",
        speaker: "Narrador",
        text:
          "El picnic era improvisado, pero tenía algo que ningún plan caro compra: parecía pensado por ella.",
        actors: {
          alexis: { x: 336, y: 378, mood: "surprised", facing: "right", visible: false },
          kiara: { x: 540, y: 378, mood: "talking", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 514, scale: 0.64, depth: 32, float: 0.18 }
        ],
        camera: { zoom: 1.13, x: 480, y: 356, duration: 900, driftX: 3, driftY: 1.4, driftSpeed: 0.3 },
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
            resultText: "Tú sí viniste preparada. Yo vine con nervios y cero estrategia.",
            stat: { id: "nervios", label: "Nervios" }
          },
          {
            id: "snacks-share",
            label: "Pedir una gomita para compartir.",
            resultSpeaker: "Narrador",
            resultText: "Compartieron las gomitas como si fuera un ritual pequeño. Dulce, simple, peligroso para el corazón.",
            stat: { id: "sueno", label: "Sueño compartido" }
          }
        ]
      },
      {
        id: "river-tease",
        location: "river",
        speaker: "Kiara",
        text: "Alguien tenía que venir preparada. Tú ni llegaste temprano.",
        actors: {
          alexis: { x: 338, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "laughing", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-snacks", x: 482, y: 514, scale: 0.64, depth: 32, float: 0.18 }
        ],
        camera: { zoom: 1.15, x: 480, y: 356, duration: 760, driftX: 2.4, driftY: 1, driftSpeed: 0.4 },
        cinematic: { letterbox: 18, warmth: 0.05, shake: 0.001, shakeDuration: 120 }
      },
      {
        id: "river-look",
        location: "river",
        speaker: "Narrador",
        text:
          "Alexis intentaba escucharla, pero cada vez que la miraba se le desordenaba la frase siguiente y se le ordenaba el corazón.",
        actors: {
          alexis: { x: 338, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 514, scale: 0.66, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.19, x: 478, y: 358, duration: 1200, driftX: 1.2, driftY: 0.8, driftSpeed: 0.26 },
        cinematic: {
          letterbox: 24,
          warmth: 0.06,
          vignette: 0.08,
          intimate: true,
          hideHud: true,
          whisper: "no apartes la mirada"
        },
        pace: "slow"
      },
      {
        id: "river-not-anywhere-else",
        location: "river",
        speaker: "Narrador",
        text:
          "No quería estar en ningún otro lugar. Ni en su casa, ni en otra ciudad, ni en ningún universo donde ella no estuviera sentada ahí.",
        actors: {
          alexis: { x: 338, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 514, scale: 0.66, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.21, x: 478, y: 360, duration: 1250, driftX: 1.2, driftY: 0.8, driftSpeed: 0.24 },
        cinematic: {
          letterbox: 26,
          warmth: 0.07,
          vignette: 0.09,
          intimate: true,
          hideHud: true,
          bloom: 0.05
        },
        pace: "slow"
      },
      {
        id: "river-little-distance",
        location: "river",
        speaker: "Narrador",
        text:
          "El mundo les dejó un espacio pequeño. No para separarlos, sino para que ambos decidieran, sin apuro, si querían cruzarlo.",
        actors: {
          alexis: { x: 338, y: 378, mood: "soft", facing: "right", visible: false },
          kiara: { x: 542, y: 378, mood: "soft", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 514, scale: 0.66, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.23, x: 478, y: 362, duration: 1300, driftX: 0.75, driftY: 0.6, driftSpeed: 0.21 },
        cinematic: {
          letterbox: 28,
          warmth: 0.07,
          vignette: 0.1,
          intimate: true,
          hideHud: true,
          bloom: 0.06,
          whisper: "no apartes la mirada"
        },
        pace: "slow"
      },
      {
        id: "river-silence",
        location: "river",
        speaker: "Narrador",
        text: "El río sonaba igual, pero algo había cambiado entre ellos: el silencio ya no incomodaba, acercaba.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-river-sitting-close", x: 482, y: 514, scale: 0.66, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.25, x: 478, y: 364, duration: 1300, driftX: 0.7, driftY: 0.55, driftSpeed: 0.2 },
        cinematic: {
          letterbox: 30,
          warmth: 0.08,
          vignette: 0.11,
          intimate: true,
          hideHud: true,
          bloom: 0.08,
          chromatic: true,
          riverMagic: 0.18,
          whisper: "algo bonito estaba por ocurrir"
        },
        pace: "slow"
      },
      {
        id: "almost-kiss",
        location: "river",
        speaker: "Narrador",
        text:
          "Alexis se acercó apenas. Kiara no se alejó. El río siguió hablando por los dos, bajito, como pidiendo cuidado.",
        actors: {
          alexis: { x: 350, y: 378, mood: "nervous", facing: "right", visible: false },
          kiara: { x: 524, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-01", x: 480, y: 508, scale: 0.74, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.24, x: 478, y: 360, duration: 1600, driftX: 0.34, driftY: 0.32, driftSpeed: 0.16 },
        cinematic: {
          letterbox: 34,
          warmth: 0.09,
          vignette: 0.12,
          intimate: true,
          hideHud: true,
          bloom: 0.1,
          chromatic: true,
          riverMagic: 0.28,
          slowmo: 0.18,
          whisper: "el mundo se hizo pequeñito",
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
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-02", x: 480, y: 508, scale: 0.76, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.25, x: 478, y: 361, duration: 1700, driftX: 0.26, driftY: 0.24, driftSpeed: 0.14 },
        cinematic: {
          letterbox: 36,
          warmth: 0.1,
          vignette: 0.13,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.12,
          chromatic: true,
          riverMagic: 0.42,
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
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-03", x: 480, y: 508, scale: 0.78, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.26, x: 478, y: 362, duration: 1750, driftX: 0.2, driftY: 0.2, driftSpeed: 0.12 },
        cinematic: {
          letterbox: 38,
          warmth: 0.11,
          vignette: 0.14,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.14,
          chromatic: true,
          riverMagic: 0.56,
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
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-almost-kiss-04", x: 480, y: 508, scale: 0.8, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.27, x: 478, y: 363, duration: 1650, driftX: 0.18, driftY: 0.16, driftSpeed: 0.11 },
        cinematic: {
          letterbox: 40,
          warmth: 0.115,
          vignette: 0.14,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.16,
          chromatic: true,
          riverMagic: 0.72,
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
          { texture: "couple-kiss-sitting", x: 480, y: 508, scale: 0.82, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.27, x: 478, y: 364, duration: 2200, driftX: 0.12, driftY: 0.12, driftSpeed: 0.08 },
        cinematic: {
          letterbox: 42,
          warmth: 0.145,
          vignette: 0.09,
          shake: 0.00045,
          shakeDuration: 140,
          heartbeat: 0.92,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.24,
          chromatic: true,
          magicShift: true,
          riverMagic: 1,
          slowmo: 0.55,
          godrays: 0.5,
          petals: true,
          holdMs: 1850,
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
          { texture: "couple-kiss-sitting", x: 480, y: 508, scale: 0.82, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.265, x: 478, y: 365, duration: 1700, driftX: 0.13, driftY: 0.13, driftSpeed: 0.09 },
        cinematic: {
          letterbox: 44,
          warmth: 0.13,
          vignette: 0.1,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.18,
          chromatic: true,
          riverMagic: 0.92,
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
          { texture: "couple-kiss-sitting", x: 480, y: 508, scale: 0.82, depth: 32, float: 0.14 }
        ],
        camera: { zoom: 1.27, x: 478, y: 365, duration: 1700, driftX: 0.12, driftY: 0.12, driftSpeed: 0.08 },
        cinematic: {
          letterbox: 44,
          warmth: 0.14,
          vignette: 0.08,
          intimate: true,
          hideDialogue: true,
          hideHud: true,
          bloom: 0.16,
          chromatic: true,
          riverMagic: 0.82,
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
        text: "Cuando se separaron, no hicieron falta palabras. A veces respirar juntito ya es bastante después de un momento así.",
        actors: {
          alexis: { x: 384, y: 378, mood: "shy", facing: "right", visible: false },
          kiara: { x: 526, y: 378, mood: "shy", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-post-kiss-shy", x: 480, y: 514, scale: 0.64, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.2, x: 478, y: 362, duration: 1300, driftX: 0.8, driftY: 0.6, driftSpeed: 0.22 },
        cinematic: {
          letterbox: 30,
          warmth: 0.09,
          vignette: 0.08,
          intimate: true,
          hideHud: true,
          bloom: 0.08,
          riverMagic: 0.28,
          whisper: "no hicieron falta palabras"
        },
        pace: "slow"
      },
      {
        id: "chapter-1-end",
        location: "river",
        speaker: "Narrador",
        text: "Desde ese día, ese rinconcito junto al río dejó de ser paisaje. Fue donde el valle los vio imaginar una casa, reír bajito y guardar su primer beso.",
        actors: {
          alexis: { x: 366, y: 378, mood: "finale", facing: "right", visible: false },
          kiara: { x: 526, y: 378, mood: "finale", facing: "left", visible: false }
        },
        props: [
          { texture: "scene-river-picnic-spot", x: 480, y: 540, scale: 1, depth: 23 },
          { texture: "couple-post-kiss-shy", x: 480, y: 514, scale: 0.62, depth: 32, float: 0.16 }
        ],
        camera: { zoom: 1.08, x: 484, y: 344, duration: 1400, driftX: 8, driftY: 3, driftSpeed: 0.22 },
        cinematic: {
          letterbox: 20,
          warmth: 0.06,
          vignette: 0.05,
          intimate: true,
          hideHud: true,
          bloom: 0.06,
          whisper: "fin del capítulo 1"
        },
        pace: "slow",
        completeChapter: true
      }
    ]
  },
  {
    id: "chapter-2",
    number: 2,
    title: "Después del primer beso",
    route: "Noche > Puente > Silencio",
    lockedTeaser: "Se desbloquea al terminar el capítulo 1.",
    beats: [
      {
        id: "kiss-placeholder",
        location: "night",
        speaker: "Narrador",
        text: "Este capítulo se escribirá después, con lo que pasó cuando el río dejó de ser el final.",
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
    lockedTeaser: "Se desbloquea al terminar el capítulo 2.",
    beats: [
      {
        id: "outing-placeholder",
        location: "bosquete",
        speaker: "Narrador",
        text: "Aquí irá la primera salida con objetos, bromas y pequeñas decisiones.",
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
    route: "Álbum > Juegos > Final",
    lockedTeaser: "Se desbloquea al terminar el capítulo 3.",
    beats: [
      {
        id: "room-placeholder",
        location: "room",
        speaker: "Ambos",
        text: "El cuarto será el álbum jugable con escenas, minijuegos y finales secretos.",
        actors: {
          alexis: { x: 360, y: 378, mood: "finale", facing: "right" },
          kiara: { x: 520, y: 378, mood: "finale", facing: "left" }
        },
        completeChapter: true
      }
    ]
  }
];
