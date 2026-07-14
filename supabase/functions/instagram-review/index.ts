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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
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
      .select("id,media_id,title,slug,seo,editor_status,cms_entry_id")
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

      const effectiveTitle = typeof allowedPatch.title === "string" && allowedPatch.title.trim()
        ? allowedPatch.title.trim()
        : draft.title;
      const seoPatch = allowedPatch.seo ?? draft.seo ?? {};
      const requestedSlug = typeof seoPatch.slug === "string" ? seoPatch.slug : draft.slug;
      const slug = slugify(requestedSlug || effectiveTitle) || `${draft.id}`;
      const siteUrl = required("PUBLIC_SITE_URL").replace(/\/$/, "");
      const canonicalUrl = `${siteUrl}/noticias/${slug}`;

      nextStatus = "published";
      eventType = "instagram_story_published";
      update.slug = slug;
      update.canonical_url = canonicalUrl;
      update.cms_entry_id = draft.id;
      update.cms_url = canonicalUrl;
      update.published_at = new Date().toISOString();

      // Optional compatibility adapter. The native El Facto Noticias site does not depend on it.
      const cmsEndpoint = Deno.env.get("CMS_PUBLISH_ENDPOINT");
      const cmsSecret = Deno.env.get("CMS_PUBLISH_SECRET");
      if (cmsEndpoint && cmsSecret) {
        const { data: fullDraft, error: fullDraftError } = await admin
          .from("instagram_story_drafts")
          .select("*,instagram_media!inner(permalink,published_at,thumbnail_url)")
          .eq("media_id", body.media_id)
          .single();
        if (fullDraftError || !fullDraft) throw fullDraftError ?? new Error("Could not load full draft");

        const cmsResponse = await fetch(cmsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cmsSecret}` },
          body: JSON.stringify({ ...fullDraft, ...update }),
          signal: AbortSignal.timeout(30_000),
        });
        const cmsPayload = await cmsResponse.json().catch(() => ({}));
        if (!cmsResponse.ok) throw new Error(cmsPayload?.error ?? `CMS returned ${cmsResponse.status}`);
        update.cms_entry_id = cmsPayload.id ?? cmsPayload.entry_id ?? draft.id;
        update.cms_url = cmsPayload.url ?? canonicalUrl;
      }
    }

    update.editor_status = nextStatus;
    const { data: saved, error: saveError } = await admin
      .from("instagram_story_drafts")
      .update(update)
      .eq("id", draft.id)
      .select("id,media_id,slug,canonical_url,editor_status,cms_entry_id,cms_url,updated_at,published_at")
      .single();
    if (saveError) throw saveError;

    const mediaStatus = nextStatus === "published" ? "published" : nextStatus === "approved" ? "approved" : "needs_review";
    await admin.from("instagram_media").update({ processing_status: mediaStatus }).eq("id", body.media_id);
    await admin.from("instagram_pipeline_events").insert({
      media_id: body.media_id,
      event_type: eventType,
      actor_type: "user",
      actor_id: authData.user.id,
      payload: { role, comment: body.comment?.slice(0, 1000) ?? null, canonical_url: saved.canonical_url ?? null },
    });

    return json({ ok: true, draft: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown review error";
    console.error("instagram-review failed", { message });
    return json({ error: message }, 500);
  }
});
