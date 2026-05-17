import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vitest 設定: jsdom 環境で React コンポーネントと純粋関数の両方をテストする
export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig の "@/*" エイリアスをテストでも解決できるようにする
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
