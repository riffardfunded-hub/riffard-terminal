import type { BehaviorEvent } from "./types";

export function fastClickScore(events: BehaviorEvent[]): number {
  if (events.length < 5) return 0;
  let score = 0;
  for (let i = 1; i < events.length; i++) {
    if (events[i].t - events[i - 1].t < 150) score += 10;
  }
  return score;
}
