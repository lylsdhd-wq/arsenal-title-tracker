import type { StandingRow } from "./standings";

// ==========================================================================
// Football-Data.org v4 API のレスポンス型（試合エンドポイントで使う部分のみ）
// ==========================================================================

/** 試合に登場するチーム情報 */
export interface FootballDataMatchTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

/** 1試合分の情報 */
export interface FootballDataMatch {
  id: number;
  utcDate: string;
  /** SCHEDULED / TIMED / IN_PLAY / FINISHED など */
  status: string;
  matchday: number | null;
  homeTeam: FootballDataMatchTeam;
  awayTeam: FootballDataMatchTeam;
}

/** /competitions/{code}/matches のレスポンス全体 */
export interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

// ==========================================================================
// アプリ内部で使うクリーンな型
// ==========================================================================

/** 試合（アプリ内部表現）。未消化（予定）の試合のみを扱う。 */
export interface Match {
  id: number;
  /** キックオフ日時（UTC, ISO 8601 形式） */
  utcDate: string;
  /** 節 */
  matchday: number | null;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamShortName: string;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamShortName: string;
}

/**
 * 試合結果の予測。ホームチーム視点で表す。
 * - HOME: ホームの勝ち
 * - DRAW: 引き分け
 * - AWAY: アウェイの勝ち
 */
export type MatchOutcome = "HOME" | "DRAW" | "AWAY";

/** 試合 ID → 予測結果 のマップ。未予測の試合はキーを持たない。 */
export type PredictionMap = Record<number, MatchOutcome>;

/** /api/title-race-matches のレスポンス */
export interface TitleRaceResult {
  /** 優勝争いの対象（現在の順位表の上位チーム） */
  contenders: StandingRow[];
  /** 上位チームが関わる未消化の試合 */
  matches: Match[];
}

/** /api/arsenal-matches のレスポンス */
export interface ArsenalMatchesResult {
  /** アーセナルの未消化の試合 */
  matches: Match[];
}
