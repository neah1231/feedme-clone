export type LlmService = "chatgpt" | "claude";

export const LLM_SERVICES: Record<LlmService, { label: string; base: string }> = {
  chatgpt: { label: "ChatGPT", base: "https://chatgpt.com/" },
  claude: { label: "Claude", base: "https://claude.ai/new" },
};

/** Encoded URL length above which the content goes through the clipboard instead. */
export const MAX_URL_LENGTH = 8000;

export function composeMessage(prompt: string | null, markdown: string): string {
  const trimmed = prompt?.trim();
  return trimmed ? `${trimmed}\n\n${markdown}` : markdown;
}

export type LlmHandoff =
  | { mode: "url"; url: string }
  | { mode: "clipboard"; url: string; text: string };

export function planLlmHandoff(service: LlmService, message: string): LlmHandoff {
  const { base } = LLM_SERVICES[service];
  const filled = `${base}?q=${encodeURIComponent(message)}`;
  if (filled.length <= MAX_URL_LENGTH) return { mode: "url", url: filled };
  return { mode: "clipboard", url: base, text: message };
}

export function markdownFilename(title: string): string {
  const base = title
    .replace(/[\\/:*?"<>|#%]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "document"}.md`;
}
