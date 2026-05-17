import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 紙のような暖色オフホワイト
        paper: {
          DEFAULT: "#FBFAF6",
          2: "#F4F1E8",
        },
        // 暖色グレースケール（インク）
        ink: {
          50: "#F3EEE2",
          100: "#ECE7DA",
          200: "#D9D3C6",
          300: "#B8B0A1",
          400: "#8E867A",
          500: "#756E62",
          600: "#57524A",
          700: "#2B2722",
          900: "#14110D",
        },
        // アーセナルのアクセントカラー
        arsenal: {
          DEFAULT: "#EF0107",
          dim: "#B00109",
        },
      },
      fontFamily: {
        // 衬線ディスプレイ（巨大な数字・見出し）
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        // 本文・UI（日本語はシステムフォントにフォールバック）
        sans: [
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          "system-ui",
          "sans-serif",
        ],
        // タグ・日付・数値注釈
        mono: ["var(--font-jetbrains)", "Menlo", "monospace"],
      },
      letterSpacing: {
        tag: "0.1em",
      },
      keyframes: {
        rule: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%": { boxShadow: "0 0 0 0 rgba(239,1,7,0.45)" },
          "70%": { boxShadow: "0 0 0 8px rgba(239,1,7,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(239,1,7,0)" },
        },
      },
      animation: {
        rule: "rule 900ms cubic-bezier(0.2, 0.7, 0.1, 1) 200ms both",
        "fade-up": "fadeUp 700ms cubic-bezier(0.2, 0.7, 0.1, 1) both",
        "pulse-dot": "pulseDot 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
