"use client";

import type { Match, MatchOutcome, PredictionMap } from "@/types/matches";

interface MatchPredictorProps {
  matches: Match[];
  predictions: PredictionMap;
  onPredict: (matchId: number, outcome: MatchOutcome) => void;
}

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

/**
 * アーセナルの残り試合を一覧表示し、各試合の勝敗をユーザーが予測できる UI。
 * 予測状態は親（page.tsx）が useState で管理し、本コンポーネントは表示と通知に専念する。
 * 選択中のボタンを再度押すと予測が解除される（未予測に戻る）。
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
      {matches.map((match) => {
        const prediction = predictions[match.id];
        // ホームチーム視点の3択（ホーム勝ち / 引分 / アウェイ勝ち）
        const options: { value: MatchOutcome; label: string }[] = [
          { value: "HOME", label: match.homeTeamShortName },
          { value: "DRAW", label: "引分" },
          { value: "AWAY", label: match.awayTeamShortName },
        ];

        return (
          <li
            key={match.id}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
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
      })}
    </ul>
  );
}
