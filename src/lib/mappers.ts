import type {
  FootballDataStandingsResponse,
  StandingRow,
  StandingsResult,
} from "@/types/standings";

/**
 * Football-Data.org のレスポンスを、アプリ内部で使う順位表データへ変換する純粋関数。
 *
 * standings 配列には通算(TOTAL)・ホーム(HOME)・アウェイ(AWAY)の3種類が含まれるため、
 * 通算成績(TOTAL)のテーブルのみを抽出する。
 *
 * 純粋関数として切り出しているのは、ネットワークに依存せず単体テストできるようにするため。
 */
export function mapStandingsResponse(
  response: FootballDataStandingsResponse,
): StandingsResult {
  const totalGroup = response.standings.find((group) => group.type === "TOTAL");

  if (!totalGroup) {
    throw new Error("レスポンスに TOTAL タイプの順位表が含まれていません");
  }

  const rows: StandingRow[] = totalGroup.table.map((entry) => ({
    position: entry.position,
    teamId: entry.team.id,
    teamName: entry.team.name,
    shortName: entry.team.shortName,
    crest: entry.team.crest,
    playedGames: entry.playedGames,
    won: entry.won,
    draw: entry.draw,
    lost: entry.lost,
    points: entry.points,
    goalDifference: entry.goalDifference,
  }));

  return {
    competition: response.competition.name,
    currentMatchday: response.season.currentMatchday,
    rows,
  };
}
