import type { StandingsResult } from "@/types/standings";

/** アーセナルの行かどうかを判定する（強調表示用） */
function isArsenal(teamName: string): boolean {
  return teamName.includes("Arsenal");
}

/** 得失点差を符号付きの文字列にする（例: 12 → "+12"） */
function formatGoalDifference(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff);
}

interface StandingsTableProps {
  data: StandingsResult;
}

/** プレミアリーグの順位表。アーセナルの行をテーマカラーで強調する。 */
export function StandingsTable({ data }: StandingsTableProps) {
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
        {data.rows.map((row) => {
          const arsenal = isArsenal(row.teamName);
          return (
            <tr
              key={row.teamId}
              className={
                arsenal
                  ? "bg-arsenal/10 font-semibold"
                  : "border-b border-gray-100"
              }
            >
              <td className="px-3 py-2 text-right tabular-nums">
                {row.position}
              </td>
              <td className="px-3 py-2">
                <span className={arsenal ? "text-arsenal" : ""}>
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
