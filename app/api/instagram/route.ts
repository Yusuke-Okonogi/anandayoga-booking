import { NextResponse } from "next/server";

type IgItem = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

export const revalidate = 3600; // 1時間キャッシュ（好みで調整）

export async function GET() {
  const IG_USER_ID = process.env.IG_USER_ID;
  const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
  const VERSION = process.env.GRAPH_API_VERSION ?? "v18.0";

  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Missing IG_USER_ID or IG_ACCESS_TOKEN" },
      { status: 500 }
    );
  }

  const fields = [
    "id",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
  ].join(",");

  const url =
    `https://graph.facebook.com/${VERSION}/${IG_USER_ID}/media` +
    `?fields=${encodeURIComponent(fields)}` +
    `&limit=9` +
    `&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`;

  const res = await fetch(url, { next: { revalidate } });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Instagram API error", detail: text },
      { status: 502 }
    );
  }

  const json = await res.json();
  const items: IgItem[] = (json.data ?? []).map((x: IgItem) => x);

  // 画像URLは video の場合 media_url が動画URLになることがあるので thumbnail を優先
  const normalized = items.map((x) => ({
    id: x.id,
    permalink: x.permalink,
    timestamp: x.timestamp,
    media_type: x.media_type,
    imageUrl: x.thumbnail_url ?? x.media_url ?? null,
  })).filter((x) => x.imageUrl);

  return NextResponse.json({ items: normalized });
}
