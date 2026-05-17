"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 数値が変わったときに、滑らかにイージングしてターゲット値へ遷移するフック。
 * 巨大な優勝確率の数字を予測変更のたびに気持ちよく動かすために使う。
 *
 * - duration: ミリ秒。デフォルト 700ms。
 * - 差が極小（0.05 未満）のときはアニメーションせず即座に反映する。
 */
export function useAnimatedNumber(target: number, duration = 700): number {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    const from = value;
    const to = target;
    if (Math.abs(to - from) < 0.05) {
      setValue(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setValue(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
