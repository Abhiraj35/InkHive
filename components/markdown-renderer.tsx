import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Children } from "react";
import { cn } from "@/lib/utils";

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

const markdownComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-12 mb-5 text-3xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 mb-4 text-2xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 mb-3 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "my-5 text-[1.05rem] leading-8 text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-5 list-disc space-y-2 pl-6 text-[1.02rem] leading-8 text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-5 list-decimal space-y-2 pl-6 text-[1.02rem] leading-8 text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("pl-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-8 rounded-r-xl border-l-4 border-primary/50 bg-primary/5 px-5 py-4 text-[1.02rem] italic leading-8 text-foreground/85",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, children, href, ...props }) => {
    const accessibleName = Children.toArray(children)
      .map((child) => {
        if (typeof child === "string" || typeof child === "number") {
          return String(child)
        }

        return ""
      })
      .join("")
      .trim()

    return (
      <a
        className={cn(
          "font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:decoration-primary",
          className,
        )}
        aria-label={accessibleName || (typeof href === "string" ? href : undefined)}
        href={href}
        {...props}
      >
        {children}
      </a>
    )
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-7 overflow-x-auto rounded-xl border border-white/10 bg-muted/70 p-4 text-sm leading-7",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[0.9em]",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-10 border-white/10", className)} {...props} />
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("max-w-none [&>*:first-child]:mt-0", className)}>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
