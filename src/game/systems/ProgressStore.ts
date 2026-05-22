import type { ChapterId } from "../data/chapters";

const STORAGE_KEY = "alexis-kiara-phaser-progress-v1";

export type MemoryEntry = {
  id: string;
  label: string;
  text: string;
};

export type GameProgress = {
  unlockedChapters: ChapterId[];
  completedChapters: ChapterId[];
  memories: MemoryEntry[];
};

const defaultProgress: GameProgress = {
  unlockedChapters: ["chapter-1"],
  completedChapters: [],
  memories: []
};

export function loadProgress(): GameProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultProgress);

    const parsed = JSON.parse(raw) as Partial<GameProgress>;

    return {
      unlockedChapters: parsed.unlockedChapters ?? ["chapter-1"],
      completedChapters: parsed.completedChapters ?? [],
      memories: parsed.memories ?? []
    };
  } catch {
    return structuredClone(defaultProgress);
  }
}

export function saveProgress(progress: GameProgress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function unlockChapter(progress: GameProgress, chapterId: ChapterId) {
  if (!progress.unlockedChapters.includes(chapterId)) {
    progress.unlockedChapters.push(chapterId);
  }
}

export function completeChapter(progress: GameProgress, chapterId: ChapterId) {
  if (!progress.completedChapters.includes(chapterId)) {
    progress.completedChapters.push(chapterId);
  }
}

export function addMemory(progress: GameProgress, memory: MemoryEntry) {
  if (!progress.memories.some((entry) => entry.id === memory.id)) {
    progress.memories.push(memory);
  }
}

export function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY);
}
