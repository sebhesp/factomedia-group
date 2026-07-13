import { Suspense } from "react";
import { StoryRoomQuery } from "@/components/story-room-query";
import { Card } from "@/components/ui";

export default function StoryRoomQueryPage() {
  return (
    <Suspense fallback={<Card><p>Cargando Noticia Maestra…</p></Card>}>
      <StoryRoomQuery />
    </Suspense>
  );
}
