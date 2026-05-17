import type { FootballDataStandingsResponse } from "@/types/standings";

const API_BASE = "https://api.football-data.org/v4";

/** Premier League の大会コード */
const PREMIER_LEAGUE_CODE = "PL";

/**
 * Football-Data.org のレート制限情報。
 * 無料プランは 10 リクエスト/分。レスポンスヘッダーから取得する。
 */
export interface RateLimitInfo {
  /** この1分間に残っているリクエスト可能回数 */
  available: number | null;
  /** カウンターがリセットされるまでの秒数 */
  resetSeconds: number | null;
}

/** Football-Data.org への通信で発生したエラー（HTTP ステータス付き） */
export class FootballDataError extends Error {
  constructor(
    message: string,
    /** クライアントへ返すべき HTTP ステータスコード */
    public readonly status: number,
    public readonly rateLimit?: RateLimitInfo,
  ) {
    super(message);
    this.name = "FootballDataError";
  }
}

/** レスポンスヘッダーからレート制限情報を読み取る */
function readRateLimit(headers: Headers): RateLimitInfo {
  const available = headers.get("X-Requests-Available-Minute");
  const reset = headers.get("X-RequestCounter-Reset");

  return {
    available: available !== null ? Number(available) : null,
    resetSeconds: reset !== null ? Number(reset) : null,
  };
}

interface FetchOptions {
  /** Next.js のサーバーサイドキャッシュ再検証間隔（秒） */
  revalidate?: number;
}

/**
 * 英超（Premier League）の順位表を Football-Data.org から取得する。
 *
 * - API キーは環境変数 FOOTBALL_DATA_API_KEY からサーバーサイドでのみ参照する。
 *   クライアントには絶対に渡さない。
 * - Next.js の fetch キャッシュ(revalidate)を使い、同じデータへのリクエストを
 *   一定時間まとめることで、無料プランのレート制限(10回/分)を自然に回避する。
 */
export async function fetchPremierLeagueStandings(
  options: FetchOptions = {},
): Promise<{
  data: FootballDataStandingsResponse;
  rateLimit: RateLimitInfo;
}> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    throw new FootballDataError(
      "環境変数 FOOTBALL_DATA_API_KEY が設定されていません。.env.local を確認してください。",
      500,
    );
  }

  const response = await fetch(
    `${API_BASE}/competitions/${PREMIER_LEAGUE_CODE}/standings`,
    {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: options.revalidate ?? 60 },
    },
  );

  const rateLimit = readRateLimit(response.headers);

  if (!response.ok) {
    const message =
      response.status === 429
        ? "Football-Data.org のレート制限に達しました。しばらく待ってから再試行してください。"
        : `Football-Data.org からエラーが返されました (HTTP ${response.status})`;

    throw new FootballDataError(message, response.status, rateLimit);
  }

  const data = (await response.json()) as FootballDataStandingsResponse;

  return { data, rateLimit };
}
