interface FooterProps {
  /** 予測リセットボタンの押下ハンドラ */
  onReset: () => void;
  /** ボタンを有効にするかどうか（予測が1つ以上あるなら true） */
  hasPredictions: boolean;
}

/**
 * ページ下部のフッター。
 * 左にエピグラフ + メタ情報、右に予測リセットボタン。
 */
export function Footer({ onReset, hasPredictions }: FooterProps) {
  return (
    <footer className="mt-24 flex flex-col gap-3.5 border-t border-ink-200 pb-14 pt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p
            className="font-display text-[14px] italic text-ink-600"
            style={{ fontVariationSettings: '"opsz" 14' }}
          >
            “Football, bloody hell.”
          </p>
          <p className="tag mt-2">
            DATA — FOOTBALL-DATA.ORG · 10,000 RUNS · 60S REFRESH
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!hasPredictions}
          className={`pb-0.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
            hasPredictions
              ? "cursor-pointer border-b border-arsenal text-arsenal"
              : "cursor-not-allowed border-b border-transparent text-ink-300"
          }`}
        >
          ⟲ Reset predictions
        </button>
      </div>
    </footer>
  );
}
