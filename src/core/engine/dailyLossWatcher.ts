import { kvGet, kvSet } from "../storage/kv";
import { getLocalDayKey, getTomorrowStartTs } from "../time/dayKey";
import type { AccountState, RiskConfig } from "./types";

const KEY = "riffard:accountState:v1";
const DAY_KEY = "riffard:dayKey:v1";

export async function loadAccountState(startingBalance: number): Promise<AccountState> {
  const fallback: AccountState = {
    startingBalance,
    balance: startingBalance,
    equity: startingBalance,
    realizedPnlToday: 0,
    floatingPnl: 0,
    lockedUntilTs: null,
    lastEquityTs: Date.now(),
  };

  const st = await kvGet<AccountState>(KEY, fallback);
  if (!st.startingBalance) st.startingBalance = startingBalance;
  return st;
}

export async function saveAccountState(state: AccountState): Promise<void> {
  await kvSet(KEY, state);
}

export async function rolloverIfNewDay(state: AccountState): Promise<AccountState> {
  const today = getLocalDayKey();
  const saved = await kvGet<string>(DAY_KEY, "");
  if (saved !== today) {
    await kvSet(DAY_KEY, today);
    return { ...state, realizedPnlToday: 0, lockedUntilTs: null };
  }
  return state;
}

export function computeDailyLossPct(state: AccountState): number {
  const realized = Math.min(0, state.realizedPnlToday);
  const floating = Math.min(0, state.floatingPnl);
  return (Math.abs(realized) + Math.abs(floating)) / state.startingBalance;
}

export function shouldTriggerDailyLock(state: AccountState, cfg: RiskConfig): boolean {
  return computeDailyLossPct(state) >= cfg.dailyLossPct;
}

export function lockUntilTomorrow(state: AccountState): AccountState {
  return { ...state, lockedUntilTs: getTomorrowStartTs() };
}

export function isLockedNow(state: AccountState): boolean {
  return !!(state.lockedUntilTs && Date.now() < state.lockedUntilTs);
}
