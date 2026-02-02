import fs from "fs";
import path from "path";
import Papa from "papaparse";
import React from "react";

export type IgRow = Record<string, any>;

function toNumber(x: any): number | null {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  if (!s) return null;
  // remove commas like "12,345"
  const cleaned = s.replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toPercent01(x: any): number | null {
  if (x === null || x === undefined) return null;
  const s = String(x).trim();
  if (!s) return null;
  // handles "13.58%" or "0.1358"
  if (s.endsWith("%")) {
    const n = Number(s.slice(0, -1).trim());
    return Number.isFinite(n) ? n / 100 : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : null;
}

function snakeCaseKey(k: string) {
  return k
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "pct")         // followers % -> followers pct
    .replace(/[^\w\s]/g, "")        // remove dots like avg. -> avg
    .replace(/\s+/g, "_")           // spaces -> underscores
    .replace(/^_+|_+$/g, "");       // trim underscores
}


export type IgPost = {
  post_id: string;
  date: string | null;

  // common metrics (we’ll display these)
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;

  engagement_rate: number | null; // 0..1
  save_rate: number | null;       // 0..1
  share_rate: number | null;      // 0..1
  follow_conversion_rate: number | null; // 0..1

  // strategy fields (may or may not exist in your csv)
  pillar?: string | null;
  format?: string | null;
  hook_type?: string | null;

  [key: string]: any;
};

export function loadIgPosts(): IgPost[] {
  const csvPath = path.join(process.cwd(), "data", "ig_content_log.csv");
  const raw = fs.readFileSync(csvPath, "utf8");

  const parsed = Papa.parse<IgRow>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data;

  // normalize keys to snake_case so code is stable
  const normalized = rows.map((r: IgRow, idx: number) => {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      obj[snakeCaseKey(k)] = v;
    }
    // post_id stable-ish: date + idx fallback
    const date = obj.date ?? obj.post_date ?? null;
    obj.post_id = obj.post_id ?? `${date ?? "no_date"}_${idx}`;
    return obj;
  });

  // map into IgPost (best-effort for column name variations)
  const posts: IgPost[] = normalized.map((r) => ({
  ...r, // keep raw fields, but DO IT FIRST so it doesn't overwrite conversions

  post_id: r.post_id,
  date: r.post_date ?? null,

  impressions: toNumber(r.views), // using views as impressions for now
  reach: toNumber(r.reach),

  likes: toNumber(r.likes),
  comments: toNumber(r.comments),
  saves: toNumber(r.saves),
  shares: toNumber(r.shares),

  engagement_rate: toPercent01(r.engagement_rate),
  save_rate: toPercent01(r.save_rate),
  share_rate: toPercent01(r.share_rate),

  follow_conversion_rate: toPercent01(r.follow_conversion),
  pillar: r.pillar ?? null,
  format: r.format ?? null,
  hook_type: r.hook_type ?? null,
}));


  return posts;
  
}

