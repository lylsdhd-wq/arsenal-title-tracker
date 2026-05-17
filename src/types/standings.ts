// ==========================================================================
// Football-Data.org v4 API のレスポンス型（順位表エンドポイントで使う部分のみ）
// 参考: https://docs.football-data.org/
// ==========================================================================

/** チーム情報 */
export interface FootballDataTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

/** 順位表の1行（1チーム分の成績） */
export interface FootballDataTableEntry {
  position: number;
  team: FootballDataTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

/**
 * 順位表のグループ。
 * type は通算(TOTAL) / ホーム(HOME) / アウェイ(AWAY) のいずれか。
 */
export interface FootballDataStandingGroup {
  stage: string;
  type: "TOTAL" | "HOME" | "AWAY";
  group: string | null;
  table: FootballDataTableEntry[];
}

/** /competitions/{code}/standings のレスポンス全体 */
export interface FootballDataStandingsResponse {
  competition: {
    id: number;
    name: string;
    code: string;
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number | null;
  };
  standings: FootballDataStandingGroup[];
}

// ==========================================================================
// アプリ内部で使うクリーンな型（UI・計算ロジックはこちらだけを参照する）
// ==========================================================================

/** 順位表の1行（アプリ内部表現） */
export interface StandingRow {
  /** 順位 */
  position: number;
  teamId: number;
  /** チーム名（例: "Arsenal FC"） */
  teamName: string;
  /** 短縮名（例: "Arsenal"） */
  shortName: string;
  /** エンブレム画像の URL */
  crest: string;
  /** 試合数 */
  playedGames: number;
  /** 勝 */
  won: number;
  /** 分 */
  draw: number;
  /** 敗 */
  lost: number;
  /** 勝点 */
  points: number;
  /** 得失点差 */
  goalDifference: number;
}

/** /api/standings が返すデータ */
export interface StandingsResult {
  /** 大会名（例: "Premier League"） */
  competition: string;
  /** 現在の節 */
  currentMatchday: number | null;
  /** 順位順に並んだ各チームの成績 */
  rows: StandingRow[];
}
