import { StoryRoom } from "@/components/story-room";
import { demoStories } from "@/lib/demo-data";

export function generateStaticParams() {
  return demoStories.map((story) => ({ id: story.id }));
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryRoom storyId={id} />;
}
