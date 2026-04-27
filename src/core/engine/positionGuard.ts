import type { OrderRequest, RiskConfig, RiskDecision } from "./types";

export function guardStopLoss(
  order: OrderRequest,
  cfg: RiskConfig
): RiskDecision {
  if (!cfg.requireStopLoss || order.stopLoss) return { ok: true };
  return {
    ok: false,
    code: "SL_REQUIRED",
    message: "Stop Loss is mandatory."
  };
}

export function guardMaxRisk(
  order: OrderRequest,
  balance: number,
  cfg: RiskConfig,
  priceToMoney: (symbol: string, delta: number, volume: number) => number
): RiskDecision {
  const risk = priceToMoney(
    order.symbol,
    Math.abs(order.entryPrice - order.stopLoss),
    order.volume
  );

  if (risk > balance * cfg.maxRiskPct) {
    return {
      ok: false,
      code: "MAX_RISK",
      message: "Maximum risk exceeded."
    };
  }

  return { ok: true };
}
