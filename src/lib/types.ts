export const STORY_STATUSES = [
  "draft",
  "developing",
  "waiting_information",
  "verification",
  "review",
  "approved",
  "scheduled",
  "published",
  "updated",
  "corrected",
  "archived",
  "discarded",
] as const;

export type StoryStatus = (typeof STORY_STATUSES)[number];

export type VerificationStatus = "pending" | "supported" | "disputed" | "false";

export interface Source {
  id: string;
  name: string;
  url?: string;
  type: "person" | "document" | "link" | "dataset";
  note?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: VerificationStatus;
  sourceIds: string[];
}

export interface EditorialEvent {
  id: string;
  type: string;
  actor: string;
  occurredAt: string;
  comment?: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  status: StoryStatus;
  author: string;
  responsible: string;
  sources: Source[];
  claims: Claim[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  corrections: string[];
  events: EditorialEvent[];
  metrics: {
    views: number;
    readsStarted: number;
    readsCompleted: number;
    shares: number;
  };
  demo?: boolean;
}
