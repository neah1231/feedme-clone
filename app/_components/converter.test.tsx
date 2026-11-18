import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ConvertResult } from "@/features/conversion";

import { Converter } from "./converter";

const page = {
  url: "https://stephango.com/file-over-app",
  title: "File over app",
  author: "Steph Ango",
  site: "Steph Ango",
  domain: "stephango.com",
  published: "2023-07-01T00:00:00+00:00",
  wordCount: 376,
  markdown: "*File over app* is a philosophy. See [more](https://example.com).",
};

function mockConvert(result: ConvertResult) {
  let resolve!: () => void;
  const gate = new Promise<void>((r) => (resolve = r));
  const fetchMock = vi.fn(async () => {
    await gate;
    return new Response(JSON.stringify(result));
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, resolve };
}

const writeText = vi.fn(async () => {});
const open = vi.fn();

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  vi.stubGlobal("open", open);
});
afterEach(() => {
  vi.unstubAllGlobals();
  writeText.mockClear();
  open.mockClear();
});

const urlInput = () => screen.getByRole("textbox", { name: "변환할 URL" });

async function convertTo(result: ConvertResult, url = page.url) {
  const { resolve, fetchMock } = mockConvert(result);
  fireEvent.change(urlInput(), { target: { value: url } });
  fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
  return { resolve: () => act(async () => resolve()), fetchMock };
}

describe("Converter", () => {
  it("shows progress, blocks resubmit, then renders title, author and Markdown", async () => {
    render(<Converter />);
    const { resolve, fetchMock } = await convertTo({ ok: true, page });

    const busy = await screen.findByRole("button", { name: /변환 중/ });
    expect(busy).toBeDisabled();
    fireEvent.submit(busy.closest("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await resolve();
    const result = await screen.findByRole("article", { name: "변환 결과" });
    expect(within(result).getByRole("heading", { name: "File over app" })).toBeInTheDocument();
    expect(within(result).getByTestId("byline")).toHaveTextContent("Steph Ango");
    expect(within(result).getByText("File over app", { selector: "em" })).toBeInTheDocument();
    expect(within(result).getByRole("link", { name: "more" })).toHaveAttribute("href", "https://example.com");
  });

  it("omits the author slot when there is no author", async () => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: true, page: { ...page, author: null } });
    await resolve();
    const byline = await screen.findByTestId("byline");
    expect(byline.textContent?.startsWith("·")).toBe(false);
    expect(byline).not.toHaveTextContent("Steph Ango");
  });

  it("shows an error for a malformed URL and keeps the input", async () => {
    render(<Converter />);
    fireEvent.change(urlInput(), { target: { value: "not a url" } });
    fireEvent.click(screen.getByRole("button", { name: "변환하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("올바른 URL이 아닙니다");
    expect(urlInput()).toHaveValue("not a url");
  });

  it.each([
    ["fetch_failed", "페이지를 가져오지 못했습니다"],
    ["extract_failed", "본문을 추출하지 못했습니다"],
  ] as const)("shows %s from the server and keeps the input", async (error, message) => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: false, error });
    await resolve();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(urlInput()).toHaveValue(page.url);
  });

  it("clear resets input, result and error", async () => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: true, page });
    await resolve();
    await screen.findByRole("article");
    fireEvent.click(screen.getByRole("button", { name: "지우기" }));
    expect(urlInput()).toHaveValue("");
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("아직 변환한 페이지가 없습니다")).toBeInTheDocument();
  });

  it("copies the raw Markdown", async () => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: true, page });
    await resolve();
    fireEvent.click(await screen.findByRole("button", { name: "복사하기" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(page.markdown));
  });

  it("sends the body alone by default and prepends a chosen preset", async () => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: true, page });
    await resolve();

    fireEvent.click(await screen.findByRole("button", { name: /ChatGPT로 열기/ }));
    expect(open).toHaveBeenLastCalledWith(
      `https://chatgpt.com/?q=${encodeURIComponent(page.markdown)}`,
      "_blank",
      "noopener",
    );

    fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));
    fireEvent.click(screen.getByRole("button", { name: /Claude로 열기/ }));
    expect(open).toHaveBeenLastCalledWith(
      `https://claude.ai/new?q=${encodeURIComponent(`다음 글을 요약해줘.\n\n${page.markdown}`)}`,
      "_blank",
      "noopener",
    );
  });

  it("custom prompt input appears, is used, and is not kept after switching", async () => {
    render(<Converter />);
    const { resolve } = await convertTo({ ok: true, page });
    await resolve();

    fireEvent.click(await screen.findByRole("button", { name: "직접 입력" }));
    const custom = screen.getByRole("textbox", { name: "직접 입력한 프롬프트" });
    fireEvent.change(custom, { target: { value: "핵심만" } });
    fireEvent.click(screen.getByRole("button", { name: /Claude로 열기/ }));
    expect(open).toHaveBeenLastCalledWith(
      `https://claude.ai/new?q=${encodeURIComponent(`핵심만\n\n${page.markdown}`)}`,
      "_blank",
      "noopener",
    );

    fireEvent.click(screen.getByRole("button", { name: "쉽게 설명해줘" }));
    fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
    expect(screen.getByRole("textbox", { name: "직접 입력한 프롬프트" })).toHaveValue("");
  });

  it("long content goes through the clipboard and opens a blank conversation", async () => {
    render(<Converter />);
    const long = { ...page, markdown: "긴 글 ".repeat(3000) };
    const { resolve } = await convertTo({ ok: true, page: long });
    await resolve();
    fireEvent.click(await screen.findByRole("button", { name: /ChatGPT로 열기/ }));
    expect(writeText).toHaveBeenCalledWith(long.markdown);
    expect(open).toHaveBeenLastCalledWith("https://chatgpt.com/", "_blank", "noopener");
  });
});
