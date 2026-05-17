import { useMemo } from "react";
import type { StandingRow } from "@/types/standings";
import { ARSENAL_TEAM_ID } from "@/lib/constants";
import { getTeamColor } from "@/components/team-colors";

/** 得失点差を符号付きの文字列にする（例: 12 → "+12"） */
function formatGoalDifference(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff);
}

interface StandingsTableProps {
  rows: StandingRow[];
  /** 予測なしのベースライン順位表。▲▼ の順位変動表示に使う。 */
  baselineRows?: StandingRow[];
  /** ▲▼ を表示するかどうか（通常は predictionCount > 0 のときだけ true） */
  showDeltas?: boolean;
}

/**
 * 予測最終順位表。
 * - アーセナル行は左端に 2px の Arsenal レッド縦バー + 順位/勝点をレッドで強調
 * - 各チームは 3×18px のカラーチップでブランド表現（クレストは使わない）
 * - 予測がある場合は短縮名の下に ▲N（赤）/ ▼N（グレー）を mono で表示
 */
export function StandingsTable({
  rows,
  baselineRows = [],
  showDeltas = false,
}: StandingsTableProps) {
  const baselineById = useMemo(() => {
    const map = new Map<number, StandingRow>();
    for (const row of baselineRows) {
      map.set(row.teamId, row);
    }
    return map;
  }, [baselineRows]);

  return (
    <table className="w-full tabular-nums">
      <thead>
        <tr className="border-b border-ink-200">
          <Th align="left" w="36px">
            #
          </Th>
          <Th align="left">CLUB</Th>
          <Th align="right" hideOnMobile>
            試合
          </Th>
          <Th align="right" hideOnMobile>
            勝
          </Th>
          <Th align="right" hideOnMobile>
            分
          </Th>
          <Th align="right" hideOnMobile>
            敗
          </Th>
          <Th align="right">得失</Th>
          <Th align="right" emph>
            勝点
          </Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isArsenal = row.teamId === ARSENAL_TEAM_ID;
          const baseline = baselineById.get(row.teamId);
          const delta = baseline ? baseline.position - row.position : 0;
          return (
            <tr key={row.teamId} className="relative border-b border-ink-100">
              <td className="relative w-9 px-2 py-4 pl-3.5">
                {isArsenal && <span className="arsenal-rule" />}
                <span
                  className={`font-display text-[18px] font-medium ${
                    isArsenal ? "text-arsenal" : "text-ink-900"
                  }`}
                  style={{ fontVariationSettings: '"opsz" 60' }}
                >
                  {row.position}
                </span>
              </td>
              <td className="px-2 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="team-chip team-chip-lg"
                    style={{ background: getTeamColor(row.teamId) }}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-[14.5px] text-ink-900 ${
                        isArsenal ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {row.shortName}
                    </span>
                    {showDeltas && delta !== 0 && (
                      <span
                        className={`mt-0.5 font-mono text-[10px] tracking-[0.05em] ${
                          delta > 0 ? "text-arsenal" : "text-ink-400"
                        }`}
                      >
                        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <Td align="right" hideOnMobile>
                {row.playedGames}
              </Td>
              <Td align="right" hideOnMobile>
                {row.won}
              </Td>
              <Td align="right" hideOnMobile>
                {row.draw}
              </Td>
              <Td align="right" hideOnMobile>
                {row.lost}
              </Td>
              <Td align="right" muted>
                {formatGoalDifference(row.goalDifference)}
              </Td>
              <Td align="right" emph isArsenal={isArsenal}>
                {row.points}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface ThProps {
  children: React.ReactNode;
  align: "left" | "right";
  hideOnMobile?: boolean;
  emph?: boolean;
  w?: string;
}
function Th({ children, align, hideOnMobile, emph, w }: ThProps) {
  return (
    <th
      className={`px-2 py-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] ${
        emph ? "text-ink-700" : "text-ink-500"
      } ${hideOnMobile ? "hidden sm:table-cell" : ""}`}
      style={{ textAlign: align, width: w }}
    >
      {children}
    </th>
  );
}

interface TdProps {
  children: React.ReactNode;
  align: "left" | "right";
  hideOnMobile?: boolean;
  emph?: boolean;
  muted?: boolean;
  isArsenal?: boolean;
}
function Td({
  children,
  align,
  hideOnMobile,
  emph,
  muted,
  isArsenal,
}: TdProps) {
  const color = muted
    ? "text-ink-500"
    : isArsenal && emph
      ? "text-arsenal"
      : "text-ink-900";
  return (
    <td
      className={`px-2 py-4 ${hideOnMobile ? "hidden sm:table-cell" : ""} ${color} ${
        emph
          ? "font-display text-[18px] font-semibold"
          : "font-sans text-[13.5px] font-normal"
      }`}
      style={{
        textAlign: align,
        fontVariantNumeric: "tabular-nums",
        fontVariationSettings: emph ? '"opsz" 60' : undefined,
        letterSpacing: emph ? "-0.01em" : 0,
      }}
    >
      {children}
    </td>
  );
}
