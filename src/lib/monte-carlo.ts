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

/** matches の中で、指定チームが関わる試合（＝残り試合）の数を数える */
function countRemainingMatches(teamId: number, matches: Match[]): number {
  return matches.filter(
    (match) => match.homeTeamId === teamId || match.awayTeamId === teamId,
  ).length;
}

/**
 * 数学的にまだ優勝の可能性が残っているチーム（live チーム）の ID 集合を返す。
 *
 * アーセナルは基準チームとして常に live。ライバルは
 * 「現在勝点 + 残り試合数 × 3（理論最大勝点）」がアーセナルの現在勝点以上なら live、
 * 未満なら数学的に失格とみなして除外する。
 */
export function getLiveContenderIds(
  contenders: StandingRow[],
  matches: Match[],
): Set<number> {
  const liveTeamIds = new Set<number>();
  const arsenal = contenders.find((row) => row.teamId === ARSENAL_TEAM_ID);
  if (!arsenal) {
    return liveTeamIds;
  }
  liveTeamIds.add(ARSENAL_TEAM_ID);

  for (const rival of contenders) {
    if (rival.teamId === ARSENAL_TEAM_ID) {
      continue;
    }
    const maxPossiblePoints =
      rival.points + countRemainingMatches(rival.teamId, matches) * 3;
    // 理論最大勝点がアーセナルの現在勝点に届くなら、まだ優勝の可能性がある
    if (maxPossiblePoints >= arsenal.points) {
      liveTeamIds.add(rival.teamId);
    }
  }

  return liveTeamIds;
}

/**
 * モンテカルロ1試行分の、全試合の結果を決定する純粋関数。
 *
 * - ユーザーが予測済みの試合: その予測を尊重する（数学的に失格のチームの試合でも反映）。
 * - 未予測で、live チームが少なくとも一方に絡む試合: 勝/分/敗を 1/3 ずつでランダムに決定。
 * - 未予測で、live チームが絡まない試合: 引き分けで固定する。
 *   失格チーム同士の試合などは結果がアーセナルの順位に影響しないため、
 *   無駄な乱数でシミュレーションを揺らさない。
 */
export function resolveMatchOutcomes(
  matches: Match[],
  predictions: PredictionMap,
  liveTeamIds: Set<number>,
  random: () => number,
): PredictionMap {
  const resolved: PredictionMap = { ...predictions };

  for (const match of matches) {
    if (resolved[match.id] !== undefined) {
      continue; // ユーザー予測を尊重する
    }
    const involvesLiveTeam =
      liveTeamIds.has(match.homeTeamId) || liveTeamIds.has(match.awayTeamId);
    resolved[match.id] = involvesLiveTeam ? randomOutcome(random) : "DRAW";
  }

  return resolved;
}

/**
 * モンテカルロ法でアーセナルの優勝確率をシミュレーションする純粋関数。
 *
 * シミュレーション前に、数学的に優勝の可能性が残っているチームを判定し、
 * 可能性が無いチームだけが絡む試合は引き分けで固定する（resolveMatchOutcomes 参照）。
 *
 * 各試行で、残り試合の結果は次のように決まる:
 * - ユーザーが予測済みの試合: その予測結果で確定（deterministic）。
 * - 未予測の試合: live チームが絡むなら勝/分/敗 1/3 ずつのランダム、絡まないなら引き分け。
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

  // 数学的にまだ可能性のあるチームを事前に判定する（試行ごとに変わらないため1回だけ）
  const liveTeamIds = getLiveContenderIds(contenders, matches);

  let arsenalFirstCount = 0;

  for (let i = 0; i < iterations; i++) {
    const simulated = resolveMatchOutcomes(
      matches,
      predictions,
      liveTeamIds,
      random,
    );

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
