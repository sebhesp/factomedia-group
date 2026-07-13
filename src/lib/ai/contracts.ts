export type ProcessingState = "idle" | "processing" | "completed" | "failed";

export interface AiServiceResult<T> {
  state: ProcessingState;
  data?: T;
  error?: string;
  provider: "demo" | "external";
}

export interface TextInput { text: string; }
export interface TitleSuggestion { title: string; rationale: string; }
export interface ClaimSuggestion { text: string; confidence: number; }

export interface EditorialAiService {
  suggestTitle(input: TextInput): Promise<AiServiceResult<TitleSuggestion>>;
  detectClaims(input: TextInput): Promise<AiServiceResult<ClaimSuggestion[]>>;
  summarize(input: TextInput): Promise<AiServiceResult<{ summary: string }>>;
}

export const demoEditorialAi: EditorialAiService = {
  async suggestTitle(input) {
    return { state: "completed", provider: "demo", data: { title: input.text.slice(0, 72) || "Título provisional", rationale: "DEMO: usa el inicio del texto como punto de partida." } };
  },
  async detectClaims(input) {
    const sentences = input.text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
    return { state: "completed", provider: "demo", data: sentences.map((text) => ({ text, confidence: 0.5 })) };
  },
  async summarize(input) {
    return { state: "completed", provider: "demo", data: { summary: input.text.slice(0, 180) } };
  },
};
