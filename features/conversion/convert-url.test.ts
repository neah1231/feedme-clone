import { describe, expect, it } from "vitest";

import { convertUrl } from "./convert-url";

const article = (byline: string) => `<!doctype html><html><head>
<title>File over app</title>
<meta property="og:site_name" content="Example">
${byline}
</head><body><article>
<h1>File over app</h1>
<p><em>File over app</em> is a philosophy: if you want to create digital artifacts that last,
they must be files you can control, in formats that are easy to retrieve and read.</p>
<p>Apps are ephemeral, but your files have a chance to last. Read <a href="https://example.com/more">more</a>.</p>
<p>${"In the fullness of time the files you create are more important than the tools. ".repeat(8)}</p>
</article></body></html>`;

describe("convertUrl", () => {
  it("extracts title, author and Markdown body", async () => {
    const html = article('<meta name="author" content="Steph Ango">');
    const result = await convertUrl("https://example.com/file-over-app", async () => html);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.page.title).toBe("File over app");
    expect(result.page.author).toBe("Steph Ango");
    expect(result.page.markdown).toContain("*File over app*");
    expect(result.page.markdown).toContain("[more](https://example.com/more)");
  });

  it("returns null author when the page has none", async () => {
    const result = await convertUrl("https://example.com/a", async () => article(""));
    expect(result.ok && result.page.author).toBeNull();
  });

  it.each(["not a url", "ftp://example.com/x", "https://localhost", ""])(
    "rejects %j as invalid_url",
    async (input) => {
      expect(await convertUrl(input, async () => "")).toEqual({ ok: false, error: "invalid_url" });
    },
  );

  it("reports fetch_failed when the page cannot be fetched", async () => {
    const result = await convertUrl("https://example.com/a", async () => {
      throw new Error("HTTP 503");
    });
    expect(result).toEqual({ ok: false, error: "fetch_failed" });
  });

  it("reports extract_failed when the page has no body text", async () => {
    const html = '<html><head><title>App</title></head><body><div id="root"></div></body></html>';
    const result = await convertUrl("https://example.com/app", async () => html);
    expect(result).toEqual({ ok: false, error: "extract_failed" });
  });
});
