"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none
      prose-p:my-1 prose-p:leading-relaxed
      prose-headings:font-bold prose-headings:my-2
      prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
      prose-strong:font-semibold prose-strong:text-neutral-900 dark:prose-strong:text-white
      prose-em:italic
      prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-neutral-800 dark:prose-code:text-neutral-200 prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-800 prose-pre:rounded-xl prose-pre:p-3 prose-pre:text-xs
      prose-ul:my-1 prose-ul:pl-4 prose-ol:my-1 prose-ol:pl-4
      prose-li:my-0.5 prose-li:leading-relaxed
      prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:underline
      prose-blockquote:border-l-2 prose-blockquote:border-indigo-400 prose-blockquote:pl-3 prose-blockquote:text-neutral-500 prose-blockquote:italic prose-blockquote:my-2
      prose-hr:border-neutral-200 dark:prose-hr:border-neutral-700 prose-hr:my-3
      ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
