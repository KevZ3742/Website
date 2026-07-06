// src/components/ViewCounter.tsx
"use client";

import { useEffect, useState } from "react";

// countapi.mileshilliard.com — free, no signup, no API key. Each post gets
// its own globally-unique key on their shared counter service; a prefix
// keeps us from colliding with someone else's counter of the same name.
// This is a small, hobby-run third-party service: no uptime guarantee, and
// if it ever disappears these components just fail silently rather than
// breaking the page (see the catches below).
const COUNTER_BASE = "https://countapi.mileshilliard.com/api/v1";
const KEY_PREFIX = "kevdev-blog";

/** Increments and displays the count. Use once per post — on the post's own page. */
export function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${COUNTER_BASE}/hit/${KEY_PREFIX}-${slug}`)
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

/** Read-only — fetches the current count without incrementing it. Use on
 *  the blog index list, where just showing up in the list shouldn't count
 *  as a view. */
export function ViewCount({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${COUNTER_BASE}/get/${KEY_PREFIX}-${slug}`)
      .then(res => {
        // A post that's never been opened yet has no counter key at all —
        // that's a normal "0 views" state, not a failure.
        if (res.status === 404) return { value: 0 };
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