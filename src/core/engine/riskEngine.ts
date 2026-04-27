import { resetToStartingBalance, shouldResetOnZero } from "./accountReset";
import {
  isLockedNow,
  loadAccountState,
  lockUntilTomorrow,
  rolloverIfNewDay,
  saveAccountState,
  shouldTriggerDailyLock,
} from "./dailyLossWatcher";
import { guardMaxRisk, guardStopLoss } from "./positionGuard";
import type { OrderRequest, RiskConfig, RiskDecision } from "./types";

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  dailyLossPct: 0.01,
  maxRiskPct: 0.005,
  requireStopLoss: true,
  resetOnZeroBalance: true,
};

export type RiskState = {
  locked: boolean;
  lockedUntilTs: number | null;
};

export class RiskEngine {
  constructor(
    private startingBalance: number,
    private priceToMoney: (symbol: string, delta: number, volume: number) => number,
    private cfg: RiskConfig = DEFAULT_RISK_CONFIG
  ) {}

  /**
   * 🧱 ORDER GUARD (avant ouverture de trade)
   */
  async canPlaceOrder(order: OrderRequest): Promise<RiskDecision> {
    let state = await loadAccountState(this.startingBalance);
    state = await rolloverIfNewDay(state);

    if (isLockedNow(state)) {
      return { ok: false, code: "DAILY_LOCK", message: "Compte bloqué (daily loss)." };
    }

    const sl = guardStopLoss(order, this.cfg);
    if (!sl.ok) return sl;

    const risk = guardMaxRisk(order, state.balance, this.cfg, this.priceToMoney);
    if (!risk.ok) return risk;

    if (shouldTriggerDailyLock(state, this.cfg)) {
      state = lockUntilTomorrow(state);
      await saveAccountState(state);
      return { ok: false, code: "DAILY_LOCK", message: "Daily loss atteint." };
    }

    if (shouldResetOnZero(state, this.cfg)) {
      state = resetToStartingBalance(state);
      await saveAccountState(state);
    }

    return { ok: true };
  }

  /**
   * 🔥 LIVE EQUITY UPDATE
   * Utilisé par le terminal (PnL flottant → lock daily)
   */
  async updateEquity(
    equity: number,
    floatingPnl: number
  ): Promise<RiskState> {
    let state = await loadAccountState(this.startingBalance);
    state = await rolloverIfNewDay(state);

    // equity réelle (backend-ready)
    state.equity = equity;
    state.floatingPnl = floatingPnl;

    // déjà locké
    if (isLockedNow(state)) {
      return {
        locked: true,
        lockedUntilTs: state.lockedUntilTs ?? null,
      };
    }

    // déclenchement daily loss
    if (shouldTriggerDailyLock(state, this.cfg)) {
      state = lockUntilTomorrow(state);
      await saveAccountState(state);

      return {
        locked: true,
        lockedUntilTs: state.lockedUntilTs ?? null,
      };
    }

    // reset si balance = 0 (Access rule)
    if (shouldResetOnZero(state, this.cfg)) {
      state = resetToStartingBalance(state);
    }

    await saveAccountState(state);

    return {
      locked: false,
      lockedUntilTs: null,
    };
  }
}
