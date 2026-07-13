import { createClient } from "@/lib/supabase/client";
import type { Story, StoryStatus, VerificationStatus } from "@/lib/types";
import { slugify } from "@/lib/utils";

type ExternalMatch = {
  id: string;
  source_name: string;
  source_url: string;
  relation: string;
};

type PipelineEvent = {
  id: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  occurred_at: string;
  payload: Record<string, unknown> | null;
};

type MediaRelation = {
  permalink: string;
  published_at: string;
  presenter_name: string | null;
  instagram_external_matches: ExternalMatch[] | null;
  instagram_pipeline_events: PipelineEvent[] | null;
};

type DraftRow = {
  id: string;
  media_id: string;
  content_type: string;
  title: string;
  dek: string | null;
  lead: string | null;
  body: string;
  context: string | null;
  author_name: string | null;
  verification_status: string;
  claims: Array<{ text?: string; status?: string }> | null;
  sources: Array<{ name?: string; url?: string; type?: string }> | null;
  editor_status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  instagram_media: MediaRelation | MediaRelation[];
};

function firstRelation<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function mapStatus(value: string): StoryStatus {
  if (value === "published") return "published";
  if (value === "approved") return "approved";
  if (value === "changes_requested") return "developing";
  if (value === "needs_review") return "review";
  return "draft";
}

function mapClaimStatus(value?: string): VerificationStatus {
  if (value === "editorially_reviewed_origin" || value === "confirmed" || value === "supported") return "supported";
  if (value === "disputed") return "disputed";
  if (value === "false") return "false";
  return "pending";
}

export async function loadInstagramStory(storyId: string) {
  const client = createClient();
  if (!client) return null;

  const { data, error } = await client
    .from("instagram_story_drafts")
    .select(`
      id,
      media_id,
      content_type,
      title,
      dek,
      lead,
      body,
      context,
      author_name,
      verification_status,
      claims,
      sources,
      editor_status,
      created_at,
      updated_at,
      published_at,
      instagram_media!inner(
        permalink,
        published_at,
        presenter_name,
        instagram_external_matches(id,source_name,source_url,relation),
        instagram_pipeline_events(id,event_type,actor_type,actor_id,occurred_at,payload)
      )
    `)
    .eq("media_id", storyId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as DraftRow;
  const media = firstRelation(row.instagram_media);
  if (!media) return null;
  const externalSources = media.instagram_external_matches ?? [];
  const storedSources = row.sources ?? [];
  const sourceRows = [
    {
      id: `instagram-${row.media_id}`,
      name: "El Facto — Reel revisado",
      url: media.permalink,
      type: "link" as const,
      note: "Origen editorial revisado",
    },
    ...storedSources
      .filter((source) => source.url !== media.permalink)
      .map((source, index) => ({
        id: `stored-${index}`,
        name: source.name ?? "Fuente registrada",
        url: source.url,
        type: "link" as const,
        note: source.type,
      })),
    ...externalSources.map((source) => ({
      id: source.id,
      name: source.source_name,
      url: source.source_url,
      type: "link" as const,
      note: source.relation,
    })),
  ];

  const story: Story = {
    id: row.media_id,
    slug: slugify(row.title),
    title: row.title,
    summary: row.dek ?? row.lead ?? "",
    body: [row.lead, row.body, row.context].filter(Boolean).join("\n\n"),
    category: row.content_type === "verification" ? "Verificación" : row.content_type === "analysis" ? "Análisis" : "Noticias",
    status: mapStatus(row.editor_status),
    author: row.author_name ?? media.presenter_name ?? "Autor por confirmar",
    responsible: row.author_name ?? media.presenter_name ?? "Equipo editorial",
    sources: sourceRows,
    claims: (row.claims ?? []).map((claim, index) => ({
      id: `claim-${index}`,
      text: claim.text ?? "Afirmación sin texto",
      status: mapClaimStatus(claim.status),
      sourceIds: [`instagram-${row.media_id}`],
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
    corrections: [],
    events: (media.instagram_pipeline_events ?? []).map((event) => ({
      id: event.id,
      type: event.event_type.replaceAll("_", " "),
      actor: event.actor_type === "user" ? "Equipo editorial" : event.actor_type === "ai" ? "IA editorial" : "Sistema",
      occurredAt: event.occurred_at,
      comment: typeof event.payload?.comment === "string" ? event.payload.comment : undefined,
    })),
    metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 },
    demo: false,
  };

  return story;
}

export async function reviewInstagramStory(
  story: Story,
  action: "save" | "request_review" | "approve" | "request_changes" | "publish",
  comment?: string,
) {
  const client = createClient();
  if (!client) return { ok: false as const, reason: "not_configured" as const };

  const patch = {
    title: story.title,
    dek: story.summary,
    body: story.body,
    author_name: story.author,
    claims: story.claims.map((claim) => ({ text: claim.text, status: claim.status })),
    sources: story.sources.map((source) => ({ name: source.name, url: source.url, type: source.type })),
  };

  const { data, error } = await client.functions.invoke("instagram-review", {
    body: { media_id: story.id, action, comment, patch },
  });

  if (error) return { ok: false as const, reason: "request_failed" as const, error: error.message };
  return { ok: true as const, data };
}
