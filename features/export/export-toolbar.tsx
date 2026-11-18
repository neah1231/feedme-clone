"use client";

import { useState } from "react";
import { ArrowUpRightIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  LLM_SERVICES,
  composeMessage,
  markdownFilename,
  planLlmHandoff,
  type LlmService,
} from "./llm-handoff";

const PRESETS = [
  { value: "summary", label: "요약해줘", prompt: "다음 글을 요약해줘." },
  { value: "translate", label: "한국어로 번역해줘", prompt: "다음 글을 한국어로 번역해줘." },
  { value: "explain", label: "쉽게 설명해줘", prompt: "다음 글을 쉽게 설명해줘." },
] as const;
const CUSTOM = "custom";

/**
 * Export actions for one converted page. The selected prompt lives here on purpose:
 * remount this component (via `key`) to reset it for a new conversion.
 */
export function ExportToolbar({ markdown, title }: { markdown: string; title: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  const prompt =
    selected === CUSTOM
      ? custom
      : (PRESETS.find((p) => p.value === selected)?.prompt ?? null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown을 복사했습니다");
    } catch {
      toast.error("클립보드에 복사하지 못했습니다");
    }
  }

  function download() {
    const name = markdownFilename(title);
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("다운로드를 시작했습니다", { description: name });
  }

  function openIn(service: LlmService) {
    const { label } = LLM_SERVICES[service];
    const plan = planLlmHandoff(service, composeMessage(prompt, markdown));
    if (plan.mode === "url") {
      window.open(plan.url, "_blank", "noopener");
      toast.success(`새 탭에서 ${label}를 열었습니다`, {
        description: "본문이 입력창에 채워져 있습니다.",
      });
      return;
    }
    // Start the clipboard write and open the tab within the same click.
    const copied = navigator.clipboard.writeText(plan.text);
    window.open(plan.url, "_blank", "noopener");
    copied.then(
      () =>
        toast.info("글이 길어 클립보드에 복사했습니다", {
          description: `새 탭에서 ${label} 새 대화를 열었습니다. 입력창에 붙여넣기(Ctrl+V) 하세요.`,
          duration: 8000,
        }),
      () => toast.error("클립보드에 복사하지 못했습니다"),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="toolbar" aria-label="내보내기" className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          <CopyIcon data-icon="inline-start" />
          복사하기
        </Button>
        <Button variant="outline" size="sm" onClick={download}>
          <DownloadIcon data-icon="inline-start" />
          .md 다운로드
        </Button>
        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
        {(Object.keys(LLM_SERVICES) as LlmService[]).map((service) => (
          <Button key={service} size="sm" onClick={() => openIn(service)}>
            {LLM_SERVICES[service].label}로 열기
            <ArrowUpRightIcon data-icon="inline-end" />
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <p id="prompt-label" className="text-sm font-medium">
          ChatGPT·Claude에 보낼 프롬프트{" "}
          <span className="font-normal text-muted-foreground">(선택)</span>
        </p>
        <ToggleGroup
          aria-labelledby="prompt-label"
          variant="outline"
          size="sm"
          className="flex-wrap"
          value={selected ? [selected] : []}
          onValueChange={(value: string[]) => {
            setSelected(value[0] ?? null);
            setCustom("");
          }}
        >
          {PRESETS.map((p) => (
            <ToggleGroupItem key={p.value} value={p.value}>
              {p.label}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value={CUSTOM}>직접 입력</ToggleGroupItem>
        </ToggleGroup>
        {selected === CUSTOM && (
          <Input
            autoFocus
            aria-label="직접 입력한 프롬프트"
            placeholder="예: 이 글에서 실천할 만한 항목만 뽑아줘"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
