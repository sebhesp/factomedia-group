import type { Story } from "@/lib/types";
import type { SocialPost } from "@/lib/social-types";

export interface StoryMatch {
  storyId: string;
  storyTitle: string;
  confidence: number;
  reasons: string[];
}

const STOP_WORDS = new Set([
  "para", "como", "desde", "hasta", "sobre", "entre", "esta", "este", "estos", "estas",
  "tiene", "tienen", "será", "esta", "todo", "todos", "tras", "ante", "pero", "porque",
  "donde", "cuando", "también", "ahora", "esto", "más", "menos", "una", "unos", "unas",
  "del", "las", "los", "por", "con", "sin", "que", "sus", "han", "fue", "son",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 3 && !STOP_WORDS.has(token)));
}

function overlap(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((token) => { if (right.has(token)) shared += 1; });
  return shared / Math.min(left.size, right.size);
}

function hoursBetween(left?: string, right?: string) {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 3_600_000;
}

export function suggestStoryMatches(post: SocialPost, stories: Story[]): StoryMatch[] {
  const postTokens = tokens(post.text);

  return stories.map((story) => {
    const titleScore = overlap(postTokens, tokens(story.title));
    const summaryScore = overlap(postTokens, tokens(`${story.summary} ${story.body.slice(0, 600)}`));
    const temporalDistance = hoursBetween(post.publishedAt, story.updatedAt);
    const temporalScore = temporalDistance <= 2 ? 1 : temporalDistance <= 12 ? 0.7 : temporalDistance <= 48 ? 0.35 : 0;
    const directLink = post.url?.includes(story.slug) ? 1 : 0;
    const confidence = Math.min(0.99, titleScore * 0.5 + summaryScore * 0.3 + temporalScore * 0.15 + directLink * 0.35);
    const reasons: string[] = [];

    if (directLink) reasons.push("El enlace coincide con la historia");
    if (titleScore >= 0.45) reasons.push("Coincidencia alta con el título");
    if (summaryScore >= 0.35) reasons.push("Comparte hechos y entidades relevantes");
    if (temporalScore >= 0.7) reasons.push("Fue publicado cerca de la última actualización");

    return {
      storyId: story.id,
      storyTitle: story.title,
      confidence: Math.round(confidence * 100) / 100,
      reasons,
    };
  }).filter((match) => match.confidence >= 0.25).sort((a, b) => b.confidence - a.confidence);
}

export function needsHumanConfirmation(match?: StoryMatch) {
  return !match || match.confidence < 0.88;
}
