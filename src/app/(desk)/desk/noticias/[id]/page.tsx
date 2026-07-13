import { StoryRoom } from "@/components/story-room";
export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <StoryRoom storyId={id} />; }
