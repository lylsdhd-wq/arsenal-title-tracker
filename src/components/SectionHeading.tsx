interface SectionHeadingProps {
  /** 章番号（例: "01"） */
  index: string;
  /** 大文字英タイトル（例: "PREDICTED FINAL TABLE"） */
  en: string;
  /** 大見出し（日本語、Fraunces で大きく） */
  jp: string;
  /** 補足説明（任意） */
  sub?: string;
}

/**
 * 各セクションの見出し。
 * 上に小さくモノラベル（章番号 + 英タイトル）、その下に Fraunces の日本語大見出し、
 * さらにその下にトーンを落とした補足文という3層構造。
 */
export function SectionHeading({ index, en, jp, sub }: SectionHeadingProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-[11px] tracking-[0.1em] text-ink-400">
          {index}
        </span>
        <span className="tag">{en}</span>
      </div>
      <h2
        className="font-display text-[32px] font-normal leading-[1.1] tracking-[-0.01em] text-ink-900"
        style={{ fontVariationSettings: '"opsz" 96' }}
      >
        {jp}
      </h2>
      {sub && (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{sub}</p>
      )}
    </div>
  );
}
