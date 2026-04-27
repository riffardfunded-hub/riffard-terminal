import { fastClickScore } from "./patternAnalyzer";
import type { AnomalyResult, BehaviorSnapshot } from "./types";

export function scoreBehavior(snap: BehaviorSnapshot): AnomalyResult {
  const score = Math.min(100, fastClickScore(snap.events));
  return { score };
}
