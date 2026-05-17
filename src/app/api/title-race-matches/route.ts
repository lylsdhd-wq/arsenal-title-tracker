import { NextResponse } from "next/server";
import {
  fetchPremierLeagueStandings,
  fetchPremierLeagueMatches,
  FootballDataError,
} from "@/lib/football-data";
import { mapStandingsResponse, mapMatches } from "@/lib/mappers";
import { TITLE_CONTENDER_COUNT } from "@/lib/constants";

/**
 * GET /api/title-race-matches
 *
 * 優勝争いの対象チームと、そのチームが関わる残り試合をまとめて返す。
 * 対象チームはハードコードせず、毎回その時点の順位表の上位から動的に決定する。
 */
export async function GET() {
  try {
    // 順位表と全試合を並行して取得（どちらも fetch キャッシュで重複排除される）
    const [standingsRes, matchesRes] = await Promise.all([
      fetchPremierLeagueStandings({ revalidate: 60 }),
      fetchPremierLeagueMatches({ revalidate: 60 }),
    ]);

    const standings = mapStandingsResponse(standingsRes.data);
    const contenders = standings.rows.slice(0, TITLE_CONTENDER_COUNT);
    const contenderIds = new Set(contenders.map((row) => row.teamId));

    // 上位チームが少なくとも一方に関わる試合だけを抽出する
    const matches = mapMatches(matchesRes.data).filter(
      (match) =>
        contenderIds.has(match.homeTeamId) ||
        contenderIds.has(match.awayTeamId),
    );

    console.info(
      `[football-data] 残りリクエスト数: ${matchesRes.rateLimit.available ?? "不明"}`,
    );

    return NextResponse.json({ contenders, matches });
  } catch (error) {
    if (error instanceof FootballDataError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[/api/title-race-matches] 予期しないエラー:", error);
    return NextResponse.json(
      { error: "優勝争いデータの取得中に予期しないエラーが発生しました" },
      { status: 500 },
    );
  }
}
