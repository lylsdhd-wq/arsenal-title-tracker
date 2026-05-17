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
import { runMonteCarlo, getLiveContenderIds } from "@/lib/monte-carlo";
import { buildRivalMatchGroups } from "@/lib/rival-matches";
import { ProbabilityCard } from "@/components/ProbabilityCard";
import { StandingsTable } from "@/components/StandingsTable";
import {
  MatchPredictor,
  RivalMatchPredictor,
} from "@/components/MatchPredictor";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { Footer } from "@/components/Footer";

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

/** ISO 日付（UTC）→ "AS OF YYYY.MM.DD — JST" 形式 */
function formatAsOfLabel(now = new Date()): string {
  const y = now.toLocaleString("en-US", {
    year: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const m = now
    .toLocaleString("en-US", { month: "2-digit", timeZone: "Asia/Tokyo" })
    .padStart(2, "0");
  const d = now
    .toLocaleString("en-US", { day: "2-digit", timeZone: "Asia/Tokyo" })
    .padStart(2, "0");
  return `AS OF ${y}.${m}.${d} — JST`;
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

  // 試合ID → 予測 のマップ
  const [predictions, setPredictions] = useState<PredictionMap>({});

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

  // 予測にもとづく最終順位
  const predictedStandings = useMemo(() => {
    if (!titleRace.data) return [];
    return calculatePredictedStandings(
      titleRace.data.contenders,
      titleRace.data.matches,
      predictions,
    );
  }, [titleRace.data, predictions]);

  // ベースライン（予測なし）順位 — ▲▼ 差分表示用
  const baselineStandings = useMemo(() => {
    if (!titleRace.data) return [];
    return calculatePredictedStandings(
      titleRace.data.contenders,
      titleRace.data.matches,
      {},
    );
  }, [titleRace.data]);

  // モンテカルロ・シミュレーション結果
  const monteCarlo = useMemo(() => {
    if (!titleRace.data) return null;
    return runMonteCarlo(
      titleRace.data.contenders,
      titleRace.data.matches,
      predictions,
    );
  }, [titleRace.data, predictions]);

  // 数学的に生存中のチーム ID 集合（ELIMINATED バッジ判定に使う）
  const liveIds = useMemo(() => {
    if (!titleRace.data) return new Set<number>();
    return getLiveContenderIds(
      titleRace.data.contenders,
      titleRace.data.matches,
    );
  }, [titleRace.data]);

  // ライバルの残り試合をチームごとにグループ化
  const rivalGroups = useMemo(() => {
    if (!titleRace.data) return [];
    return buildRivalMatchGroups(
      titleRace.data.contenders,
      titleRace.data.matches,
    );
  }, [titleRace.data]);

  // 各チームの予測済み試合数（ライバルセクションの "N predicted" 表示用）
  const predictionsCountByTeam = useMemo(() => {
    const out: Record<number, number> = {};
    if (!titleRace.data) return out;
    for (const match of titleRace.data.matches) {
      if (predictions[match.id]) {
        out[match.homeTeamId] = (out[match.homeTeamId] ?? 0) + 1;
        out[match.awayTeamId] = (out[match.awayTeamId] ?? 0) + 1;
      }
    }
    return out;
  }, [titleRace.data, predictions]);

  // アーセナル残り試合のメタ（節レンジ / 最終キックオフ）
  const arsenalMeta = useMemo(() => {
    const matches = arsenalMatches.data?.matches ?? [];
    const matchdays = matches
      .map((m) => m.matchday)
      .filter((x): x is number => x !== null);
    const matchdayRange =
      matchdays.length > 0
        ? `第${Math.min(...matchdays)}節〜第${Math.max(...matchdays)}節`
        : null;
    // 試合は日付昇順で来る想定。安全のため明示的に最後の試合を選ぶ。
    const sorted = [...matches].sort((a, b) =>
      a.utcDate.localeCompare(b.utcDate),
    );
    const finalKickoffDate =
      sorted.length > 0 ? sorted[sorted.length - 1].utcDate : null;
    return {
      count: matches.length,
      matchdayRange,
      finalKickoffDate,
    };
  }, [arsenalMatches.data]);

  const isLoading = titleRace.isLoading || arsenalMatches.isLoading;
  const error = titleRace.error ?? arsenalMatches.error;
  const predictionCount = Object.keys(predictions).length;
  const asOfLabel = formatAsOfLabel();

  return (
    <main className="mx-auto max-w-[760px] px-7">
      <Header asOfLabel={asOfLabel} recomputing={false /* MC は同期計算 */} />

      {isLoading && (
        <p className="mt-12 text-center text-[13px] text-ink-500">
          読み込み中...
        </p>
      )}

      {error instanceof Error && (
        <p className="mt-8 border border-arsenal/30 bg-arsenal/5 px-4 py-3 text-[13px] text-arsenal-dim">
          エラー: {error.message}
        </p>
      )}

      {/* ヒーロー: 優勝確率 */}
      {monteCarlo && titleRace.data && (
        <ProbabilityCard
          probability={monteCarlo.arsenalTitleProbability}
          iterations={monteCarlo.iterations}
          contendersAlive={liveIds.size}
          predictionCount={predictionCount}
          remainingMatchCount={arsenalMeta.count}
          matchdayRange={arsenalMeta.matchdayRange}
          finalKickoffDate={arsenalMeta.finalKickoffDate}
        />
      )}

      {/* 区切り */}
      {monteCarlo && <hr className="h-px w-full border-0 bg-ink-200" />}

      {/* セクション 01: 予測最終順位 */}
      {predictedStandings.length > 0 && (
        <section className="animate-fade-up pb-2 pt-16 [animation-delay:180ms]">
          <SectionHeading
            index="01"
            en="PREDICTED FINAL TABLE"
            jp="予測最終順位"
            sub="あなたが予測した試合のみを順位表に反映します。得失点差は予測では変化しません。"
          />
          <StandingsTable
            rows={predictedStandings}
            baselineRows={baselineStandings}
            showDeltas={predictionCount > 0}
          />
        </section>
      )}

      {/* セクション 02: アーセナルの残り試合 */}
      {arsenalMatches.data && (
        <section className="animate-fade-up pt-20 [animation-delay:320ms]">
          <SectionHeading
            index="02"
            en="ARSENAL · REMAINING FIXTURES"
            jp="アーセナルの残り試合"
            sub="勝 / 引分 / 敗 から選択してください。同じボタンを再度押すと予測を解除できます。"
          />
          <MatchPredictor
            matches={arsenalMatches.data.matches}
            predictions={predictions}
            onPredict={handlePredict}
          />
        </section>
      )}

      {/* セクション 03: ライバルの残り試合 */}
      {titleRace.data && (
        <section className="animate-fade-up pt-20 [animation-delay:480ms]">
          <SectionHeading
            index="03"
            en="TITLE CONTENDERS · REMAINING FIXTURES"
            jp="優勝争いライバルの試合"
            sub="チームごとにまとめています。数学的に脱落したチームの試合は、シミュレーションでは引き分け固定として扱われます。"
          />
          <RivalMatchPredictor
            groups={rivalGroups}
            predictions={predictions}
            onPredict={handlePredict}
            liveIds={liveIds}
            predictionsCountByTeam={predictionsCountByTeam}
          />
        </section>
      )}

      <Footer
        onReset={() => setPredictions({})}
        hasPredictions={predictionCount > 0}
      />
    </main>
  );
}
