import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import type { ConvertedPage } from "./convert-url";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function ConvertedPageCard({
  page,
  actions,
}: {
  page: ConvertedPage;
  actions?: ReactNode;
}) {
  const byline = [
    page.author,
    formatDate(page.published),
    `단어 ${page.wordCount.toLocaleString("ko-KR")}개`,
  ].filter(Boolean);

  return (
    <Card aria-label="변환 결과" role="article" className="gap-0 py-0">
      <CardHeader className="gap-3 border-b py-5">
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {page.site && page.site !== page.domain && (
            <>
              <span>{page.site}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{page.domain}</span>
        </p>
        <h2 className="font-heading text-xl leading-snug font-semibold tracking-tight sm:text-2xl">
          {page.title}
        </h2>
        <p
          data-testid="byline"
          className="flex flex-wrap gap-1.5 text-sm text-muted-foreground"
        >
          {byline.map((item, i) => (
            <span key={i} className="flex gap-1.5">
              {i > 0 && <span aria-hidden>·</span>}
              {item}
            </span>
          ))}
        </p>
        {actions}
      </CardHeader>
      <CardContent className="markdown-body block py-5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          }}
        >
          {page.markdown}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
