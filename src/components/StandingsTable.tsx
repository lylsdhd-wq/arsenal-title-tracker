import type { StandingRow } from "@/types/standings";
import { ARSENAL_TEAM_ID } from "@/lib/constants";

/** 得失点差を符号付きの文字列にする（例: 12 → "+12"） */
function formatGoalDifference(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff);
}

interface StandingsTableProps {
  rows: StandingRow[];
}

/** 順位表。アーセナルの行をテーマカラーで強調する。 */
export function StandingsTable({ rows }: StandingsTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-arsenal text-gray-600">
          <th className="px-3 py-2 text-right font-medium">順位</th>
          <th className="px-3 py-2 text-left font-medium">チーム</th>
          <th className="px-3 py-2 text-right font-medium">試合</th>
          <th className="px-3 py-2 text-right font-medium">勝</th>
          <th className="px-3 py-2 text-right font-medium">分</th>
          <th className="px-3 py-2 text-right font-medium">敗</th>
          <th className="px-3 py-2 text-right font-medium">得失点</th>
          <th className="px-3 py-2 text-right font-medium">勝点</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isArsenal = row.teamId === ARSENAL_TEAM_ID;
          return (
            <tr
              key={row.teamId}
              className={
                isArsenal
                  ? "bg-arsenal/10 font-semibold"
                  : "border-b border-gray-100"
              }
            >
              <td className="px-3 py-2 text-right tabular-nums">
                {row.position}
              </td>
              <td className="px-3 py-2">
                <span className={isArsenal ? "text-arsenal" : ""}>
                  {row.teamName}
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.playedGames}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{row.won}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.draw}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.lost}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatGoalDifference(row.goalDifference)}
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums">
                {row.points}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
