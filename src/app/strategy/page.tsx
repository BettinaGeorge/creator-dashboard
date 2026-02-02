import { loadIgPosts } from "@/lib/loadIgData";
import StrategyClient from "./StrategyClient";

// ...rest of code...

export default function StrategyPage() {
  const posts = loadIgPosts();

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Content Strategy</h1>
          <p className="text-sm text-neutral-600">
            Pillar, format, and hook insights.
          </p>
        </div>

        <StrategyClient posts={posts} />
      </div>
    </main>
  );
}
