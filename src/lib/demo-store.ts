import type { Story } from "@/lib/types";

const STORY_PREFIX = "facto_story_";

export function listLocalStories(): Story[] {
  if (typeof window === "undefined") return [];
  const stories: Story[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(STORY_PREFIX)) continue;
    try {
      const value = window.localStorage.getItem(key);
      if (value) stories.push(JSON.parse(value) as Story);
    } catch {
      // Ignore corrupted demo entries instead of breaking the whole desk.
    }
  }
  return stories.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalStory(id: string): Story | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(`${STORY_PREFIX}${id}`);
  if (!value) return null;
  try { return JSON.parse(value) as Story; } catch { return null; }
}

export function saveLocalStory(story: Story) {
  window.localStorage.setItem(`${STORY_PREFIX}${story.id}`, JSON.stringify(story));
  window.dispatchEvent(new CustomEvent("facto:story-updated", { detail: story.id }));
}
