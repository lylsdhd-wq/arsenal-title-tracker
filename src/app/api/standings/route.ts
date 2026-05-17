import { NextResponse } from "next/server";
import {
  fetchPremierLeagueStandings,
  FootballDataError,
} from "@/lib/football-data";
import { mapStandingsResponse } from "@/lib/mappers";

/**
 * GET /api/standings
 *
 * 英超の順位表を返すサーバーサイドプロキシ。
 * Football-Data.org の API キーをクライアントに晒さないために存在する。
 * fetch を 60 秒キャッシュすることで、無料プランのレート制限(10回/分)を回避する。
 */
export async function GET() {
  try {
    const { data, rateLimit } = await fetchPremierLeagueStandings({
      revalidate: 60,
    });

    const result = mapStandingsResponse(data);

    // レート制限の残量をサーバーログに記録する（クライアントには返さない）
    console.info(
      `[football-data] 残りリクエスト数: ${rateLimit.available ?? "不明"} / ` +
        `リセットまで: ${rateLimit.resetSeconds ?? "不明"}秒`,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FootballDataError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[/api/standings] 予期しないエラー:", error);
    return NextResponse.json(
      { error: "順位表の取得中に予期しないエラーが発生しました" },
      { status: 500 },
    );
  }
}
