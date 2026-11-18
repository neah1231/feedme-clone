"use client";

import { useRef, useState } from "react";
import { CircleAlertIcon, Loader2Icon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConvertedPageCard,
  type ConvertedPage,
  type ConvertErrorKind,
  type ConvertResult,
  parseHttpUrl,
} from "@/features/conversion";
import { ExportToolbar } from "@/features/export";

const ERRORS: Record<ConvertErrorKind, { title: string; description: string }> = {
  invalid_url: {
    title: "올바른 URL이 아닙니다",
    description: "https://로 시작하는 전체 주소를 붙여넣어 주세요.",
  },
  fetch_failed: {
    title: "페이지를 가져오지 못했습니다",
    description: "사이트가 응답하지 않거나 외부 요청을 막고 있습니다. 잠시 뒤 다시 시도해 주세요.",
  },
  extract_failed: {
    title: "본문을 추출하지 못했습니다",
    description:
      "페이지를 가져왔지만 글 본문을 찾지 못했습니다. 로그인이 필요하거나 JavaScript로만 내용을 보여 주는 페이지일 수 있습니다.",
  },
};

type View =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "result"; page: ConvertedPage; id: number }
  | { kind: "error"; error: ConvertErrorKind };

export function Converter() {
  const [url, setUrl] = useState("");
  const [view, setView] = useState<View>({ kind: "empty" });
  const request = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const loading = view.kind === "loading";

  async function convert(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const value = url.trim();
    if (!parseHttpUrl(value)) {
      setView({ kind: "error", error: "invalid_url" });
      return;
    }
    const id = ++request.current;
    setView({ kind: "loading" });
    let result: ConvertResult;
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      result = (await res.json()) as ConvertResult;
    } catch {
      result = { ok: false, error: "fetch_failed" };
    }
    // A clear or newer conversion during the request makes this one stale.
    if (id !== request.current) return;
    setView(result.ok ? { kind: "result", page: result.page, id } : { kind: "error", error: result.error });
  }

  function clear() {
    request.current++;
    setUrl("");
    setView({ kind: "empty" });
    inputRef.current?.focus();
  }

  const showClear = url !== "" || view.kind === "result" || view.kind === "error";

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={convert} noValidate className="flex flex-col gap-1.5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Input
              ref={inputRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              aria-label="변환할 URL"
              placeholder="https://example.com/article"
              className="h-10 pr-10"
              value={url}
              readOnly={loading}
              aria-invalid={view.kind === "error" && view.error === "invalid_url"}
              onChange={(e) => setUrl(e.target.value)}
            />
            {showClear && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="지우기"
                title="지우기"
                className="absolute top-1 right-1"
                onClick={clear}
              >
                <XIcon />
              </Button>
            )}
          </div>
          <Button type="submit" size="lg" className="h-10" disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
                변환 중…
              </>
            ) : (
              "변환하기"
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">공개된 글 페이지에서 가장 잘 동작합니다.</p>
      </form>

      {view.kind === "error" && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{ERRORS[view.error].title}</AlertTitle>
          <AlertDescription>{ERRORS[view.error].description}</AlertDescription>
        </Alert>
      )}

      {view.kind === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>아직 변환한 페이지가 없습니다</EmptyTitle>
            <EmptyDescription>위 입력란에 글 주소를 붙여넣고 변환하기를 누르세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {loading && (
        <Card aria-busy="true" aria-label="변환 중" className="gap-0 py-0">
          <CardHeader className="gap-3 border-b py-5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3.5 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 py-5">
            <Skeleton className="h-3.5" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-5/6" />
          </CardContent>
        </Card>
      )}

      {view.kind === "result" && (
        <ConvertedPageCard
          page={view.page}
          actions={
            <ExportToolbar key={view.id} markdown={view.page.markdown} title={view.page.title} />
          }
        />
      )}
    </div>
  );
}
