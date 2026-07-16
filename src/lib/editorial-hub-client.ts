import { createClient } from "@/lib/supabase/client";
import {
  loadInstagramEngineItems,
  type InstagramEngineItem,
  type InstagramEngineStage,
} from "@/lib/instagram-pipeline-client";

export type EditorialHubMode = "demo" | "live";
export type EditorialHubAction = "run_cycle" | "repair_queue" | "process_next";

export type EditorialHubQueueItem = {
  id: string;
  title: string;
  detail: string;
  presenter: string | null;
  stage: InstagramEngineStage;
  publishedAgo: string;
  href: string;
};

export type EditorialHubSnapshot = {
  mode: EditorialHubMode;
  counts: {
    review: number;
    automatic: number;
    publishedToday: number;
  };
  priority: EditorialHubQueueItem | null;
  queue: EditorialHubQueueItem[];
  system: {
    accountStatus: string;
    lastSyncedAt: string | null;
    failedJobs: number;
    staleJobs: number;
    issueCount: number;
  };
};

export type EditorialHubOperationResult = {
  ok?: boolean;
  action?: EditorialHubAction;
  repair?: {
    recovered_stale?: number;
    retried_failed?: number;
  };
  sync?: {
    created?: number;
    refreshed?: number;
    sync_mode?: string;
  } | null;
  process?: {
    processed?: boolean;
    media_id?: string;
    reason?: string;
  } | null;
  comparison?: Record<string, unknown> | null;
  error?: string;
};

type JobRow = {
  stage: string;
  locked_at: string | null;
  last_error_code: string | null;
};

type AccountRow = {
  status: string;
  last_synced_at: string | null;
};

const processingStages = new Set<InstagramEngineStage>(["detected", "transcribing", "researching"]);

function isToday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function detailFor(item: InstagramEngineItem) {
  if (item.stage === "review") return "Necesita una decisión editorial";
  if (item.stage === "ready") return "Aprobada y lista para publicar";
  if (item.stage === "published") return "Publicada en el sitio";
  if (item.stage === "detected") return "Lista para comenzar el procesamiento";
  if (item.stage === "transcribing") return "Transcribiendo audio y texto visible";
  return "Preparando nota y contexto";
}

function hrefFor(item: InstagramEngineItem) {
  if (item.stage === "review" || item.stage === "ready") return `/desk/noticias/sala?id=${item.id}`;
  if (item.stage === "published" && item.slug) return `/noticias/${item.slug}`;
  return `/instagram?estado=processing&post=${item.id}`;
}

function toQueueItem(item: InstagramEngineItem): EditorialHubQueueItem {
  return {
    id: item.id,
    title: item.title,
    detail: detailFor(item),
    presenter: item.presenter,
    stage: item.stage,
    publishedAgo: item.publishedAgo,
    href: hrefFor(item),
  };
}

function sortOperationally(items: InstagramEngineItem[]) {
  const order: Record<InstagramEngineStage, number> = {
    review: 0,
    ready: 1,
    detected: 2,
    transcribing: 3,
    researching: 4,
    published: 5,
  };
  return [...items].sort((left, right) => order[left.stage] - order[right.stage]);
}

export function demoEditorialHubSnapshot(): EditorialHubSnapshot {
  const demoItems: EditorialHubQueueItem[] = [
    {
      id: "ig-001",
      title: "Congreso abre discusión sobre reducción de la jornada laboral",
      detail: "Necesita confirmar una cifra",
      presenter: "Ilse Reyes",
      stage: "review",
      publishedAgo: "hace 4 min",
      href: "/desk/noticias/sala?id=ig-001",
    },
    {
      id: "ig-002",
      title: "Servicio provisional en dos estaciones de la Línea 3",
      detail: "Aprobada y lista para publicar",
      presenter: "Pavel Martínez",
      stage: "ready",
      publishedAgo: "hace 11 min",
      href: "/desk/noticias/sala?id=ig-002",
    },
    {
      id: "ig-003",
      title: "Qué implica la nueva política de vivienda para las familias",
      detail: "Preparando nota y contexto",
      presenter: "José Jesús López Lagos",
      stage: "researching",
      publishedAgo: "hace 18 min",
      href: "/instagram?estado=processing&post=ig-003",
    },
  ];

  return {
    mode: "demo",
    counts: { review: 2, automatic: 3, publishedToday: 8 },
    priority: demoItems[0],
    queue: demoItems,
    system: {
      accountStatus: "connected",
      lastSyncedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
      failedJobs: 0,
      staleJobs: 0,
      issueCount: 0,
    },
  };
}

export async function loadEditorialHubSnapshot(): Promise<EditorialHubSnapshot> {
  const engine = await loadInstagramEngineItems();
  if (engine.mode !== "live") return demoEditorialHubSnapshot();

  const client = createClient();
  if (!client) return demoEditorialHubSnapshot();

  const [accountResult, jobsResult] = await Promise.all([
    client
      .from("instagram_accounts")
      .select("status,last_synced_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("instagram_pipeline_jobs")
      .select("stage,locked_at,last_error_code")
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  const account = accountResult.data as AccountRow | null;
  const jobs = (jobsResult.data ?? []) as JobRow[];
  const staleBefore = Date.now() - 15 * 60_000;
  const staleJobs = jobs.filter((job) => {
    if (!job.locked_at) return false;
    const lockedAt = new Date(job.locked_at).getTime();
    return Number.isFinite(lockedAt) && lockedAt < staleBefore;
  }).length;
  const failedJobs = jobs.filter((job) => job.stage === "failed_retryable" || Boolean(job.last_error_code)).length;

  const operational = sortOperationally(engine.items.filter((item) => item.stage !== "published"));
  const queue = operational.slice(0, 5).map(toQueueItem);
  const priorityItem = operational.find((item) => item.stage === "review")
    ?? operational.find((item) => item.stage === "ready")
    ?? operational[0]
    ?? null;

  return {
    mode: "live",
    counts: {
      review: engine.items.filter((item) => item.stage === "review" || item.stage === "ready").length,
      automatic: engine.items.filter((item) => processingStages.has(item.stage)).length + failedJobs,
      publishedToday: engine.items.filter((item) => item.stage === "published" && isToday(item.publishedAt)).length,
    },
    priority: priorityItem ? toQueueItem(priorityItem) : null,
    queue,
    system: {
      accountStatus: account?.status ?? "pending",
      lastSyncedAt: account?.last_synced_at ?? null,
      failedJobs,
      staleJobs,
      issueCount: failedJobs + staleJobs,
    },
  };
}

export async function requestEditorialHubOperation(action: EditorialHubAction, mediaId?: string) {
  const client = createClient();
  if (!client) return { ok: false as const, reason: "not_configured" as const };
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return { ok: false as const, reason: "not_authenticated" as const };

  const { data, error } = await client.functions.invoke("instagram-ops", {
    body: {
      action,
      media_id: mediaId ?? null,
      stale_minutes: 15,
    },
  });

  if (error) {
    return {
      ok: false as const,
      reason: "operation_failed" as const,
      error: error.message,
    };
  }

  return {
    ok: true as const,
    data: data as EditorialHubOperationResult,
  };
}
