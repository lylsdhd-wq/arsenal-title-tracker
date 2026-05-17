interface HeaderProps {
  /** 表示する「最終更新」のラベル（例: "AS OF 2026.05.18 — JST"） */
  asOfLabel: string;
  /** 優勝確率を再計算中かどうか（パルスドット表示用） */
  recomputing?: boolean;
}

/**
 * ページ最上部の極簡マストヘッド。
 * 左に Arsenal レッドの 3px 縦バー + モノラベル、
 * 右に最終更新の日付（必要なら再計算中のパルスドット）。
 */
export function Header({ asOfLabel, recomputing = false }: HeaderProps) {
  return (
    <header className="flex animate-fade-up items-center justify-between border-b border-ink-200 pb-5 pt-7">
      <div className="flex items-center gap-3">
        <span className="inline-block h-[18px] w-[3px] bg-arsenal" />
        <span className="tag text-ink-700">ARSENAL · TITLE TRACKER</span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-500">
        {recomputing && <span className="pulse-dot" aria-label="再計算中" />}
        <span>{asOfLabel}</span>
      </div>
    </header>
  );
}
