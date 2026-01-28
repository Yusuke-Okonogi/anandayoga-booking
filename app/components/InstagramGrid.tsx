"use client";

import useSWR from "swr";

type Item = {
  id: string;
  permalink: string;
  timestamp: string;
  media_type: string;
  imageUrl: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function InstagramGrid() {
  const { data, error, isLoading } = useSWR("/api/instagram", fetcher);

  if (isLoading) return <div>Loading Instagram…</div>;
  if (error || data?.error) return <div>Instagramの取得に失敗</div>;

  const items: Item[] = data.items ?? [];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.slice(0, 9).map((p) => (
        <a
          key={p.id}
          href={p.permalink}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt=""
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}
