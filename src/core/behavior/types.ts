export type BehaviorEvent =
  | { t: number; type: "CLICK" }
  | { t: number; type: "PLACE_ORDER"; risk: number };

export type BehaviorSnapshot = {
  events: BehaviorEvent[];
};

export type AnomalyResult = {
  score: number;
};
