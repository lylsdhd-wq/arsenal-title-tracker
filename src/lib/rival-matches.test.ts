import { describe, it, expect } from "vitest";
import { buildRivalMatchGroups } from "./rival-matches";
import type { StandingRow } from "@/types/standings";
import type { Match } from "@/types/matches";

// --- テスト用フィクスチャ -------------------------------------------------

function makeRow(teamId: number, teamName: string): StandingRow {
  return {
    position: 0,
    teamId,
    teamName,
    shortName: teamName,
    crest: "",
    playedGames: 36,
    won: 0,
    draw: 0,
    lost: 0,
    points: 0,
    goalDifference: 0,
  };
}

function makeMatch(id: number, homeId: number, awayId: number): Match {
  return {
    id,
    utcDate: "2026-05-20T14:00:00Z",
    matchday: 37,
    homeTeamId: homeId,
    homeTeamName: `team-${homeId}`,
    homeTeamShortName: `t${homeId}`,
    awayTeamId: awayId,
    awayTeamName: `team-${awayId}`,
    awayTeamShortName: `t${awayId}`,
  };
}

// 順位順の contenders（アーセナル57 を含む上位5チーム）
const contenders: StandingRow[] = [
  makeRow(57, "Arsenal FC"),
  makeRow(65, "Manchester City FC"),
  makeRow(64, "Liverpool FC"),
  makeRow(58, "Aston Villa FC"),
  makeRow(66, "Manchester United FC"),
];

// --- テスト ---------------------------------------------------------------

describe("buildRivalMatchGroups", () => {
  it("アーセナルが絡む試合を除外し、ライバルごとに試合をまとめる", () => {
    const matches: Match[] = [
      makeMatch(1, 57, 65), // アーセナル vs シティ → 除外
      makeMatch(2, 65, 999), // シティ vs 対象外 → シティ
      makeMatch(3, 64, 999), // リヴァプール vs 対象外 → リヴァプール
    ];
    const groups = buildRivalMatchGroups(contenders, matches);

    // アーセナルはライバルのグループに含まれない
    expect(groups.some((group) => group.teamId === 57)).toBe(false);
    expect(groups.find((group) => group.teamId === 65)?.matches.map((m) => m.id)).toEqual([2]);
    expect(groups.find((group) => group.teamId === 64)?.matches.map((m) => m.id)).toEqual([3]);
  });

  it("ライバル同士の試合は順位が上のライバルに1回だけ含める", () => {
    const matches: Match[] = [
      makeMatch(10, 65, 64), // シティ vs リヴァプール
      makeMatch(11, 66, 65), // ユナイテッド vs シティ
    ];
    const groups = buildRivalMatchGroups(contenders, matches);

    // どちらの試合も、より順位が上のシティのグループに入る
    expect(groups.find((group) => group.teamId === 65)?.matches.map((m) => m.id)).toEqual([10, 11]);
    // リヴァプール・ユナイテッド側に重複表示されない
    expect(groups.find((group) => group.teamId === 64)).toBeUndefined();
    expect(groups.find((group) => group.teamId === 66)).toBeUndefined();
  });

  it("予測できる試合が無いライバルはグループに含めない", () => {
    const matches: Match[] = [
      makeMatch(20, 58, 57), // ヴィラ vs アーセナル → 除外。ヴィラは空になる
      makeMatch(21, 65, 999), // シティ vs 対象外
    ];
    const groups = buildRivalMatchGroups(contenders, matches);

    expect(groups.map((group) => group.teamId)).toEqual([65]);
  });

  it("試合が無ければ空配列を返す", () => {
    expect(buildRivalMatchGroups(contenders, [])).toEqual([]);
  });
});
