"use client";

import { useMemo, useState } from "react";
import type { IgPost } from "@/lib/loadIgData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ALL_PILLARS = [
  "Me/Personality",
  "Nigerian Student",
  "Fitness",
  "Faith",
  "Beauty/Skincare",
  "Fashion",
  "Tech/Career",
] as const;

const ALL_FORMATS = [
  "Reel",
  "Carousel",
  "Photo",
  "Story",
] as const;

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function StrategyClient({ posts }: { posts: IgPost[] }) {
  // ✅ hooks MUST be inside the component
  const [view, setView] = useState<"fixed" | "ranked">("fixed");

  const byFormat = useMemo(() => {
  const groups: Record<string, number[]> = {};

  posts.forEach((p) => {
    const format = (p.format ?? "").toString().trim();
    if (!format) return;

    const saves = typeof p.saves === "number" ? p.saves : null;
    if (saves === null) return;

    if (!groups[format]) groups[format] = [];
    groups[format].push(saves);
  });

  return Object.entries(groups)
    .map(([format, savesArr]) => ({
      format,
      avgSaves: savesArr.reduce((a, b) => a + b, 0) / savesArr.length,
      nPosts: savesArr.length,
    }))
    .sort((a, b) => b.avgSaves - a.avgSaves); // show best formats first
}, [posts]);

  const isRanked = view === "ranked";

  const byPillar = useMemo(() => {
    const groups: Record<string, number[]> = {};

    posts.forEach((p) => {
      if (!p.pillar || typeof p.engagement_rate !== "number") return;
      if (!groups[p.pillar]) groups[p.pillar] = [];
      groups[p.pillar].push(p.engagement_rate);
    });

    const base = ALL_PILLARS.map((pillar) => {
      const ers = groups[pillar] ?? [];
      return {
        pillar,
        avgER: ers.length ? avg(ers) * 100 : 0,
        nPosts: ers.length,
      };
    });

    if (view === "ranked") return [...base].sort((a, b) => b.avgER - a.avgER);
    return base;
  }, [posts, view]);
const formatCounts = useMemo(() => {
  const c: Record<string, number> = {};
  posts.forEach((p) => {
    const f = (p.format ?? "").toString().trim();
    if (!f) return;
    c[f] = (c[f] ?? 0) + 1;
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}, [posts]);

console.log("formatCounts:", formatCounts);

  return (
    <div className="space-y-8">
    <section className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Avg Engagement Rate by Pillar</h2>
        <p className="text-sm text-neutral-600">
          Which content themes resonate most with your audience.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-neutral-900">View</div>
          <div className="text-xs text-neutral-600">
            {isRanked ? "Ranked by performance" : "Fixed pillar order"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setView(isRanked ? "fixed" : "ranked")}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
            isRanked ? "bg-black" : "bg-neutral-300"
          }`}
          aria-pressed={isRanked}
          aria-label="Toggle ranked view"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              isRanked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byPillar}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="pillar" />
            <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
            <Tooltip
              formatter={(value: any, name: any) => {
                if (name === "avgER") return `${Number(value).toFixed(2)}%`;
                return value;
              }}
              labelFormatter={(label) => `Pillar: ${label}`}
            />
            <Bar dataKey="avgER" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>

  <section className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
  <div className="mb-4">
    <h2 className="text-lg font-semibold">Avg Saves by Format</h2>
    <p className="text-sm text-neutral-600">
      Which formats people value enough to save.
    </p>
  </div>

  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={byFormat}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="format" />
        <YAxis />
        <Tooltip
          formatter={(value: any) => `${Number(value).toFixed(1)} saves`}
          labelFormatter={(label) => `Format: ${label}`}
        />
        <Bar dataKey="avgSaves" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

  </div>
  );
}
