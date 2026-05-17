import type {
  FootballDataStandingsResponse,
  StandingRow,
  StandingsResult,
} from "@/types/standings";
import type { FootballDataMatchesResponse, Match } from "@/types/matches";

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

/** 未消化（予定）とみなす試合ステータス */
const UPCOMING_MATCH_STATUSES = new Set(["SCHEDULED", "TIMED"]);

/**
 * Football-Data.org の試合レスポンスを、アプリ内部で使う Match[] へ変換する純粋関数。
 *
 * まだ行われていない試合のみを抽出する。Football-Data ではキックオフ時刻が未確定だと
 * SCHEDULED、確定済みだと TIMED になるため、両方を「残り試合」として扱う。
 * 結果はキックオフ日時の昇順に並べる。
 */
export function mapMatches(response: FootballDataMatchesResponse): Match[] {
  return response.matches
    .filter((match) => UPCOMING_MATCH_STATUSES.has(match.status))
    .map((match) => ({
      id: match.id,
      utcDate: match.utcDate,
      matchday: match.matchday,
      homeTeamId: match.homeTeam.id,
      homeTeamName: match.homeTeam.name,
      homeTeamShortName: match.homeTeam.shortName,
      awayTeamId: match.awayTeam.id,
      awayTeamName: match.awayTeam.name,
      awayTeamShortName: match.awayTeam.shortName,
    }))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
}
