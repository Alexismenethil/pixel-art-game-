export const FORCE_STOP_AUDIO_EVENT = "alexis-kiara:force-stop-audio";

export function forceStopGameAudio() {
  window.dispatchEvent(new Event(FORCE_STOP_AUDIO_EVENT));
}

export function installDevServerAudioGuard() {
  if (!import.meta.env.DEV) return;

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
    }
  }, 2000);

  window.addEventListener("pagehide", () => window.clearInterval(interval), { once: true });
}
