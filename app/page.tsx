import { ThemeToggle } from "@/components/theme-toggle";

import { Converter } from "./_components/converter";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-md bg-primary font-mono text-xs text-primary-foreground"
          >
            M↓
          </span>
          Markdown 변환기
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          웹 페이지를 Markdown으로
        </h1>
        <p className="text-muted-foreground">
          URL을 붙여넣으면 본문만 뽑아 ChatGPT나 Claude에 바로 넘길 수 있게 정리합니다.
        </p>
      </div>

      <Converter />
    </main>
  );
}
