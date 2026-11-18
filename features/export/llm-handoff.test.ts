import { describe, expect, it } from "vitest";

import { MAX_URL_LENGTH, composeMessage, markdownFilename, planLlmHandoff } from "./llm-handoff";

describe("composeMessage", () => {
  it("returns the body alone without a prompt", () => {
    expect(composeMessage(null, "# Body")).toBe("# Body");
    expect(composeMessage("   ", "# Body")).toBe("# Body");
  });

  it("puts the prompt before the body with one blank line", () => {
    expect(composeMessage("다음 글을 요약해줘.", "# Body")).toBe("다음 글을 요약해줘.\n\n# Body");
  });
});

describe("planLlmHandoff", () => {
  it("fills the service URL for short content", () => {
    expect(planLlmHandoff("chatgpt", "hi there")).toEqual({
      mode: "url",
      url: "https://chatgpt.com/?q=hi%20there",
    });
    expect(planLlmHandoff("claude", "hi")).toEqual({ mode: "url", url: "https://claude.ai/new?q=hi" });
  });

  it("falls back to the clipboard when the encoded URL would be too long", () => {
    const text = "가".repeat(MAX_URL_LENGTH);
    expect(planLlmHandoff("claude", text)).toEqual({
      mode: "clipboard",
      url: "https://claude.ai/new",
      text,
    });
  });
});

describe("markdownFilename", () => {
  it("builds a file name from the page title", () => {
    expect(markdownFilename("File over app")).toBe("File-over-app.md");
    expect(markdownFilename('a/b: "c"?')).toBe("ab-c.md");
    expect(markdownFilename("   ")).toBe("document.md");
  });
});
