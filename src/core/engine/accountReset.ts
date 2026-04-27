import type { AccountState, RiskConfig } from "./types";

export function shouldResetOnZero(state: AccountState, cfg: RiskConfig): boolean {
  return cfg.resetOnZeroBalance && state.balance <= 0;
}

export function resetToStartingBalance(state: AccountState): AccountState {
  return {
    ...state,
    balance: state.startingBalance,
    equity: state.startingBalance,
  };
}
