/**
 * チーム ID → 代表色 のマップ。
 * 順位表のカラーチップと、試合行のチームラベル横に表示する細い色バーで使う。
 * Football-Data.org のチーム ID をキーにしている。
 *
 * 優勝争い対象（上位5チーム）の色は確実に揃えておき、
 * その他のチームは試合の対戦相手として登場する範囲でカバーする。
 */
export const TEAM_COLORS: Record<number, string> = {
  // ----- 優勝争いチーム -----
  57: "#EF0107", // Arsenal
  65: "#6CABDD", // Manchester City
  64: "#C8102E", // Liverpool
  58: "#670E36", // Aston Villa
  66: "#DA291C", // Manchester United

  // ----- その他のプレミアリーグ勢（対戦相手として登場するもの） -----
  61: "#034694", // Chelsea
  67: "#241F20", // Newcastle
  73: "#132257", // Tottenham
  62: "#003399", // Everton
  76: "#FDB913", // Wolves
  63: "#000000", // Fulham
  351: "#DD0000", // Nottingham Forest
  354: "#1B458F", // Crystal Palace
  328: "#6C1D45", // Burnley
  349: "#3A64A3", // Ipswich
  389: "#FFCD00", // Luton
  397: "#0057B8", // Brighton
  402: "#E30613", // Brentford
  563: "#7A263A", // West Ham
  1044: "#DA291C", // Bournemouth
};

/** チーム色を取得する。未登録のチームは ink-300 のニュートラルにフォールバック。 */
export function getTeamColor(teamId: number): string {
  return TEAM_COLORS[teamId] ?? "#B8B0A1";
}
