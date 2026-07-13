"use client";

import { useSearchParams } from "next/navigation";
import { InstagramStoryRoom } from "@/components/instagram-story-room";
import { StoryRoom } from "@/components/story-room";

export function StoryRoomQuery() {
  const params = useSearchParams();
  const storyId = params.get("id") ?? "";
  const source = params.get("source");
  if (source === "instagram" || storyId.startsWith("ig-")) return <InstagramStoryRoom storyId={storyId} />;
  return <StoryRoom storyId={storyId} />;
}
