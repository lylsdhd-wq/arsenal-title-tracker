import type { Match } from "@/types/matches";
import type { StandingRow } from "@/types/standings";
import { ARSENAL_TEAM_ID } from "@/lib/constants";

/** 1チーム分の、予測対象となる残り試合のグループ */
export interface RivalMatchGroup {
  teamId: number;
  teamName: string;
  matches: Match[];
}

/**
 * 優勝争いのライバル（contenders のうちアーセナル以外）ごとに、
 * ユーザーが予測できる残り試合をグループ化する純粋関数。
 *
 * - アーセナルが絡む試合は除外する（アーセナル専用の予測欄で表示するため）。
 * - ライバル同士の試合は、順位が上のライバルのグループに1回だけ含める（重複排除）。
 * - 予測できる試合が無いライバルはグループに含めない。
 */
export function buildRivalMatchGroups(
  contenders: StandingRow[],
  matches: Match[],
): RivalMatchGroup[] {
  const rivals = contenders.filter((row) => row.teamId !== ARSENAL_TEAM_ID);
  // 既にいずれかのグループへ割り当てた試合ID（ライバル同士の試合の重複排除用）
  const assignedMatchIds = new Set<number>();
  const groups: RivalMatchGroup[] = [];

  for (const rival of rivals) {
    const rivalMatches = matches.filter((match) => {
      // アーセナルが絡む試合は対象外（アーセナル専用の予測欄で扱う）
      if (
        match.homeTeamId === ARSENAL_TEAM_ID ||
        match.awayTeamId === ARSENAL_TEAM_ID
      ) {
        return false;
      }
      // このライバルが関わる試合のみ
      const involvesRival =
        match.homeTeamId === rival.teamId ||
        match.awayTeamId === rival.teamId;
      if (!involvesRival) {
        return false;
      }
      // 既に順位が上のライバルのグループへ割り当て済みなら除外
      return !assignedMatchIds.has(match.id);
    });

    for (const match of rivalMatches) {
      assignedMatchIds.add(match.id);
    }

    groups.push({
      teamId: rival.teamId,
      teamName: rival.teamName,
      matches: rivalMatches,
    });
  }

  // 予測できる試合が無いライバルは表示対象から外す
  return groups.filter((group) => group.matches.length > 0);
}
