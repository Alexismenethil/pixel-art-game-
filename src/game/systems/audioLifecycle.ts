export const FORCE_STOP_AUDIO_EVENT = "alexis-kiara:force-stop-audio";

type AudioLifecycleWindow = Window &
  typeof globalThis & {
    __alexisKiaraAudioElements?: Set<HTMLMediaElement>;
    __alexisKiaraAudioContexts?: Set<AudioContext>;
    __alexisKiaraAudioGuardInterval?: number;
  };

const lifecycleWindow = window as AudioLifecycleWindow;

function audioElements() {
  lifecycleWindow.__alexisKiaraAudioElements ??= new Set<HTMLMediaElement>();
  return lifecycleWindow.__alexisKiaraAudioElements;
}

function audioContexts() {
  lifecycleWindow.__alexisKiaraAudioContexts ??= new Set<AudioContext>();
  return lifecycleWindow.__alexisKiaraAudioContexts;
}

export function registerGameAudioElement(element: HTMLMediaElement) {
  audioElements().add(element);
}

export function unregisterGameAudioElement(element: HTMLMediaElement) {
  audioElements().delete(element);
}

export function registerGameAudioContext(context: AudioContext) {
  audioContexts().add(context);
}

export function unregisterGameAudioContext(context: AudioContext) {
  audioContexts().delete(context);
}

export function forceStopGameAudio() {
  window.dispatchEvent(new Event(FORCE_STOP_AUDIO_EVENT));
  stopRegisteredAudio();
  document.querySelectorAll("audio, video").forEach((element) => {
    if (element instanceof HTMLMediaElement) stopMediaElement(element);
  });
}

function stopRegisteredAudio() {
  for (const element of [...audioElements()]) {
    stopMediaElement(element);
    unregisterGameAudioElement(element);
  }

  for (const context of [...audioContexts()]) {
    if (context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
    unregisterGameAudioContext(context);
  }
}

function stopMediaElement(element: HTMLMediaElement) {
  element.pause();
  try {
    element.currentTime = 0;
  } catch {}
  element.removeAttribute("src");
  element.load();
}

export function installDevServerAudioGuard() {
  if (!import.meta.env.DEV) return () => undefined;

  if (lifecycleWindow.__alexisKiaraAudioGuardInterval !== undefined) {
    window.clearInterval(lifecycleWindow.__alexisKiaraAudioGuardInterval);
  }
  let failedChecks = 0;
  const interval = window.setInterval(async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    try {
      const response = await fetch("/", {
        cache: "no-store",
        signal: controller.signal
      });
      failedChecks = response.ok ? 0 : failedChecks + 1;
    } catch {
      failedChecks += 1;
    } finally {
      window.clearTimeout(timeout);
    }

    if (failedChecks >= 2) {
      forceStopGameAudio();
      window.clearInterval(interval);
      lifecycleWindow.__alexisKiaraAudioGuardInterval = undefined;
    }
  }, 2000);
  lifecycleWindow.__alexisKiaraAudioGuardInterval = interval;

  const cleanup = () => {
    window.clearInterval(interval);
    if (lifecycleWindow.__alexisKiaraAudioGuardInterval === interval) {
      lifecycleWindow.__alexisKiaraAudioGuardInterval = undefined;
    }
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}
