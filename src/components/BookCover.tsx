import { useEffect, useState } from "react";

interface BookCoverProps {
  title: string;
  author?: string;
  fallbackEmoji: string;
  size?: number;
  className?: string;
}

// In-memory cache to avoid refetching covers across renders/components
const coverCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

async function fetchCoverUrl(title: string, author?: string): Promise<string | null> {
  const key = `${title.toLowerCase().trim()}::${(author ?? "").toLowerCase().trim()}`;
  if (coverCache.has(key)) return coverCache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const promise = (async () => {
    try {
      const params = new URLSearchParams({ title, limit: "1" });
      if (author) params.set("author", author);
      const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      const coverId = data?.docs?.find((d: any) => d?.cover_i)?.cover_i;
      if (!coverId) return null;
      return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    } catch {
      return null;
    }
  })();

  inflight.set(key, promise);
  const url = await promise;
  coverCache.set(key, url);
  inflight.delete(key);
  return url;
}

export default function BookCover({ title, author, fallbackEmoji, size = 48, className = "" }: BookCoverProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setUrl(null);
    if (!title) return;
    fetchCoverUrl(title, author).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [title, author]);

  const dim = { width: size, height: size };

  if (!url || failed) {
    return (
      <div
        className={`shrink-0 rounded-xl bg-secondary/60 border-2 border-border flex items-center justify-center ${className}`}
        style={dim}
      >
        <span style={{ fontSize: Math.round(size * 0.55) }}>{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${title} cover`}
      loading="lazy"
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        // Open Library returns 1x1 placeholders for missing covers
        if (img.naturalWidth <= 2 || img.naturalHeight <= 2) setFailed(true);
      }}
      className={`shrink-0 rounded-xl object-cover border-2 border-border bg-secondary/60 ${className}`}
      style={dim}
    />
  );
}
