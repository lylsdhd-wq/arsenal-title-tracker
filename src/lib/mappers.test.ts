import { describe, it, expect } from "vitest";
import { mapStandingsResponse } from "./mappers";
import type { FootballDataStandingsResponse } from "@/types/standings";

// Football-Data.org のレスポンスを模した最小限のサンプルデータ
const sampleResponse: FootballDataStandingsResponse = {
  competition: { id: 2021, name: "Premier League", code: "PL" },
  season: {
    id: 2024,
    startDate: "2024-08-16",
    endDate: "2025-05-25",
    currentMatchday: 36,
  },
  standings: [
    {
      stage: "REGULAR_SEASON",
      type: "TOTAL",
      group: null,
      table: [
        {
          position: 1,
          team: {
            id: 57,
            name: "Arsenal FC",
            shortName: "Arsenal",
            tla: "ARS",
            crest: "https://crests.football-data.org/57.png",
          },
          playedGames: 36,
          form: "W,W,D,W,L",
          won: 26,
          draw: 6,
          lost: 4,
          points: 84,
          goalsFor: 88,
          goalsAgainst: 32,
          goalDifference: 56,
        },
      ],
    },
    // HOME テーブルは変換結果から除外されることを確認するために含めておく
    {
      stage: "REGULAR_SEASON",
      type: "HOME",
      group: null,
      table: [],
    },
  ],
};

describe("mapStandingsResponse", () => {
  it("TOTAL タイプの順位表のみを抽出して変換する", () => {
    const result = mapStandingsResponse(sampleResponse);

    expect(result.competition).toBe("Premier League");
    expect(result.currentMatchday).toBe(36);
    expect(result.rows).toHaveLength(1);

    const arsenal = result.rows[0];
    expect(arsenal.position).toBe(1);
    expect(arsenal.teamName).toBe("Arsenal FC");
    expect(arsenal.points).toBe(84);
    expect(arsenal.goalDifference).toBe(56);
  });

  it("TOTAL タイプが存在しない場合はエラーを投げる", () => {
    const withoutTotal: FootballDataStandingsResponse = {
      ...sampleResponse,
      standings: [
        { stage: "REGULAR_SEASON", type: "HOME", group: null, table: [] },
      ],
    };

    expect(() => mapStandingsResponse(withoutTotal)).toThrow();
  });
});
