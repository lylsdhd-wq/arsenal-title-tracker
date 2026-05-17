interface ProbabilityCardProps {
  /** アーセナルの優勝確率（0〜100） */
  probability: number;
  /** モンテカルロ・シミュレーションの試行回数 */
  iterations: number;
}

/** アーセナルの優勝確率を大きく表示するカード。 */
export function ProbabilityCard({
  probability,
  iterations,
}: ProbabilityCardProps) {
  return (
    <div className="rounded-xl bg-arsenal p-6 text-center text-white shadow-md">
      <p className="text-sm font-medium opacity-90">アーセナル優勝確率</p>
      <p className="my-1 font-bold tabular-nums">
        <span className="text-6xl">{probability.toFixed(1)}</span>
        <span className="text-3xl">%</span>
      </p>
      <p className="text-xs opacity-80">
        モンテカルロ・シミュレーション {iterations.toLocaleString("ja-JP")} 回
      </p>
    </div>
  );
}
