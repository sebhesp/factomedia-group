export type ProductEventName =
  | "page_viewed"
  | "navigation_used"
  | "command_palette_opened"
  | "command_executed"
  | "capture_started"
  | "capture_completed"
  | "story_created"
  | "story_opened"
  | "story_advanced"
  | "story_submitted"
  | "source_added"
  | "claim_added"
  | "claim_verified"
  | "ai_suggestion_shown"
  | "ai_suggestion_accepted"
  | "ai_suggestion_rejected"
  | "radar_opened"
  | "radar_search_started"
  | "radar_search_completed"
  | "radar_story_created"
  | "distribution_opened"
  | "social_post_generated"
  | "social_post_published"
  | "feedback_opened"
  | "feedback_submitted"
  | "friction_detected"
  | "app_error"
  | "performance_measured"
  | "experiment_exposed";

export type SafeEventProperty = string | number | boolean | null | undefined;
export type ProductEventProperties = Record<string, SafeEventProperty>;

export interface ProductEvent {
  id: string;
  name: ProductEventName;
  occurredAt: string;
  sessionId: string;
  visitorId: string;
  path: string;
  properties: ProductEventProperties;
  appVersion: string;
}

export interface ProductFeedback {
  id: string;
  occurredAt: string;
  sessionId: string;
  visitorId: string;
  path: string;
  score: number;
  category: "blocked" | "error" | "too_many_steps" | "ai_unhelpful" | "positive" | "other";
  comment?: string;
}

export interface ProductInsight {
  id: string;
  severity: "info" | "attention" | "critical";
  title: string;
  explanation: string;
  recommendedAction: string;
  evidence: string;
}

const EVENT_KEY = "factomedia:product-events";
const FEEDBACK_KEY = "factomedia:product-feedback";
const VISITOR_KEY = "factomedia:visitor-id";
const SESSION_KEY = "factomedia:session-id";
const MAX_LOCAL_EVENTS = 1200;
const MAX_LOCAL_FEEDBACK = 250;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "development";
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENDPOINT?.trim();

const PROHIBITED_PROPERTY_PATTERN = /(body|content|article|story_text|full_text|password|token|email|phone|query|search_term|url|source_text|comment)/i;

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeStorage(storage: Storage | undefined, key: string, fallback: string) {
  if (!storage) return fallback;
  const existing = storage.getItem(key);
  if (existing) return existing;
  storage.setItem(key, fallback);
  return fallback;
}

function visitorId() {
  if (typeof window === "undefined") return "server";
  return safeStorage(window.localStorage, VISITOR_KEY, randomId("visitor"));
}

function sessionId() {
  if (typeof window === "undefined") return "server";
  return safeStorage(window.sessionStorage, SESSION_KEY, randomId("session"));
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T[] : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, values: T[], maximum: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(values.slice(-maximum)));
  } catch {
    // Product analytics must never block editorial work.
  }
}

function sanitizeProperties(properties: ProductEventProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => !PROHIBITED_PROPERTY_PATTERN.test(key) && ["string", "number", "boolean"].includes(typeof value) || value === null)
      .slice(0, 24)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value]),
  ) as ProductEventProperties;
}

function deliver(payload: ProductEvent | ProductFeedback, kind: "event" | "feedback") {
  if (!ANALYTICS_ENDPOINT || typeof window === "undefined") return;
  const body = JSON.stringify({ kind, payload });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Local capture remains available when the endpoint is unreachable.
  }
}

export function trackProductEvent(name: ProductEventName, properties: ProductEventProperties = {}) {
  if (typeof window === "undefined") return null;
  const event: ProductEvent = {
    id: randomId("event"),
    name,
    occurredAt: new Date().toISOString(),
    sessionId: sessionId(),
    visitorId: visitorId(),
    path: window.location.pathname,
    properties: sanitizeProperties(properties),
    appVersion: APP_VERSION,
  };
  const events = readArray<ProductEvent>(EVENT_KEY);
  events.push(event);
  writeArray(EVENT_KEY, events, MAX_LOCAL_EVENTS);
  window.dispatchEvent(new CustomEvent("factomedia:product-event", { detail: event }));
  deliver(event, "event");
  return event;
}

