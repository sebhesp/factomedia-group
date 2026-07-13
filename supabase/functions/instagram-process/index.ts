import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-worker-secret",
};

type MediaRow = {
  id: string;
  instagram_media_id: string;
  media_type: string;
  media_url: string | null;
  caption: string | null;
  permalink: string;
  published_at: string;
  presenter_id: string | null;
  presenter_name: string | null;
};

type DraftShape = {
  content_type: "news" | "analysis" | "verification";
  title: string;
  dek: string;
  lead: string;
  body: string;
  context: string;
  claims: Array<{ text: string; origin: "reel" | "caption"; status: "editorially_reviewed_origin" | "needs_review" }>;
  seo: { slug: string; meta_title: string; meta_description: string };
  cover: { strategy: "video_frame" | "thumbnail"; timestamp_seconds: number | null; alt_text: string };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function extractResponseText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  throw new Error("OpenAI response did not contain structured text");
}

async function transcribeMedia(media: MediaRow, openAIKey: string, model: string) {
  if (!media.media_url || !/VIDEO|REELS/i.test(media.media_type)) return media.caption?.trim() ?? "";

  const source = await fetch(media.media_url, { signal: AbortSignal.timeout(30_000) });
  if (!source.ok) throw new Error(`Could not download Instagram media (${source.status})`);
  const blob = await source.blob();

  const maxBytes = Number(Deno.env.get("MAX_TRANSCRIPTION_BYTES") ?? 24_000_000);
  if (blob.size > maxBytes) throw new Error(`Media is too large for direct transcription (${blob.size} bytes)`);

  const form = new FormData();
  form.append("model", model);
  form.append("language", "es");
  form.append("response_format", "json");
  form.append("file", new File([blob], `${media.instagram_media_id}.mp4`, { type: blob.type || "video/mp4" }));

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAIKey}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? `Transcription failed (${response.status})`);
  if (typeof payload.text !== "string") throw new Error("Transcription response did not contain text");
  return payload.text.trim();
}

