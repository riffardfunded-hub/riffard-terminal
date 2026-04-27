export type Side = "BUY" | "SELL";

export type OrderRequest = {
  symbol: string;
  side: Side;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number;
  volume: number;
};

export type AccountState = {
  startingBalance: number;
  balance: number;
  equity: number;
  realizedPnlToday: number;
  floatingPnl: number;
  lockedUntilTs: number | null;
  lastEquityTs: number;
};

export type RiskConfig = {
  dailyLossPct: number;
  maxRiskPct: number;
  requireStopLoss: boolean;
  resetOnZeroBalance: boolean;
};

export type RiskDecision =
  | { ok: true }
  | { ok: false; code: string; message: string; meta?: any };
