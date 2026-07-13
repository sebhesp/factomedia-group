"use client";

import { useSearchParams } from "next/navigation";
import { StoryRoom } from "@/components/story-room";

export function StoryRoomQuery() {
  const params = useSearchParams();
  return <StoryRoom storyId={params.get("id") ?? ""} />;
}
