import { isChapterAvailableInCurrentDeploy, type ChapterId, type StoryStatId } from "../data/chapters";

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
  storyStats: Record<StoryStatId, number>;
};

const defaultProgress: GameProgress = {
  unlockedChapters: ["chapter-1"],
  completedChapters: [],
  memories: [],
  storyStats: {
    ternura: 0,
    nervios: 0,
    sueno: 0
  }
};

function deploySafeChapterList(chapterIds: ChapterId[] | undefined, keepChapterOne = false) {
  const safeChapterIds = (chapterIds ?? []).filter(isChapterAvailableInCurrentDeploy);

  if (keepChapterOne && !safeChapterIds.includes("chapter-1")) {
    safeChapterIds.unshift("chapter-1");
  }

  return safeChapterIds;
}

export function loadProgress(): GameProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultProgress);

    const parsed = JSON.parse(raw) as Partial<GameProgress>;

    return {
      unlockedChapters: deploySafeChapterList(parsed.unlockedChapters, true),
      completedChapters: deploySafeChapterList(parsed.completedChapters),
      memories: parsed.memories ?? [],
      storyStats: {
        ...defaultProgress.storyStats,
        ...(parsed.storyStats ?? {})
      }
    };
  } catch {
    return structuredClone(defaultProgress);
  }
}

export function saveProgress(progress: GameProgress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function unlockChapter(progress: GameProgress, chapterId: ChapterId) {
  if (!isChapterAvailableInCurrentDeploy(chapterId)) return;

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

export function addStoryStat(progress: GameProgress, statId: StoryStatId, amount = 1) {
  progress.storyStats[statId] = (progress.storyStats[statId] ?? 0) + amount;
}

export function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY);
}
