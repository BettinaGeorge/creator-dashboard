"use client";

import React, { useMemo } from "react";
import type { IgPost } from "@/lib/loadIgData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

function toDate(d: string | null): number {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
}

function avg(nums: (number | null)[]) {
  const v = nums.filter(
    (n): n is number => typeof n === "number" && !Number.isNaN(n)
  );
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function pct(x: number | null) {
  if (x === null) return "—";
  return `${(x * 100).toFixed(2)}%`;
}

export default function OverviewClient({ posts }: { posts: IgPost[] }) {
  const metrics = useMemo(() => {
    const engagementAvg = avg(posts.map((p) => p.engagement_rate));
    const saveAvg = avg(posts.map((p) => p.save_rate));
    const shareAvg = avg(posts.map((p) => p.share_rate));
    const followAvg = avg(posts.map((p) => p.follow_conversion_rate));

    const topPosts = [...posts]
      .filter((p) => typeof p.engagement_rate === "number")
      .sort((a, b) => (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0))
      .slice(0, 5);

    // Engagement trend: sort oldest -> newest, then show last 40 points
    const trend = [...posts]
      .filter((p) => p.date)
      .sort((a, b) => toDate(a.date) - toDate(b.date))
      .map((p) => ({
        date: String(p.date),
        engagement_rate: p.engagement_rate ?? null,
        saves: p.saves ?? null,
      }))
      .slice(-40);

    // Most saved posts:
    // 1) pick top 8 by saves
    // 2) reorder those top 8 chronologically (oldest -> newest)
    // 3) display clean date labels (no #)
    const topSaves = (() => {
      const topBySaves = [...posts]
        .filter((p) => typeof p.saves === "number" && p.date)
        .sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0))
        .slice(0, 8);

      return topBySaves
        .map((p) => ({
          date: String(p.date).trim(), // display only date
          dateTs: toDate(p.date),      // internal sort key
          saves: p.saves ?? 0,
        }))
        .sort((a, b) => a.dateTs - b.dateTs);
    })();

    return {
      engagementAvg,
      saveAvg,
      shareAvg,
      followAvg,
      topPosts,
      trend,
      topSaves,
    };
  }, [posts]);

  return (
    <div className="space-y-10">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Avg Engagement Rate" value={pct(metrics.engagementAvg)} />
        <Kpi title="Avg Save Rate" value={pct(metrics.saveAvg)} />
        <Kpi title="Avg Share Rate" value={pct(metrics.shareAvg)} />
        <Kpi title="Avg Follow Conversion" value={pct(metrics.followAvg)} />
      </div>

      {/* Trend */}
      <section className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Engagement Rate Trend</h2>
          <p className="text-sm text-neutral-600">
            Quick view of how content is performing over time.
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(v: any) => `${(Number(v) * 100).toFixed(2)}%`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="engagement_rate" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Saves bar chart */}
      <section className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Most Saved Posts</h2>
          <p className="text-sm text-neutral-600">
            Saves = high value signal (brands LOVE this).
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.topSaves}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="saves" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top posts table */}
      <section className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Top Posts (by Engagement Rate)</h2>
          <p className="text-sm text-neutral-600">
            This becomes your “brand proof” section.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-600">
              <tr className="border-b">
                <th className="py-2 pr-4">Date / ID</th>
                <th className="py-2 pr-4">Pillar</th>
                <th className="py-2 pr-4">Format</th>
                <th className="py-2 pr-4">ER</th>
                <th className="py-2 pr-4">Saves</th>
                <th className="py-2 pr-4">Shares</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPosts.map((p) => (
                <tr key={p.post_id} className="border-b">
                  <td className="py-2 pr-4">
                    {(p.date ?? p.post_id).toString().slice(0, 20)}
                  </td>
                  <td className="py-2 pr-4">{p.pillar ?? "—"}</td>
                  <td className="py-2 pr-4">{p.format ?? "—"}</td>
                  <td className="py-2 pr-4">{pct(p.engagement_rate)}</td>
                  <td className="py-2 pr-4">{p.saves ?? "—"}</td>
                  <td className="py-2 pr-4">{p.shares ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-5 shadow-sm">
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
