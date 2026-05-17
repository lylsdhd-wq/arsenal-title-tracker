"use client";

import useSWR from "swr";
import type { StandingsResult } from "@/types/standings";
import { StandingsTable } from "@/components/StandingsTable";

/**
 * SWR 用のフェッチャー。
 * /api/standings（サーバーサイドプロキシ）を叩き、エラー時は例外を投げる。
 */
async function fetchStandings(url: string): Promise<StandingsResult> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "順位表の取得に失敗しました");
  }

  return response.json() as Promise<StandingsResult>;
}

export default function Home() {
  const { data, error, isLoading } = useSWR<StandingsResult>(
    "/api/standings",
    fetchStandings,
    {
      // 60秒ごとに自動再取得（サーバー側キャッシュと同じ間隔）
      refreshInterval: 60_000,
    },
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 border-l-4 border-arsenal pl-3">
        <h1 className="text-2xl font-bold">アーセナル優勝トラッカー</h1>
        <p className="text-sm text-gray-600">
          プレミアリーグ順位表（リアルタイム）
        </p>
      </header>

      {isLoading && <p className="text-gray-500">読み込み中...</p>}

      {error instanceof Error && (
        <p className="rounded bg-red-50 px-4 py-3 text-arsenal-dark">
          エラー: {error.message}
        </p>
      )}

      {data && (
        <section>
          <p className="mb-2 text-sm text-gray-600">
            {data.competition}
            {data.currentMatchday !== null && ` ・ 第${data.currentMatchday}節`}
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <StandingsTable data={data} />
          </div>
        </section>
      )}
    </main>
  );
}
