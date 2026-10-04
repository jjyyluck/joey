/** Pure ranking formulas. Kept free of I/O so they can be unit-tested. */

export const WEEK_WEIGHTS = { read: 1, finish: 3, comment: 2, bookmark: 2, like: 2 } as const;

export function weekHeat(x: { reads: number; finishes: number; comments: number; bookmarks: number; likes?: number }): number {
  return (
    x.reads * WEEK_WEIGHTS.read +
    x.finishes * WEEK_WEIGHTS.finish +
    x.comments * WEEK_WEIGHTS.comment +
    x.bookmarks * WEEK_WEIGHTS.bookmark +
    (x.likes ?? 0) * WEEK_WEIGHTS.like
  );
}

/**
 * Bayesian average on a 10-point scale: (v·R + m·C) / (v + m).
 * v = votes for this story, R = its mean, C = site-wide mean, m = prior weight.
 */
export function bayesian(v: number, R: number, C: number, m: number): number {
  if (v + m === 0) return 0;
  return (v * R + m * C) / (v + m);
}

/** Praise score: Bayesian rating nudged by completion rate (0.9x at 0% … 1.1x at 100%). */
export function praiseScore(b: number, completion: number): number {
  const c = Math.min(1, Math.max(0, completion));
  return b * (0.9 + 0.2 * c);
}
