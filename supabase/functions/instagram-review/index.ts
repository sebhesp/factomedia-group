import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type ReviewAction = "save" | "request_review" | "approve" | "request_changes" | "publish";

type ReviewBody = {
  media_id?: string;
  action?: ReviewAction;
  comment?: string;
  patch?: {
    title?: string;
    dek?: string;
    body?: string;
    claims?: unknown[];
    sources?: unknown[];
    author_id?: string | null;
    author_name?: string | null;
    seo?: Record<string, unknown>;
    cover?: Record<string, unknown>;
  };
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = required("SUPABASE_URL");
    const anonKey = required("SUPABASE_ANON_KEY");
    const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const token = authorization.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const body = (await request.json()) as ReviewBody;
    if (!body.media_id || !body.action) return json({ error: "media_id and action are required" }, 400);

    const role = String(authData.user.app_metadata?.role ?? authData.user.user_metadata?.role ?? "collaborator");
    const canDecide = role === "editor" || role === "admin";
    if (["approve", "request_changes", "publish"].includes(body.action) && !canDecide) {
      return json({ error: "Editor or admin role required" }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: draft, error: draftError } = await admin
      .from("instagram_story_drafts")
      .select("id,media_id,editor_status,cms_entry_id")
      .eq("media_id", body.media_id)
      .single();
    if (draftError || !draft) return json({ error: "Draft not found" }, 404);

    const allowedPatch = body.patch ?? {};
    const update: Record<string, unknown> = {};
    for (const key of ["title", "dek", "body", "claims", "sources", "author_id", "author_name", "seo", "cover"] as const) {
      if (key in allowedPatch) update[key] = allowedPatch[key];
    }

    let eventType = "instagram_draft_saved";
    let nextStatus = draft.editor_status;

    if (body.action === "request_review") {
      nextStatus = "needs_review";
      eventType = "instagram_review_requested";
    }
    if (body.action === "approve") {
      nextStatus = "approved";
      eventType = "instagram_draft_approved";
      update.reviewed_by = authData.user.id;
      update.reviewed_at = new Date().toISOString();
    }
    if (body.action === "request_changes") {
      nextStatus = "changes_requested";
      eventType = "instagram_changes_requested";
    }
    if (body.action === "publish") {
      if (draft.editor_status !== "approved") return json({ error: "Draft must be approved before publishing" }, 409);
      const cmsEndpoint = Deno.env.get("CMS_PUBLISH_ENDPOINT");
      const cmsSecret = Deno.env.get("CMS_PUBLISH_SECRET");
      if (!cmsEndpoint || !cmsSecret) {
        return json({ error: "CMS integration is not configured", code: "CMS_NOT_CONFIGURED" }, 409);
      }

      const { data: fullDraft, error: fullDraftError } = await admin
        .from("instagram_story_drafts")
        .select("*,instagram_media!inner(permalink,published_at,thumbnail_url)")
        .eq("media_id", body.media_id)
        .single();
      if (fullDraftError || !fullDraft) throw fullDraftError ?? new Error("Could not load full draft");

      const cmsResponse = await fetch(cmsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cmsSecret}` },
        body: JSON.stringify(fullDraft),
        signal: AbortSignal.timeout(30_000),
      });
      const cmsPayload = await cmsResponse.json().catch(() => ({}));
      if (!cmsResponse.ok) throw new Error(cmsPayload?.error ?? `CMS returned ${cmsResponse.status}`);

      nextStatus = "published";
      eventType = "instagram_story_published";
      update.cms_entry_id = cmsPayload.id ?? cmsPayload.entry_id ?? null;
      update.cms_url = cmsPayload.url ?? null;
      update.published_at = new Date().toISOString();
    }

    update.editor_status = nextStatus;
    const { data: saved, error: saveError } = await admin
      .from("instagram_story_drafts")
      .update(update)
      .eq("id", draft.id)
      .select("id,media_id,editor_status,cms_entry_id,cms_url,updated_at")
      .single();
    if (saveError) throw saveError;

    const mediaStatus = nextStatus === "published" ? "published" : nextStatus === "approved" ? "approved" : "needs_review";
    await admin.from("instagram_media").update({ processing_status: mediaStatus }).eq("id", body.media_id);
    await admin.from("instagram_pipeline_events").insert({
      media_id: body.media_id,
      event_type: eventType,
      actor_type: "user",
      actor_id: authData.user.id,
      payload: { role, comment: body.comment?.slice(0, 1000) ?? null },
    });

    return json({ ok: true, draft: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown review error";
    console.error("instagram-review failed", { message });
    return json({ error: message }, 500);
  }
});
