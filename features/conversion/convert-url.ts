import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

import { parseHttpUrl } from "./url";

export type ConvertErrorKind = "invalid_url" | "fetch_failed" | "extract_failed";

export type ConvertedPage = {
  url: string;
  title: string;
  author: string | null;
  site: string | null;
  domain: string;
  published: string | null;
  wordCount: number;
  markdown: string;
};

export type ConvertResult =
  | { ok: true; page: ConvertedPage }
  | { ok: false; error: ConvertErrorKind };

type FetchHtml = (url: string) => Promise<string>;

async function defaultFetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // Some sites reject requests without a browser-like user agent.
      "user-agent":
        "Mozilla/5.0 (compatible; MarkdownConverter/1.0; +https://github.com/neah1231/feedme-clone)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const empty = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function convertUrl(
  input: string,
  fetchHtml: FetchHtml = defaultFetchHtml,
): Promise<ConvertResult> {
  const url = parseHttpUrl(input);
  if (!url) return { ok: false, error: "invalid_url" };

  let html: string;
  try {
    html = await fetchHtml(url.href);
  } catch {
    return { ok: false, error: "fetch_failed" };
  }

  try {
    const { document } = parseHTML(html);
    const result = await Defuddle(document as unknown as Document, url.href, {
      markdown: true,
    });
    const markdown = result.content?.trim() ?? "";
    if (!markdown || (result.wordCount ?? 0) < 1) {
      return { ok: false, error: "extract_failed" };
    }
    return {
      ok: true,
      page: {
        url: url.href,
        title: empty(result.title) ?? url.hostname,
        author: empty(result.author),
        site: empty(result.site),
        domain: empty(result.domain) ?? url.hostname,
        published: empty(result.published),
        wordCount: result.wordCount ?? 0,
        markdown,
      },
    };
  } catch {
    return { ok: false, error: "extract_failed" };
  }
}
