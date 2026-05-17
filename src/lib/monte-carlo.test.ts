import { describe, it, expect } from "vitest";
import {
  runMonteCarlo,
  getLiveContenderIds,
  resolveMatchOutcomes,
} from "./monte-carlo";
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

// 数学的失格の判定（ユーザー報告の数値で検証）
// Arsenal 79 / Man City 77 / Man Utd 68 / Aston Villa 62 / Liverpool 59
describe("getLiveContenderIds", () => {
  const titleRaceContenders: StandingRow[] = [
    makeRow({ teamId: 57, teamName: "Arsenal FC", points: 79 }),
    makeRow({ teamId: 65, teamName: "Manchester City FC", points: 77 }),
    makeRow({ teamId: 66, teamName: "Manchester United FC", points: 68 }),
    makeRow({ teamId: 58, teamName: "Aston Villa FC", points: 62 }),
    makeRow({ teamId: 64, teamName: "Liverpool FC", points: 59 }),
  ];
  // 残り試合: シティ2試合、ユナイテッド・ヴィラ・リヴァプール各1試合
  const titleRaceMatches: Match[] = [
    makeMatch(2001, 65, 999),
    makeMatch(2002, 65, 998),
    makeMatch(2003, 66, 999),
    makeMatch(2004, 58, 999),
    makeMatch(2005, 64, 999),
  ];

  it("理論最大勝点がアーセナルに届くチームだけを live と判定する", () => {
    const live = getLiveContenderIds(titleRaceContenders, titleRaceMatches);
    // アーセナル(基準) と シティ(77 + 2*3 = 83 >= 79) のみ
    expect(live.size).toBe(2);
    expect(live.has(57)).toBe(true);
    expect(live.has(65)).toBe(true);
  });

  it("理論最大勝点がアーセナル未満のライバルは数学的失格として除外する", () => {
    const live = getLiveContenderIds(titleRaceContenders, titleRaceMatches);
    // ユナイテッド 71 / ヴィラ 65 / リヴァプール 62 → いずれも 79 未満
    expect(live.has(66)).toBe(false);
    expect(live.has(58)).toBe(false);
    expect(live.has(64)).toBe(false);
  });

  it("理論最大勝点がアーセナルとちょうど同じならまだ可能性ありとみなす", () => {
    const contendersEdge: StandingRow[] = [
      makeRow({ teamId: 57, teamName: "Arsenal FC", points: 79 }),
      makeRow({ teamId: 65, teamName: "Manchester City FC", points: 76 }),
    ];
    // シティ 76 + 1*3 = 79 == アーセナル 79 → live
    const live = getLiveContenderIds(contendersEdge, [makeMatch(3001, 65, 999)]);
    expect(live.has(65)).toBe(true);
  });
});

describe("resolveMatchOutcomes", () => {
  // live = アーセナル(57) と シティ(65)。ユナイテッド(66)・ヴィラ(58) は数学的失格。
  const liveTeamIds = new Set<number>([57, 65]);

  it("数学的失格チーム同士の未予測試合は引き分けで固定する", () => {
    const match = makeMatch(4001, 66, 58); // ユナイテッド vs ヴィラ
    // 乱数(()=>0)はランダムなら HOME になるが、固定対象なので DRAW
    const resolved = resolveMatchOutcomes([match], {}, liveTeamIds, () => 0);
    expect(resolved[4001]).toBe("DRAW");
  });

  it("数学的失格チームの試合でも、ユーザーが予測していればその予測を尊重する", () => {
    const match = makeMatch(4002, 66, 58); // ユナイテッド vs ヴィラ
    const predictions: PredictionMap = { 4002: "HOME" };
    const resolved = resolveMatchOutcomes(
      [match],
      predictions,
      liveTeamIds,
      () => 0,
    );
    expect(resolved[4002]).toBe("HOME");
  });

  it("live チーム（マンチェスター・シティ）が絡む未予測試合は乱数で決まる", () => {
    const match = makeMatch(4003, 65, 66); // シティ vs ユナイテッド（シティは live）
    expect(resolveMatchOutcomes([match], {}, liveTeamIds, () => 0)[4003]).toBe(
      "HOME",
    );
    expect(
      resolveMatchOutcomes([match], {}, liveTeamIds, () => 0.5)[4003],
    ).toBe("DRAW");
    expect(
      resolveMatchOutcomes([match], {}, liveTeamIds, () => 0.9)[4003],
    ).toBe("AWAY");
  });

  it("失格チームの試合と live チームの試合が混在しても正しく振り分ける", () => {
    const elimMatch = makeMatch(4004, 66, 58); // 失格同士 → 引き分け固定
    const cityMatch = makeMatch(4005, 65, 999); // シティ絡み → 乱数
    const resolved = resolveMatchOutcomes(
      [elimMatch, cityMatch],
      {},
      liveTeamIds,
      () => 0,
    );
    expect(resolved[4004]).toBe("DRAW");
    expect(resolved[4005]).toBe("HOME");
  });

  it("数学的失格チーム vs 非 contender チームの未予測試合は引き分けで固定する", () => {
    // ユナイテッド(66, 失格) vs ブライトン(397, 優勝争い対象外)。
    // どちらも live ではないため、乱数(()=>0)に関わらず引き分けで固定される。
    const match = makeMatch(4006, 66, 397);
    const resolved = resolveMatchOutcomes([match], {}, liveTeamIds, () => 0);
    expect(resolved[4006]).toBe("DRAW");
  });

  it("数学的失格チーム vs 非 contender チームでも、ユーザー予測があればそれを尊重する", () => {
    const match = makeMatch(4007, 66, 397);
    const predictions: PredictionMap = { 4007: "AWAY" };
    const resolved = resolveMatchOutcomes(
      [match],
      predictions,
      liveTeamIds,
      () => 0,
    );
    expect(resolved[4007]).toBe("AWAY");
  });
});