export function submitProductFeedback(input: Omit<ProductFeedback, "id" | "occurredAt" | "sessionId" | "visitorId" | "path">) {
  if (typeof window === "undefined") return null;
  const feedback: ProductFeedback = {
    ...input,
    comment: input.comment?.trim().slice(0, 700),
    id: randomId("feedback"),
    occurredAt: new Date().toISOString(),
    sessionId: sessionId(),
    visitorId: visitorId(),
    path: window.location.pathname,
  };
  const records = readArray<ProductFeedback>(FEEDBACK_KEY);
  records.push(feedback);
  writeArray(FEEDBACK_KEY, records, MAX_LOCAL_FEEDBACK);
  trackProductEvent("feedback_submitted", { score: feedback.score, category: feedback.category });
  window.dispatchEvent(new CustomEvent("factomedia:feedback-submitted", { detail: feedback }));
  deliver(feedback, "feedback");
  return feedback;
}

export function listProductEvents() {
  return readArray<ProductEvent>(EVENT_KEY);
}

export function listProductFeedback() {
  return readArray<ProductFeedback>(FEEDBACK_KEY);
}

export function getExperimentVariant(experimentId: string, variants: readonly string[]) {
  if (!variants.length) throw new Error("An experiment requires at least one variant.");
  const identity = `${visitorId()}:${experimentId}`;
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const variant = variants[Math.abs(hash) % variants.length];
  trackProductEvent("experiment_exposed", { experiment_id: experimentId, variant });
  return variant;
}

function count(events: ProductEvent[], name: ProductEventName) {
  return events.filter((event) => event.name === name).length;
}

export function buildProductInsights(events = listProductEvents(), feedback = listProductFeedback()): ProductInsight[] {
  const insights: ProductInsight[] = [];
  const sessions = new Set(events.map((event) => event.sessionId)).size || 1;
  const frictionEvents = count(events, "friction_detected");
  const radarSearches = count(events, "radar_search_completed");
  const radarStories = count(events, "radar_story_created");
  const aiShown = count(events, "ai_suggestion_shown");
  const aiAccepted = count(events, "ai_suggestion_accepted");
  const blockedFeedback = feedback.filter((item) => item.category === "blocked").length;
  const lowScores = feedback.filter((item) => item.score <= 2).length;

  if (frictionEvents / sessions >= 0.25) {
    insights.push({
      id: "friction-rate",
      severity: "critical",
      title: "La interfaz está provocando fricción repetida",
      explanation: `${frictionEvents} señales de fricción en ${sessions} sesiones registradas.`,
      recommendedAction: "Revisar los elementos con múltiples clics, acciones sin respuesta y rutas con abandono.",
      evidence: `${Math.round((frictionEvents / sessions) * 100)}% de señales por sesión`,
    });
  }

  if (radarSearches >= 5 && radarStories / radarSearches < 0.2) {
    insights.push({
      id: "radar-conversion",
      severity: "attention",
      title: "El Radar encuentra señales, pero pocas se convierten en historias",
      explanation: `${radarStories} Noticias Maestras creadas después de ${radarSearches} búsquedas.`,
      recommendedAction: "Mejorar relevancia, explicar mejor la verificación o simplificar Crear Noticia Maestra.",
      evidence: `${Math.round((radarStories / radarSearches) * 100)}% de conversión`,
    });
  }

  if (aiShown >= 5 && aiAccepted / aiShown < 0.35) {
    insights.push({
      id: "ai-acceptance",
      severity: "attention",
      title: "Las sugerencias de IA no están siendo suficientemente útiles",
      explanation: `${aiAccepted} sugerencias aceptadas de ${aiShown} mostradas.`,
      recommendedAction: "Revisar el contexto enviado, la claridad de la propuesta y el momento en que aparece.",
      evidence: `${Math.round((aiAccepted / aiShown) * 100)}% de aceptación`,
    });
  }

  if (blockedFeedback >= 2 || lowScores >= 3) {
    insights.push({
      id: "feedback-blocked",
      severity: "critical",
      title: "Las personas están reportando bloqueos",
      explanation: `${blockedFeedback} reportes de bloqueo y ${lowScores} valoraciones bajas.`,
      recommendedAction: "Agrupar comentarios por pantalla y resolver primero los bloqueos que impiden terminar una noticia.",
      evidence: `${feedback.length} respuestas de feedback`,
    });
  }

  if (!insights.length) {
    insights.push({
      id: "collect-baseline",
      severity: "info",
      title: "La instrumentación está construyendo la línea base",
      explanation: "Todavía no existe evidencia suficiente para recomendar un cambio con confianza.",
      recommendedAction: "Mantener la medición activa y revisar aprendizajes semanalmente.",
      evidence: `${events.length} eventos y ${feedback.length} respuestas`,
    });
  }

  return insights;
}
