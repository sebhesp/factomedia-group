import { createClient } from "@/lib/supabase/client";

export type InstagramEngineStage = "detected" | "transcribing" | "researching" | "review" | "ready" | "published";

export type InstagramEngineItem = {
  id: string;
  title: string;
  publishedAgo: string;
  presenter: string | null;
  duration: string;
  stage: InstagramEngineStage;
  progress: number;
  note: string;
  externalMatches: number;
  timingComparison: string;
};

type JobRelation = { progress?: number | null; stage?: string | null };
type DraftRelation = { title?: string | null; editor_status?: string | null };
type EventRelation = { event_type?: string | null; payload?: Record<string, unknown> | null; occurred_at?: string | null };

type PipelineRow = {
  id: string;
  caption: string | null;
  media_type: string;
  published_at: string;
  presenter_name: string | null;
  processing_status: string;
  metadata: Record<string, unknown> | null;
  instagram_pipeline_jobs: JobRelation | JobRelation[] | null;
  instagram_story_drafts: DraftRelation | DraftRelation[] | null;
  instagram_external_matches: Array<{ id: string }> | null;
  instagram_pipeline_events: EventRelation[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 45) return "ahora";
  if (seconds < 3600) return `hace ${Math.round(seconds / 60)} min`;
  if (seconds < 86_400) return `hace ${Math.round(seconds / 3600)} h`;
  return `hace ${Math.round(seconds / 86_400)} d`;
}

function stageFrom(row: PipelineRow, draft: DraftRelation | null): InstagramEngineStage {
  if (draft?.editor_status === "published" || row.processing_status === "published") return "published";
  if (draft?.editor_status === "approved") return "ready";
  if (draft || row.processing_status === "needs_review") return "review";
  if (["researching", "analyzing", "drafting"].includes(row.processing_status)) return "researching";
  if (row.processing_status === "transcribing") return "transcribing";
  return "detected";
}

function noteFrom(stage: InstagramEngineStage) {
  switch (stage) {
    case "published": return "Nota publicada desde el Reel y métricas sincronizadas.";
    case "ready": return "Nota aprobada y lista para publicación web.";
    case "review": return "Nota generada desde el Reel revisado. Requiere aprobación editorial final.";
    case "researching": return "La nota se está enriqueciendo con contexto y comparación temporal.";
    case "transcribing": return "Procesando audio, caption y texto visible en pantalla.";
    default: return "Origen editorial detectado. El procesamiento comenzará automáticamente.";
  }
}

function timingFrom(events: EventRelation[] | null | undefined) {
  const event = [...(events ?? [])]
    .filter((item) => item.event_type === "external_timing_compared")
    .sort((a, b) => String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? "")))[0];
  const payload = event?.payload;
  const status = typeof payload?.timing_status === "string" ? payload.timing_status : null;
  const earlier = typeof payload?.earlier_sources === "number" ? payload.earlier_sources : 0;
  if (status === "EARLY") return "El Facto publicó antes que todas las fuentes comparables detectadas";
  if (status === "AMONG_FIRST") return `El Facto estuvo entre los primeros; ${earlier} fuente(s) aparecieron antes`;
  if (status === "FOLLOWING") return `${earlier} fuente(s) comparables publicaron antes`;
  if (status === "NO_COMPARABLE_TIME") return "No se encontraron horarios comparables confiables";
  return "Comparación temporal pendiente";
}

function titleFrom(row: PipelineRow, draft: DraftRelation | null) {
  if (draft?.title?.trim()) return draft.title.trim();
  const caption = row.caption?.replace(/\s+/g, " ").trim();
  if (!caption) return "Reel detectado sin título provisional";
  return caption.length > 110 ? `${caption.slice(0, 107).replace(/\s+\S*$/, "")}…` : caption;
}

export async function loadInstagramEngineItems() {
  const client = createClient();
  if (!client) return { mode: "demo" as const, items: [] as InstagramEngineItem[], error: null };
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return { mode: "demo" as const, items: [] as InstagramEngineItem[], error: "not_authenticated" };

  const { data, error } = await client
    .from("instagram_media")
    .select(`
      id,
      caption,
      media_type,
      published_at,
      presenter_name,
      processing_status,
      metadata,
      instagram_pipeline_jobs(progress,stage),
      instagram_story_drafts(title,editor_status),
      instagram_external_matches(id),
      instagram_pipeline_events(event_type,payload,occurred_at)
    `)
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) return { mode: "demo" as const, items: [] as InstagramEngineItem[], error: error.message };

  const rows = (data ?? []) as unknown as PipelineRow[];
  const items = rows.map((row) => {
    const job = firstRelation(row.instagram_pipeline_jobs);
    const draft = firstRelation(row.instagram_story_drafts);
    const stage = stageFrom(row, draft);
    const rawDuration = row.metadata?.duration_seconds;
    const durationSeconds = typeof rawDuration === "number" ? rawDuration : null;
    const duration = durationSeconds === null
      ? "REEL"
      : `${String(Math.floor(durationSeconds / 60)).padStart(2, "0")}:${String(Math.round(durationSeconds % 60)).padStart(2, "0")}`;

    return {
      id: row.id,
      title: titleFrom(row, draft),
      publishedAgo: relativeTime(row.published_at),
      presenter: row.presenter_name,
      duration,
      stage,
      progress: typeof job?.progress === "number" ? job.progress : stage === "published" || stage === "ready" || stage === "review" ? 100 : 5,
      note: noteFrom(stage),
      externalMatches: row.instagram_external_matches?.length ?? 0,
      timingComparison: timingFrom(row.instagram_pipeline_events),
    } satisfies InstagramEngineItem;
  });

  return { mode: "live" as const, items, error: null };
}

export async function requestInstagramSync() {
  const client = createClient();
  if (!client) return { ok: false as const, reason: "not_configured" as const };
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return { ok: false as const, reason: "not_authenticated" as const };
  const { data, error } = await client.functions.invoke("instagram-sync", { body: {} });
  if (error) return { ok: false as const, reason: "sync_failed" as const, error: error.message };
  return { ok: true as const, data };
}
