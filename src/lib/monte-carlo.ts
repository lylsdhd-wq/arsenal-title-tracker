import type { Match, MatchOutcome, PredictionMap } from "@/types/matches";
import type { StandingRow } from "@/types/standings";
import {
  ARSENAL_TEAM_ID,
  DEFAULT_MONTE_CARLO_ITERATIONS,
} from "@/lib/constants";
import { calculatePredictedStandings } from "@/lib/standings-calculator";

export interface MonteCarloResult {
  /** 実行した試行回数 */
  iterations: number;
  /** アーセナルが1位になった確率（パーセント, 0〜100） */
  arsenalTitleProbability: number;
}

interface MonteCarloOptions {
  /** 試行回数（デフォルト 10000） */
  iterations?: number;
  /** 乱数生成関数。テストで決定的な値に差し替えられるよう注入可能にしている。 */
  random?: () => number;
}

/** 0〜1未満の乱数を、勝/分/敗（それぞれ 1/3 の確率）に変換する */
function randomOutcome(random: () => number): MatchOutcome {
  const value = random() * 3;
  if (value < 1) return "HOME";
  if (value < 2) return "DRAW";
  return "AWAY";
}

/**
 * モンテカルロ法でアーセナルの優勝確率をシミュレーションする純粋関数。
 *
 * 各試行で、残り試合の結果を次のように決める:
 * - ユーザーが予測済みの試合: その予測結果で確定（deterministic）
 * - 未予測の試合: 勝/分/敗をそれぞれ 1/3 の確率でランダムに決定
 *
 * 全試行のうち、アーセナルが優勝争いチームの中で1位になった割合を確率(%)として返す。
 * 順位の判定は calculatePredictedStandings に委譲する（勝点 → 得失点差）。
 */
export function runMonteCarlo(
  contenders: StandingRow[],
  matches: Match[],
  predictions: PredictionMap,
  options: MonteCarloOptions = {},
): MonteCarloResult {
  const iterations = options.iterations ?? DEFAULT_MONTE_CARLO_ITERATIONS;
  const random = options.random ?? Math.random;

  // アーセナルが優勝争いの対象に含まれていない、または試行回数が0以下なら 0%
  const hasArsenal = contenders.some((row) => row.teamId === ARSENAL_TEAM_ID);
  if (!hasArsenal || iterations <= 0) {
    return {
      iterations: Math.max(0, iterations),
      arsenalTitleProbability: 0,
    };
  }

  let arsenalFirstCount = 0;

  for (let i = 0; i < iterations; i++) {
    // ユーザー予測を土台に、未予測の試合だけランダムな結果で埋める
    const simulated: PredictionMap = { ...predictions };
    for (const match of matches) {
      if (simulated[match.id] === undefined) {
        simulated[match.id] = randomOutcome(random);
      }
    }

    const finalTable = calculatePredictedStandings(
      contenders,
      matches,
      simulated,
    );

    if (finalTable[0]?.teamId === ARSENAL_TEAM_ID) {
      arsenalFirstCount += 1;
    }
  }

  return {
    iterations,
    arsenalTitleProbability: (arsenalFirstCount / iterations) * 100,
  };
}