async function createDraft(media: MediaRow, transcript: string, openAIKey: string, model: string): Promise<DraftShape> {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["content_type", "title", "dek", "lead", "body", "context", "claims", "seo", "cover"],
    properties: {
      content_type: { type: "string", enum: ["news", "analysis", "verification"] },
      title: { type: "string" },
      dek: { type: "string" },
      lead: { type: "string" },
      body: { type: "string" },
      context: { type: "string" },
      claims: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "origin", "status"],
          properties: {
            text: { type: "string" },
            origin: { type: "string", enum: ["reel", "caption"] },
            status: { type: "string", enum: ["editorially_reviewed_origin", "needs_review"] },
          },
        },
      },
      seo: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "meta_title", "meta_description"],
        properties: {
          slug: { type: "string" },
          meta_title: { type: "string" },
          meta_description: { type: "string" },
        },
      },
      cover: {
        type: "object",
        additionalProperties: false,
        required: ["strategy", "timestamp_seconds", "alt_text"],
        properties: {
          strategy: { type: "string", enum: ["video_frame", "thumbnail"] },
          timestamp_seconds: { anyOf: [{ type: "number" }, { type: "null" }] },
          alt_text: { type: "string" },
        },
      },
    },
  };

  const instructions = [
    "Eres el motor editorial de El Facto.",
    "Convierte exclusivamente el Reel y su caption en una nota periodística en español de México.",
    "El Reel fue revisado editorialmente antes de publicarse y es el origen confiable.",
    "No agregues cifras, fechas, citas, nombres ni hechos que no estén en el Reel o caption.",
    "Separa hechos, declaraciones y análisis. Conserva incertidumbre explícita.",
    "Tono: claro, firme, accesible, crítico sin cinismo y no condescendiente.",
    "Explica impacto ciudadano cuando esté presente en el material.",
    "El cuerpo debe ser una nota completa, no una lista ni un resumen del video.",
  ].join("\n");

  const input = [
    `URL de origen: ${media.permalink}`,
    `Publicado en Instagram: ${media.published_at}`,
    `Presentador: ${media.presenter_name ?? "por confirmar"}`,
    `CAPTION:\n${media.caption ?? "(sin caption)"}`,
    `TRANSCRIPCIÓN:\n${transcript || "(sin audio utilizable)"}`,
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: input }] },
      ],
      text: { format: { type: "json_schema", name: "factomedia_instagram_note", strict: true, schema } },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? `Draft generation failed (${response.status})`);
  return JSON.parse(extractResponseText(payload)) as DraftShape;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const workerSecret = Deno.env.get("INSTAGRAM_WORKER_SECRET");
  if (!workerSecret || request.headers.get("x-worker-secret") !== workerSecret) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = required("SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const openAIKey = required("OPENAI_API_KEY");
  const transcriptionModel = Deno.env.get("OPENAI_TRANSCRIPTION_MODEL") ?? "gpt-4o-mini-transcribe";
  const editorialModel = required("OPENAI_EDITORIAL_MODEL");
  const workerId = `edge-${crypto.randomUUID()}`;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let jobId: string | null = null;
  let mediaId: string | null = null;

  try {
    const requestBody = await request.json().catch(() => ({}));
    const requestedMediaId = typeof requestBody.media_id === "string" ? requestBody.media_id : null;

    let query = admin
      .from("instagram_pipeline_jobs")
      .select("id,media_id,stage,attempts")
      .in("stage", ["detected", "imported", "failed_retryable"])
      .lte("next_attempt_at", new Date().toISOString())
      .is("locked_at", null)
      .order("created_at", { ascending: true })
      .limit(1);
    if (requestedMediaId) query = query.eq("media_id", requestedMediaId);

    const { data: jobs, error: queueError } = await query;
    if (queueError) throw queueError;
    const job = jobs?.[0];
    if (!job) return json({ ok: true, processed: false, reason: "queue_empty" });

    jobId = job.id;
    mediaId = job.media_id;
    const { data: locked, error: lockError } = await admin
      .from("instagram_pipeline_jobs")
      .update({ locked_at: new Date().toISOString(), locked_by: workerId, stage: "transcribing", progress: 15, attempts: job.attempts + 1, started_at: new Date().toISOString() })
      .eq("id", job.id)
      .is("locked_at", null)
      .select("id")
      .maybeSingle();
    if (lockError) throw lockError;
    if (!locked) return json({ ok: true, processed: false, reason: "job_claimed_elsewhere" });

    const { data: media, error: mediaError } = await admin
      .from("instagram_media")
      .select("id,instagram_media_id,media_type,media_url,caption,permalink,published_at,presenter_id,presenter_name")
      .eq("id", mediaId)
      .single();
    if (mediaError || !media) throw mediaError ?? new Error("Media not found");

    await admin.from("instagram_media").update({ processing_status: "transcribing" }).eq("id", mediaId);
    const transcript = await transcribeMedia(media as MediaRow, openAIKey, transcriptionModel);

    await admin.from("instagram_transcripts").upsert({
      media_id: mediaId,
      transcript,
      language: "es",
      model: transcriptionModel,
      needs_human_review: transcript.length < 40,
    }, { onConflict: "media_id" });

    await admin.from("instagram_pipeline_jobs").update({ stage: "drafting", progress: 65 }).eq("id", jobId);
    await admin.from("instagram_media").update({ processing_status: "drafting" }).eq("id", mediaId);

    const draft = await createDraft(media as MediaRow, transcript, openAIKey, editorialModel);
    const sources = [{
      type: "instagram_editorial_origin",
      name: "El Facto — Instagram",
      url: media.permalink,
      published_at: media.published_at,
      trust: "editorially_reviewed_origin",
    }];

    await admin.from("instagram_story_drafts").upsert({
      media_id: mediaId,
      content_type: draft.content_type,
      title: draft.title,
      dek: draft.dek,
      lead: draft.lead,
      body: draft.body,
      context: draft.context,
      author_id: media.presenter_id,
      author_name: media.presenter_name,
      verification_status: "editorially_reviewed_origin",
      claims: draft.claims,
      sources,
      cover: draft.cover,
      seo: draft.seo,
      editor_status: "needs_review",
    }, { onConflict: "media_id" });

    await admin.from("instagram_media").update({ processing_status: "needs_review" }).eq("id", mediaId);
    await admin.from("instagram_pipeline_jobs").update({
      stage: "needs_review",
      progress: 100,
      locked_at: null,
      locked_by: null,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    await admin.from("instagram_pipeline_events").insert({
      media_id: mediaId,
      event_type: "editorial_draft_ready",
      actor_type: "ai",
      payload: { transcription_model: transcriptionModel, editorial_model: editorialModel },
    });

    return json({ ok: true, processed: true, media_id: mediaId, status: "needs_review" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    console.error("instagram-process failed", { message, jobId, mediaId });
    if (jobId) {
      await admin.from("instagram_pipeline_jobs").update({
        stage: "failed_retryable",
        locked_at: null,
        locked_by: null,
        last_error_code: "PROCESSING_FAILED",
        last_error_message: message.slice(0, 1000),
        next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      }).eq("id", jobId);
    }
    if (mediaId) await admin.from("instagram_media").update({ processing_status: "failed" }).eq("id", mediaId);
    return json({ error: message }, 500);
  }
});
