"use client";

import type { Match, MatchOutcome, PredictionMap } from "@/types/matches";
import type { RivalMatchGroup } from "@/lib/rival-matches";

/** UTC日時を日本時間の「M月D日(曜) HH:MM」形式の文字列にする */
function formatKickoff(utcDate: string): string {
  return new Date(utcDate).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MatchRowProps {
  match: Match;
  prediction: MatchOutcome | undefined;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
}

/**
 * 1試合分の予測 UI（日時・対戦カード・勝/分/敗ボタン）。
 * 選択中のボタンを再度押すと予測が解除される（未予測に戻る）。
 */
function MatchRow({ match, prediction, onPredict }: MatchRowProps) {
  // ホームチーム視点の3択（ホーム勝ち / 引分 / アウェイ勝ち）
  const options: { value: MatchOutcome; label: string }[] = [
    { value: "HOME", label: match.homeTeamShortName },
    { value: "DRAW", label: "引分" },
    { value: "AWAY", label: match.awayTeamShortName },
  ];

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          {match.matchday !== null && `第${match.matchday}節 ・ `}
          {formatKickoff(match.utcDate)}
        </span>
        {prediction === undefined && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-500">
            未予測
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 text-right text-sm font-medium">
          {match.homeTeamName}
        </span>

        <div className="flex gap-1">
          {options.map((option) => {
            const selected = prediction === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPredict(match.id, option.value)}
                aria-pressed={selected}
                className={
                  "min-w-[3.25rem] rounded px-2 py-1 text-xs font-semibold transition-colors " +
                  (selected
                    ? "bg-arsenal text-white"
                    : "border border-gray-300 text-gray-700 hover:border-arsenal hover:text-arsenal")
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <span className="flex-1 text-left text-sm font-medium">
          {match.awayTeamName}
        </span>
      </div>
    </li>
  );
}

interface MatchPredictorProps {
  matches: Match[];
  predictions: PredictionMap;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
}

/**
 * 試合のリストを表示し、各試合の勝敗をユーザーが予測できる UI。
 * 予測状態は親（page.tsx）が useState で管理し、本コンポーネントは表示と通知に専念する。
 */
export function MatchPredictor({
  matches,
  predictions,
  onPredict,
}: MatchPredictorProps) {
  if (matches.length === 0) {
    return <p className="text-gray-500">残り試合はありません。</p>;
  }

  return (
    <ul className="space-y-2">
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

interface RivalMatchPredictorProps {
  groups: RivalMatchGroup[];
  predictions: PredictionMap;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
}

/**
 * 優勝争いのライバルチームの残り試合を、チームごとにまとめて予測できる UI。
 * グループ分けと重複排除は buildRivalMatchGroups（呼び出し側）で済ませておく。
 */
export function RivalMatchPredictor({
  groups,
  predictions,
  onPredict,
}: RivalMatchPredictorProps) {
  if (groups.length === 0) {
    return (
      <p className="text-gray-500">予測できるライバルの試合はありません。</p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.teamId}>
          <h3 className="mb-2 text-sm font-bold text-gray-700">
            {group.teamName}
          </h3>
          <ul className="space-y-2">
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
      ))}
    </div>
  );
}
