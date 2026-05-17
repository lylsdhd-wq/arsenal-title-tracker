import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "./monte-carlo";
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

const LIVERPOOL = makeRow({
  teamId: 64,
  teamName: "Liverpool FC",
  points: 82,
  goalDifference: 45,
});
const ARSENAL = makeRow({
  teamId: 57,
  teamName: "Arsenal FC",
  points: 80,
  goalDifference: 50,
});
const MAN_CITY = makeRow({
  teamId: 65,
  teamName: "Manchester City FC",
  points: 78,
  goalDifference: 55,
});

const contenders: StandingRow[] = [LIVERPOOL, ARSENAL, MAN_CITY];

// アーセナル(57) ホーム vs マンチェスター・シティ(65)
const M_ARS_CITY = makeMatch(1001, 57, 65);
// リヴァプール(64) ホーム vs アーセナル(57)
const M_LIV_ARS = makeMatch(1002, 64, 57);
// アーセナル(57) ホーム vs 優勝争い対象外チーム(999)
const M_ARS_OTHER = makeMatch(1003, 57, 999);

const matches: Match[] = [M_ARS_CITY, M_LIV_ARS, M_ARS_OTHER];

// --- テスト ---------------------------------------------------------------

describe("runMonteCarlo", () => {
  it("全試合を予測しアーセナルが明確に1位なら、確率は100%", () => {
    const predictions: PredictionMap = {
      1001: "HOME", // アーセナル勝ち
      1002: "AWAY", // アーセナル勝ち
      1003: "HOME", // アーセナル勝ち
    };
    const result = runMonteCarlo(contenders, matches, predictions, {
      iterations: 100,
    });

    expect(result.arsenalTitleProbability).toBe(100);
  });

  it("全試合を予測しアーセナルが1位になれないなら、確率は0%", () => {
    const predictions: PredictionMap = {
      1001: "AWAY", // シティ勝ち
      1002: "HOME", // リヴァプール勝ち
      1003: "AWAY", // アーセナル敗戦
    };
    const result = runMonteCarlo(contenders, matches, predictions, {
      iterations: 100,
    });

    expect(result.arsenalTitleProbability).toBe(0);
  });

  it("未予測の試合は乱数で決まる（乱数を注入して検証）", () => {
    // random が常に 0 を返す → 全試合ホーム勝ち
    // 1001:アーセナル+3, 1002:リヴァプール+3, 1003:アーセナル+3
    // → アーセナル86 / リヴァプール85 / シティ78 → アーセナル1位
    const result = runMonteCarlo(
      contenders,
      matches,
      {},
      { iterations: 50, random: () => 0 },
    );

    expect(result.arsenalTitleProbability).toBe(100);
  });

  it("勝点が並んだ場合は得失点差で1位を判定する", () => {
    // random が常に 0.5 → 全試合引き分け
    // → アーセナル83 / リヴァプール83（同点）→ 得失点差(50 > 45)でアーセナル1位
    const result = runMonteCarlo(
      contenders,
      matches,
      {},
      { iterations: 50, random: () => 0.5 },
    );

    expect(result.arsenalTitleProbability).toBe(100);
  });

  it("残り試合がなければ現在の順位がそのまま結果になる", () => {
    // アーセナルは現在2位なので 0%
    expect(
      runMonteCarlo(contenders, [], {}, { iterations: 10 })
        .arsenalTitleProbability,
    ).toBe(0);

    // アーセナルが現在1位のフィクスチャでは 100%
    const arsenalTop: StandingRow[] = [
      makeRow({ teamId: 57, teamName: "Arsenal FC", points: 90 }),
      makeRow({ teamId: 64, teamName: "Liverpool FC", points: 80 }),
    ];
    expect(
      runMonteCarlo(arsenalTop, [], {}, { iterations: 10 })
        .arsenalTitleProbability,
    ).toBe(100);
  });

  it("アーセナルが優勝争いに含まれなければ確率は0%", () => {
    const withoutArsenal: StandingRow[] = [LIVERPOOL, MAN_CITY];
    const result = runMonteCarlo(withoutArsenal, matches, {}, {
      iterations: 10,
    });

    expect(result.arsenalTitleProbability).toBe(0);
  });

  it("試行回数を指定しなければデフォルト(10000)で実行する", () => {
    const result = runMonteCarlo(contenders, [], {});

    expect(result.iterations).toBe(10000);
  });

  it("試行回数が0なら確率0%を返す", () => {
    const result = runMonteCarlo(contenders, matches, {}, { iterations: 0 });

    expect(result.arsenalTitleProbability).toBe(0);
    expect(result.iterations).toBe(0);
  });
});
