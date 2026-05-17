"use client";

import type { Match, MatchOutcome, PredictionMap } from "@/types/matches";
import type { RivalMatchGroup } from "@/lib/rival-matches";
import { getTeamColor } from "@/components/team-colors";

/** "5.23 SAT" 形式（日本時間） */
function formatKickoffShort(utcDate: string): string {
  const d = new Date(utcDate);
  const m = d.toLocaleString("en-US", {
    month: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const day = d.toLocaleString("en-US", {
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const wd = d
    .toLocaleString("en-US", { weekday: "short", timeZone: "Asia/Tokyo" })
    .toUpperCase();
  return `${m}.${day} ${wd}`;
}

/** "23:00" 形式（日本時間） */
function formatKickoffTime(utcDate: string): string {
  return new Date(utcDate).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// MatchRow — 1試合分の予測UI
// ---------------------------------------------------------------------------
interface MatchRowProps {
  match: Match;
  prediction: MatchOutcome | undefined;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
  /** 試合がシミュレーションに影響しない（失格チーム同士など）場合は薄く表示 */
  disabled?: boolean;
}

function MatchRow({
  match,
  prediction,
  onPredict,
  disabled = false,
}: MatchRowProps) {
  const options: { value: MatchOutcome; label: string; title: string }[] = [
    {
      value: "HOME",
      label: "ホーム勝",
      title: `${match.homeTeamShortName} 勝ち`,
    },
    { value: "DRAW", label: "引分", title: "引き分け" },
    {
      value: "AWAY",
      label: "アウェイ勝",
      title: `${match.awayTeamShortName} 勝ち`,
    },
  ];

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-ink-100 py-[18px] ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="mb-2 flex gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400">
          {match.matchday !== null && <span>第{match.matchday}節</span>}
          <span>·</span>
          <span>{formatKickoffShort(match.utcDate)}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {formatKickoffTime(match.utcDate)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <TeamLabel
            short={match.homeTeamShortName}
            color={getTeamColor(match.homeTeamId)}
            highlight={prediction === "HOME"}
          />
          <span className="text-[12px] text-ink-300">vs</span>
          <TeamLabel
            short={match.awayTeamShortName}
            color={getTeamColor(match.awayTeamId)}
            highlight={prediction === "AWAY"}
          />
        </div>
      </div>

      <div className="pred-group" role="group" aria-label="予測">
        {options.map((opt) => {
          const selected = prediction === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className="pred-btn"
              data-active={selected ? "true" : "false"}
              aria-pressed={selected}
              title={opt.title}
              disabled={disabled}
              onClick={() => !disabled && onPredict(match.id, opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}

interface TeamLabelProps {
  short: string;
  color: string;
  highlight: boolean;
}
function TeamLabel({ short, color, highlight }: TeamLabelProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="team-chip" style={{ background: color }} />
      <span
        className={`whitespace-nowrap font-display text-[18px] font-normal transition-[color,font-style] duration-200 ${
          highlight ? "italic text-arsenal" : "text-ink-900"
        }`}
        style={{ fontVariationSettings: '"opsz" 36', letterSpacing: "-0.005em" }}
      >
        {short}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// MatchPredictor — アーセナルの残り試合
// ---------------------------------------------------------------------------
interface MatchPredictorProps {
  matches: Match[];
  predictions: PredictionMap;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
}

/**
 * 試合のリストを表示し、各試合の勝敗をユーザーが予測できる UI。
 * 予測状態は親（page.tsx）が useState で管理する。
 */
export function MatchPredictor({
  matches,
  predictions,
  onPredict,
}: MatchPredictorProps) {
  if (matches.length === 0) {
    return <p className="text-ink-500">残り試合はありません。</p>;
  }
  return (
    <ul>
      {matches.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          prediction={predictions[match.id]}
          onPredict={onPredict}
        />
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// RivalMatchPredictor — チームごとにまとめたライバルの残り試合
// ---------------------------------------------------------------------------
interface RivalMatchPredictorProps {
  groups: RivalMatchGroup[];
  predictions: PredictionMap;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
  /**
   * 数学的にまだ優勝可能性が残っているチームの ID 集合。
   * page.tsx で getLiveContenderIds の結果を渡す。
   */
  liveIds: Set<number>;
  /** 各チームの予測済み試合数（このセクション内のカウンタ表示用） */
  predictionsCountByTeam: Record<number, number>;
}

/**
 * 優勝争いのライバルチームの残り試合を、チームごとにまとめて予測できる UI。
 * グループ分けと重複排除は buildRivalMatchGroups（呼び出し側）で済ませておく。
 */
export function RivalMatchPredictor({
  groups,
  predictions,
  onPredict,
  liveIds,
  predictionsCountByTeam,
}: RivalMatchPredictorProps) {
  if (groups.length === 0) {
    return (
      <p className="text-ink-500">予測できるライバルの試合はありません。</p>
    );
  }

  return (
    <div className="flex flex-col gap-11">
      {groups.map((group) => {
        const alive = liveIds.has(group.teamId);
        const count = predictionsCountByTeam[group.teamId] ?? 0;
        const teamColor = getTeamColor(group.teamId);
        // group.teamName からあわせて short 表示用の名前を作る
        const teamShort = group.teamName.replace(/\s*FC$/, "");

        return (
          <div key={group.teamId}>
            <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="team-chip team-chip-lg"
                  style={{ background: teamColor }}
                />
                <h3
                  className={`font-display text-[22px] font-medium tracking-[-0.005em] ${
                    alive ? "text-ink-900" : "text-ink-400 line-through"
                  }`}
                  style={{ fontVariationSettings: '"opsz" 60' }}
                >
                  {teamShort}
                </h3>
                <span
                  className={alive ? "badge badge-alive" : "badge badge-dead"}
                >
                  {alive ? "ALIVE" : "ELIMINATED"}
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-400">
                {group.matches.length} matches · {count} predicted
              </span>
            </div>

            {!alive && (
              <p className="mb-3 text-[12px] leading-relaxed text-ink-500">
                残り試合を全勝してもアーセナルの現在勝点に届かないため、シミュレーションでは引き分け固定として扱われます。
              </p>
            )}

            <ul>
              {group.matches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onPredict={onPredict}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
