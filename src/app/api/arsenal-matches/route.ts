import { NextResponse } from "next/server";
import {
  fetchPremierLeagueMatches,
  FootballDataError,
} from "@/lib/football-data";
import { mapMatches } from "@/lib/mappers";
import { ARSENAL_TEAM_ID } from "@/lib/constants";

/**
 * GET /api/arsenal-matches
 *
 * アーセナルの残り試合（未消化試合）を返すサーバーサイドプロキシ。
 * 大会別エンドポイントで英超の全試合を取得し、アーセナルが関わる試合だけを抽出する。
 */
export async function GET() {
  try {
    const { data, rateLimit } = await fetchPremierLeagueMatches({
      revalidate: 60,
    });

    const matches = mapMatches(data).filter(
      (match) =>
        match.homeTeamId === ARSENAL_TEAM_ID ||
        match.awayTeamId === ARSENAL_TEAM_ID,
    );

    console.info(
      `[football-data] 残りリクエスト数: ${rateLimit.available ?? "不明"} / ` +
        `リセットまで: ${rateLimit.resetSeconds ?? "不明"}秒`,
    );

    return NextResponse.json({ matches });
  } catch (error) {
    if (error instanceof FootballDataError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[/api/arsenal-matches] 予期しないエラー:", error);
    return NextResponse.json(
      { error: "試合日程の取得中に予期しないエラーが発生しました" },
      { status: 500 },
    );
  }
}
