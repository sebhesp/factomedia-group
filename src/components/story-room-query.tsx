"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { InstagramStoryRoom } from "@/components/instagram-story-room";
import { StoryRoom } from "@/components/story-room";
import { getLocalStory } from "@/lib/demo-store";

type RoomKind = "loading" | "instagram" | "story";

export function StoryRoomQuery() {
  const params = useSearchParams();
  const storyId = params.get("id") ?? "";
  const source = params.get("source");
  const [roomKind, setRoomKind] = useState<RoomKind>("loading");

  useEffect(() => {
    if (source === "instagram" || storyId.startsWith("ig-")) {
      setRoomKind("instagram");
      return;
    }
    if (getLocalStory(storyId)) {
      setRoomKind("story");
      return;
    }
    const looksLikeDatabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storyId);
    setRoomKind(looksLikeDatabaseId ? "instagram" : "story");
  }, [source, storyId]);

  if (roomKind === "loading") return <Card><p>Abriendo la Nota Maestra…</p></Card>;
  if (roomKind === "instagram") return <InstagramStoryRoom storyId={storyId} />;
  return <StoryRoom storyId={storyId} />;
}
