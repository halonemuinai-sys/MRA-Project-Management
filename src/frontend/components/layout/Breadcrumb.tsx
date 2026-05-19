"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm mb-4 flex-wrap">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-neutral-400 hover:text-indigo-500 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className={`font-medium truncate max-w-[200px] ${
                isLast
                  ? "text-neutral-700 dark:text-neutral-200"
                  : "text-neutral-400 hover:text-indigo-500 transition-colors"
              }`}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-neutral-400 hover:text-indigo-500 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
