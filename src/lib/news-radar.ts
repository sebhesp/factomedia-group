export type RadarVerificationStatus = "confirmed" | "corroborated" | "developing" | "unverified";

export interface RadarArticle {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedAt: string;
  language?: string;
  sourceCountry?: string;
  imageUrl?: string;
  sourceType: "news" | "official" | "social";
}

export interface RadarCluster {
  id: string;
  title: string;
  articles: RadarArticle[];
  domains: string[];
  latestAt: string;
  verificationStatus: RadarVerificationStatus;
  verificationScore: number;
  verificationReason: string;
  hasPrimarySource: boolean;
}

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  socialimage?: string;
}

interface RadarEndpointResponse {
  articles?: RadarArticle[];
}

const OFFICIAL_DOMAIN_SUFFIXES = [
  ".gob.mx",
  "gob.mx",
  "ine.mx",
  "banxico.org.mx",
  "diputados.gob.mx",
  "senado.gob.mx",
  "unam.mx",
  "ipn.mx",
  "who.int",
  "un.org",
  "oecd.org",
];

const STOP_WORDS = new Set([
  "a", "al", "ante", "bajo", "con", "contra", "de", "del", "desde", "durante", "e", "el", "ella", "en", "entre", "es", "esta", "este", "la", "las", "lo", "los", "más", "para", "pero", "por", "que", "se", "sin", "sobre", "su", "sus", "un", "una", "y",
]);

function normalizeDomain(value: string) {
  return value.toLowerCase().replace(/^www\./, "").trim();
}

export function isOfficialDomain(domain: string) {
  const normalized = normalizeDomain(domain);
  return OFFICIAL_DOMAIN_SUFFIXES.some((suffix) => normalized === suffix || normalized.endsWith(suffix.startsWith(".") ? suffix : `.${suffix}`));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function similarity(left: string, right: string) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function parseGdeltDate(value?: string) {
  if (!value) return new Date().toISOString();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function articleId(url: string, title: string) {
  let hash = 0;
  const value = `${url}|${title}`;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  return `radar-${Math.abs(hash)}`;
}

function normalizeArticle(article: GdeltArticle): RadarArticle | null {
  if (!article.url || !article.title) return null;
  let domain = article.domain ?? "";
  try {
    domain = domain || new URL(article.url).hostname;
  } catch {
    domain = domain || "fuente-desconocida";
  }
  domain = normalizeDomain(domain);
  return {
    id: articleId(article.url, article.title),
    title: article.title.trim(),
    url: article.url,
    domain,
    publishedAt: parseGdeltDate(article.seendate),
    language: article.language,
    sourceCountry: article.sourcecountry,
    imageUrl: article.socialimage,
    sourceType: isOfficialDomain(domain) ? "official" : "news",
  };
}

function classifyCluster(articles: RadarArticle[]) {
  const domains = [...new Set(articles.map((article) => article.domain))];
  const hasPrimarySource = articles.some((article) => article.sourceType === "official");

  if (hasPrimarySource && domains.length >= 2) {
    return {
      verificationStatus: "confirmed" as const,
      verificationScore: Math.min(98, 88 + domains.length * 2),
      verificationReason: `Fuente primaria u oficial y ${domains.length - 1} fuente${domains.length > 2 ? "s" : ""} independiente${domains.length > 2 ? "s" : ""}.`,
      hasPrimarySource,
    };
  }
  if (domains.length >= 3) {
    return {
      verificationStatus: "corroborated" as const,
      verificationScore: Math.min(90, 72 + domains.length * 4),
      verificationReason: `${domains.length} medios independientes coinciden en el acontecimiento principal.`,
      hasPrimarySource,
    };
  }
  if (domains.length === 2) {
    return {
      verificationStatus: "developing" as const,
      verificationScore: 62,
      verificationReason: "Dos fuentes independientes coinciden, pero todavía falta una fuente primaria o una tercera corroboración.",
      hasPrimarySource,
    };
  }
  return {
    verificationStatus: "unverified" as const,
    verificationScore: 28,
    verificationReason: "Solo existe una fuente localizada. No debe publicarse como hecho confirmado.",
    hasPrimarySource,
  };
}

export function clusterRadarArticles(articles: RadarArticle[]) {
  const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const groups: RadarArticle[][] = [];

  sorted.forEach((article) => {
    const group = groups.find((candidate) => candidate.some((existing) => similarity(existing.title, article.title) >= 0.42));
    if (group) group.push(article);
    else groups.push([article]);
  });

  return groups
    .map((group, index): RadarCluster => {
      const domains = [...new Set(group.map((article) => article.domain))];
      const latest = [...group].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
      const classification = classifyCluster(group);
      return {
        id: `cluster-${index}-${latest.id}`,
        title: latest.title,
        articles: group,
        domains,
        latestAt: latest.publishedAt,
        ...classification,
      };
    })
    .sort((a, b) => {
      if (b.verificationScore !== a.verificationScore) return b.verificationScore - a.verificationScore;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });
}

export async function searchLiveNews(query: string, minutes: number, signal?: AbortSignal) {
  const proxyEndpoint = process.env.NEXT_PUBLIC_NEWS_RADAR_ENDPOINT?.trim();
  if (proxyEndpoint) {
    const url = new URL(proxyEndpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("minutes", String(minutes));
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`El radar respondió con estado ${response.status}.`);
    const data = await response.json() as RadarEndpointResponse;
    return clusterRadarArticles(data.articles ?? []);
  }

  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: "100",
    timespan: `${minutes}min`,
    sort: "datedesc",
  });
  const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`La fuente abierta respondió con estado ${response.status}.`);
  const data = await response.json() as { articles?: GdeltArticle[] };
  const articles = (data.articles ?? []).map(normalizeArticle).filter((article): article is RadarArticle => Boolean(article));
  return clusterRadarArticles(articles);
}
