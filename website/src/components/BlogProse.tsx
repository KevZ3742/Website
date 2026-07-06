// src/components/BlogProse.tsx
//
// Maps standard MDX/markdown elements to the site's theme tokens & mono
// aesthetic, so post bodies look native instead of like default browser
// typography. Passed into <MDXRemote components={mdxComponents} />.

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-2xl font-semibold tracking-tight text-tx mt-10 mb-4 first:mt-0" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-[15px] tracking-[0.1em] uppercase text-label mt-10 mb-4 border-t border-border pt-8 first:border-t-0 first:pt-0 first:mt-0" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-lg font-semibold text-tx mt-8 mb-3" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="text-[14px] leading-relaxed text-muted mb-4" {...props} />
  ),
  a: ({ href = "", ...props }: ComponentPropsWithoutRef<"a">) => {
    const external = href.startsWith("http");
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green underline decoration-green/30 underline-offset-2 hover:decoration-green transition-colors"
        {...props}
      />
    ) : (
      <Link
        href={href}
        className="text-green underline decoration-green/30 underline-offset-2 hover:decoration-green transition-colors"
        {...props}
      />
    );
  },
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-[14px] leading-relaxed text-muted marker:text-border2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-[14px] leading-relaxed text-muted marker:text-label" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => <li {...props} />,
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-2 border-green pl-4 py-0.5 mb-4 text-[14px] italic text-label" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code className="font-mono text-[12.5px] text-green bg-surface border border-border px-1.5 py-0.5 rounded-sm" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre className="font-mono text-[12.5px] leading-relaxed bg-surface border border-border p-4 mb-5 overflow-x-auto [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-tx" {...props} />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="border-border my-10" {...props} />
  ),
  img: (props: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="w-full border border-border2 my-6" {...props} alt={props.alt ?? ""} />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto mb-5 border border-border">
      <table className="w-full text-[13px] text-muted" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="text-left text-[10px] tracking-[0.1em] uppercase text-label border-b border-border px-3 py-2" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-border px-3 py-2 align-top" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="text-tx font-semibold" {...props} />
  ),
};
