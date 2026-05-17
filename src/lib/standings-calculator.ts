import type { Match, MatchOutcome, PredictionMap } from "@/types/matches";
import type { StandingRow } from "@/types/standings";

/**
 * 順位表の並び替えに使う比較関数。勝点の降順 → 得失点差の降順 で比較する。
 *
 * 注意: 本アプリの予測は「勝/分/敗」のみを扱い、得点数までは予測しないため、
 * 得失点差は現在の値のまま固定で扱う（予測では変化しない）。
 */
export function compareByRank(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) {
    return b.points - a.points;
  }
  return b.goalDifference - a.goalDifference;
}

/** あるチームから見た1試合の結果 */
type TeamResult = "WIN" | "DRAW" | "LOSE";

/** 1チームの成績(StandingRow)に1試合分の結果を加算する（引数を直接変更する） */
function addResult(row: StandingRow, result: TeamResult): void {
  row.playedGames += 1;
  if (result === "WIN") {
    row.won += 1;
    row.points += 3;
  } else if (result === "DRAW") {
    row.draw += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

/**
 * 1試合の予測結果を、両チームの成績に反映する。
 * 優勝争いの対象外チーム（順位表マップに無いチーム）は集計しない。
 */
function applyOutcome(
  standingsById: Map<number, StandingRow>,
  match: Match,
  outcome: MatchOutcome,
): void {
  const home = standingsById.get(match.homeTeamId);
  const away = standingsById.get(match.awayTeamId);

  if (home) {
    addResult(
      home,
      outcome === "HOME" ? "WIN" : outcome === "DRAW" ? "DRAW" : "LOSE",
    );
  }
  if (away) {
    addResult(
      away,
      outcome === "AWAY" ? "WIN" : outcome === "DRAW" ? "DRAW" : "LOSE",
    );
  }
}

/**
 * 現在の順位表・残り試合・ユーザー予測から、予測上の最終順位表を計算する純粋関数。
 *
 * - 予測済みの試合のみを成績に反映する（未予測の試合は加味しない）。
 * - 入力の配列・オブジェクトは変更せず、コピーに対して計算する。
 * - 計算後、勝点・得失点差で並び替えて順位(position)を振り直す。
 */
export function calculatePredictedStandings(
  contenders: StandingRow[],
  matches: Match[],
  predictions: PredictionMap,
): StandingRow[] {
  // 入力を破壊しないようにコピーしてから計算する
  const rows = contenders.map((row) => ({ ...row }));
  const byId = new Map(rows.map((row) => [row.teamId, row]));

  for (const match of matches) {
    const outcome = predictions[match.id];
    if (!outcome) {
      continue;
    }
    applyOutcome(byId, match, outcome);
  }

  rows.sort(compareByRank);

  return rows.map((row, index) => ({ ...row, position: index + 1 }));
}
