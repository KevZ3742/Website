// src/components/ViewCounter.tsx
"use client";

import { useEffect, useState } from "react";

// countapi.mileshilliard.com — free, no signup, no API key. Each post gets
// its own globally-unique key on their shared counter service; a prefix
// keeps us from colliding with someone else's counter of the same name.
// This is a small, hobby-run third-party service: no uptime guarantee, and
// if it ever disappears this component just fails silently rather than
// breaking the page (see the catch below).
const COUNTER_ENDPOINT = "https://countapi.mileshilliard.com/api/v1/hit";
const KEY_PREFIX = "kevdev-blog";

export function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${COUNTER_ENDPOINT}/${KEY_PREFIX}-${slug}`)
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((data: { value: string | number }) => {
        if (!cancelled) setCount(Number(data.value));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [slug]);

  if (failed || count === null) return null;

  return (
    <span>
      {" "}· {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
