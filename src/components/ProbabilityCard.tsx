"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface ProbabilityCardProps {
  /** アーセナルの優勝確率（0〜100） */
  probability: number;
  /** モンテカルロ・シミュレーションの試行回数 */
  iterations: number;
  /** 数学的にまだ優勝の可能性が残っているチーム数（自分を含む） */
  contendersAlive: number;
  /** ユーザーが現在予測している試合数 */
  predictionCount: number;
  /** 残り試合数（アーセナルの未消化試合の数） */
  remainingMatchCount: number;
  /** 残り試合の節レンジ（例: "第34節〜第38節"）。判定不能なら null。 */
  matchdayRange: string | null;
  /** 最終節のキックオフ日時（ISO 8601）。表示用。null なら非表示。 */
  finalKickoffDate: string | null;
}

/**
 * 優勝確率を画面のヒーローとして大きく見せるブロック。
 *
 * - Fraunces 衬線 で巨大な整数部、小数部はトーン落とし、% は sans 細体
 * - 数字の下に短い 2px Arsenal レッド underline（scaleX アニメーション）
 * - 下段に 4 つの小さなメトリクス（生存中チーム / 予測中 / 残り節 / 最終節）
 *
 * 計算は親（page.tsx）から渡された値を表示するだけ。
 */
export function ProbabilityCard({
  probability,
  iterations,
  contendersAlive,
  predictionCount,
  remainingMatchCount,
  matchdayRange,
  finalKickoffDate,
}: ProbabilityCardProps) {
  const animated = useAnimatedNumber(probability, 800);
  const [whole, fraction] = animated.toFixed(1).split(".");

  return (
    <section className="relative animate-fade-up pb-14 pt-16 [animation-delay:60ms]">
      <div className="mb-3.5 flex items-baseline justify-between">
        <p className="tag">優勝確率 / TITLE PROBABILITY</p>
        <p className="tag text-ink-400">
          MONTE CARLO · {iterations.toLocaleString("en-US")} RUNS
        </p>
      </div>

      <div
        className="-ml-[0.06em] flex items-baseline gap-[2px] font-display font-normal leading-[0.85] text-ink-900"
        style={{
          fontVariationSettings: '"opsz" 144',
          letterSpacing: "-0.04em",
        }}
      >
        <span
          className="tabular-nums"
          style={{ fontSize: "clamp(120px, 22vw, 280px)" }}
        >
          {whole}
        </span>
        <span
          className="tabular-nums text-ink-300"
          style={{
            fontSize: "clamp(60px, 11vw, 130px)",
            transform: "translateY(-0.06em)",
          }}
        >
          .{fraction}
        </span>
        <span
          className="ml-3.5 font-sans font-light text-ink-400"
          style={{
            fontSize: "clamp(40px, 7vw, 80px)",
            transform: "translateY(-0.18em)",
            letterSpacing: 0,
          }}
        >
          %
        </span>
      </div>

      <div className="hero-underline mt-[18px] w-[120px]" />

      <div className="mt-9 grid gap-7 text-[13px] text-ink-600 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <Metric
          label="生存中のチーム"
          value={String(contendersAlive)}
          suffix="チーム"
          sub="数学的に優勝可能"
        />
        <Metric
          label="予測中の試合"
          value={String(predictionCount)}
          suffix="試合"
          sub="未予測はランダム抽選"
        />
        <Metric
          label="残り試合"
          value={String(remainingMatchCount)}
          suffix="試合"
          sub={matchdayRange ?? "—"}
        />
        <Metric
          label="最終節"
          value={formatFinalDateMono(finalKickoffDate)}
          suffix=""
          sub={formatFinalDateSub(finalKickoffDate)}
          mono
        />
      </div>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  mono?: boolean;
}

function Metric({ label, value, suffix, sub, mono = false }: MetricProps) {
  return (
    <div className="border-t border-ink-200 pt-3.5">
      <p className="tag mb-2">{label}</p>
      <p
        className={`leading-none text-ink-900 ${
          mono ? "font-mono" : "font-display"
        }`}
        style={{
          fontSize: mono ? 28 : 32,
          fontWeight: 500,
          letterSpacing: mono ? "0" : "-0.01em",
          fontVariationSettings: mono ? undefined : '"opsz" 60',
        }}
      >
        {value}
        {suffix && (
          <span className="ml-1.5 font-sans text-[13px] font-normal text-ink-500">
            {suffix}
          </span>
        )}
      </p>
      {sub && <p className="mt-1.5 text-[11.5px] text-ink-500">{sub}</p>}
    </div>
  );
}

/** "6.05" 形式（日本時間） */
function formatFinalDateMono(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const m = d.toLocaleString("en-US", {
    month: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const day = d.toLocaleString("en-US", {
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
  return `${m}.${day}`;
}

/** "2026 / Fri" 形式 */
function formatFinalDateSub(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const year = d.toLocaleString("en-US", {
    year: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const wd = d.toLocaleString("en-US", {
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
  return `${year} / ${wd}`;
}
