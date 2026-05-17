import { describe, it, expect } from "vitest";
import {
  calculatePredictedStandings,
  compareByRank,
} from "./standings-calculator";
import type { StandingRow } from "@/types/standings";
import type { Match, PredictionMap } from "@/types/matches";

// --- テスト用フィクスチャ -------------------------------------------------

function makeRow(
  overrides: Partial<StandingRow> & {
    teamId: number;
    teamName: string;
    points: number;
  },
): StandingRow {
  return {
    position: 0,
    shortName: overrides.teamName,
    crest: "",
    playedGames: 36,
    won: 0,
    draw: 0,
    lost: 0,
    goalDifference: 0,
    ...overrides,
  };
}

const LIVERPOOL = makeRow({
  teamId: 64,
  teamName: "Liverpool FC",
  points: 82,
  goalDifference: 45,
  won: 25,
  draw: 7,
  lost: 4,
});
const ARSENAL = makeRow({
  teamId: 57,
  teamName: "Arsenal FC",
  points: 80,
  goalDifference: 50,
  won: 24,
  draw: 8,
  lost: 4,
});
const MAN_CITY = makeRow({
  teamId: 65,
  teamName: "Manchester City FC",
  points: 78,
  goalDifference: 55,
  won: 23,
  draw: 9,
  lost: 4,
});

const contenders: StandingRow[] = [LIVERPOOL, ARSENAL, MAN_CITY];

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

// アーセナル(57) ホーム vs マンチェスター・シティ(65)
const M_ARS_CITY = makeMatch(1001, 57, 65);
// リヴァプール(64) ホーム vs アーセナル(57)
const M_LIV_ARS = makeMatch(1002, 64, 57);
// アーセナル(57) ホーム vs 優勝争い対象外チーム(999)
const M_ARS_OTHER = makeMatch(1003, 57, 999);

const matches: Match[] = [M_ARS_CITY, M_LIV_ARS, M_ARS_OTHER];

// --- テスト ---------------------------------------------------------------

describe("calculatePredictedStandings", () => {
  it("予測がなければ勝点は変わらず、現在の勝点順に並ぶ", () => {
    const result = calculatePredictedStandings(contenders, matches, {});

    expect(result.map((row) => row.teamId)).toEqual([64, 57, 65]);
    expect(result.map((row) => row.points)).toEqual([82, 80, 78]);
    expect(result.map((row) => row.position)).toEqual([1, 2, 3]);
  });

  it("アーセナルが全試合勝つと予測すると、勝点が増えて1位になる", () => {
    const predictions: PredictionMap = {
      1001: "HOME", // アーセナルのホーム勝ち
      1002: "AWAY", // アーセナルのアウェイ勝ち
      1003: "HOME", // アーセナルのホーム勝ち
    };
    const result = calculatePredictedStandings(contenders, matches, predictions);
    const arsenal = result.find((row) => row.teamId === 57)!;

    expect(arsenal.points).toBe(89); // 80 + 3 * 3
    expect(arsenal.won).toBe(27); // 24 + 3
    expect(arsenal.playedGames).toBe(39); // 36 + 3
    expect(arsenal.position).toBe(1);
    expect(result[0].teamId).toBe(57);
  });

  it("対象チーム同士の試合は、両チームの成績に反映される", () => {
    // アーセナルのホーム勝ち vs マンチェスター・シティ
    const result = calculatePredictedStandings(contenders, matches, {
      1001: "HOME",
    });
    const arsenal = result.find((row) => row.teamId === 57)!;
    const city = result.find((row) => row.teamId === 65)!;

    expect(arsenal.points).toBe(83); // 80 + 3
    expect(arsenal.won).toBe(25);
    expect(city.points).toBe(78); // 敗戦なので加点なし
    expect(city.lost).toBe(5); // 4 + 1
    expect(city.playedGames).toBe(37);
  });

  it("対象外チームとの試合は、対象チーム側の成績だけ更新される", () => {
    // アーセナル vs 対象外チーム(999): アウェイ勝ち = アーセナルの敗戦
    const result = calculatePredictedStandings(contenders, matches, {
      1003: "AWAY",
    });
    const arsenal = result.find((row) => row.teamId === 57)!;

    expect(arsenal.lost).toBe(5);
    expect(arsenal.points).toBe(80); // 敗戦なので加点なし
    expect(arsenal.playedGames).toBe(37);
    expect(result).toHaveLength(3); // 対象外チームは順位表に追加されない
  });

  it("入力の配列・オブジェクトを破壊しない（純粋関数）", () => {
    calculatePredictedStandings(contenders, matches, { 1001: "HOME" });

    expect(ARSENAL.points).toBe(80);
    expect(ARSENAL.position).toBe(0);
  });
});

describe("compareByRank", () => {
  it("勝点が同じ場合は得失点差で比較する", () => {
    const a = makeRow({ teamId: 1, teamName: "A", points: 80, goalDifference: 10 });
    const b = makeRow({ teamId: 2, teamName: "B", points: 80, goalDifference: 20 });

    // 得失点差が大きい b が先に来る
    expect([a, b].sort(compareByRank).map((row) => row.teamId)).toEqual([2, 1]);
  });
});
