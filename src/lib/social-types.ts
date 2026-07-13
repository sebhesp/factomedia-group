export type SocialPlatform = "x" | "instagram" | "threads";
export type SocialOrigin = "factomedia" | "native" | "manual";
export type SocialPostStatus = "draft" | "scheduled" | "published" | "deleted" | "error";
export type SocialPostFormat = "alert" | "update" | "thread" | "context" | "correction" | "closing" | "caption" | "note";

export interface SocialMetricSnapshot {
  capturedAt: string;
  views: number;
  reach?: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes?: number;
  shares?: number;
  saves?: number;
  linkClicks?: number;
  profileVisits?: number;
  followersGained?: number;
}

export interface SocialAction {
  id: string;
  type: string;
  actor: string;
  occurredAt: string;
  detail?: string;
}

export interface SocialPost {
  id: string;
  externalId?: string;
  platform: SocialPlatform;
  origin: SocialOrigin;
  status: SocialPostStatus;
  format: SocialPostFormat;
  account: string;
  text: string;
  publishedAt?: string;
  scheduledAt?: string;
  storyId?: string;
  storyTitle?: string;
  author?: string;
  approvedBy?: string;
  url?: string;
  parentPostId?: string;
  version: number;
  importedAt?: string;
  lastSyncedAt?: string;
  metrics: SocialMetricSnapshot[];
  actions: SocialAction[];
  demo?: boolean;
}

export interface SocialAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  postId?: string;
  storyId?: string;
  createdAt: string;
  resolved?: boolean;
}

export interface StoryDistributionSummary {
  storyId: string;
  storyTitle: string;
  postCount: number;
  platforms: SocialPlatform[];
  views: number;
  interactions: number;
  linkClicks: number;
  followersGained: number;
}
