"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type {
  ArsenalMatchesResult,
  MatchOutcome,
  PredictionMap,
  TitleRaceResult,
} from "@/types/matches";
import { calculatePredictedStandings } from "@/lib/standings-calculator";
import { runMonteCarlo } from "@/lib/monte-carlo";
import { ProbabilityCard } from "@/components/ProbabilityCard";
import { StandingsTable } from "@/components/StandingsTable";
import { MatchPredictor } from "@/components/MatchPredictor";

/** SWR 用フェッチャー。/api/* を叩き、エラー時は例外を投げる。 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "データの取得に失敗しました");
  }

  return response.json() as Promise<T>;
}

export default function Home() {
  const titleRace = useSWR<TitleRaceResult>(
    "/api/title-race-matches",
    fetchJson,
    { refreshInterval: 60_000 },
  );
  const arsenalMatches = useSWR<ArsenalMatchesResult>(
    "/api/arsenal-matches",
    fetchJson,
    { refreshInterval: 60_000 },
  );

  // 試合ID → 予測 のマップ。ユーザーの予測状態を保持する。
  const [predictions, setPredictions] = useState<PredictionMap>({});

  /** 予測ボタンの操作。選択中のボタンを再度押すと予測を解除する。 */
  const handlePredict = (matchId: number, outcome: MatchOutcome) => {
    setPredictions((prev) => {
      if (prev[matchId] === outcome) {
        const next = { ...prev };
        delete next[matchId];
        return next;
      }
      return { ...prev, [matchId]: outcome };
    });
  };

  // 予測にもとづく最終順位（予測が変わるたびに再計算）
  const predictedStandings = useMemo(() => {
    if (!titleRace.data) {
      return [];
    }
    return calculatePredictedStandings(
      titleRace.data.contenders,
      titleRace.data.matches,
      predictions,
    );
  }, [titleRace.data, predictions]);

  // モンテカルロ・シミュレーションによる優勝確率
  const monteCarlo = useMemo(() => {
    if (!titleRace.data) {
      return null;
    }
    return runMonteCarlo(
      titleRace.data.contenders,
      titleRace.data.matches,
      predictions,
    );
  }, [titleRace.data, predictions]);

  const isLoading = titleRace.isLoading || arsenalMatches.isLoading;
  const error = titleRace.error ?? arsenalMatches.error;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 border-l-4 border-arsenal pl-3">
        <h1 className="text-2xl font-bold">アーセナル優勝トラッカー</h1>
        <p className="text-sm text-gray-600">
          残り試合の結果を予測して、優勝確率をシミュレーション
        </p>
      </header>

      {isLoading && <p className="text-gray-500">読み込み中...</p>}

      {error instanceof Error && (
        <p className="mb-4 rounded bg-red-50 px-4 py-3 text-arsenal-dark">
          エラー: {error.message}
        </p>
      )}

      {/* 上部: 優勝確率カード */}
      {monteCarlo && (
        <section className="mb-8">
          <ProbabilityCard
            probability={monteCarlo.arsenalTitleProbability}
            iterations={monteCarlo.iterations}
          />
        </section>
      )}

      {/* 中段: 予測にもとづく最終順位表 */}
      {predictedStandings.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-bold">予測最終順位（優勝争い）</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <StandingsTable rows={predictedStandings} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ※ 予測した試合のみを反映。得失点差は現在の値で固定しています。
          </p>
        </section>
      )}

      {/* 下部: アーセナルの残り試合の予測 */}
      {arsenalMatches.data && (
        <section>
          <h2 className="mb-2 text-lg font-bold">
            アーセナルの残り試合を予測
          </h2>
          <MatchPredictor
            matches={arsenalMatches.data.matches}
            predictions={predictions}
            onPredict={handlePredict}
          />
        </section>
      )}
    </main>
  );
}
