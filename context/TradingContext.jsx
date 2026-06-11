import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import EventSource from "react-native-sse";

import {
  getAccountRequest,
  getOpenPositionsRequest,
  getRScoreRequest,
  sendRiskEquityRequest,
} from "../lib/api";

import { useAuth } from "./AuthContext";

const TradingContext = createContext(null);

const MARKET_STREAM_URL = "https://www.riffardfunded.com/api/market/stream";
const TRADING_STREAM_URL = "https://www.riffardfunded.com/api/trading/stream";
const RSCORE_REFRESH_INTERVAL = 60000;
const RISK_SYNC_INTERVAL = 10000;
const ACCOUNT_REFRESH_INTERVAL = 15000;
const POSITIONS_REFRESH_INTERVAL = 15000;

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSymbol(value) {
  return String(value || "").replace("/", "").toUpperCase();
}

function applyQuoteToPrices(prev, quote) {
  const price = safeNumber(quote?.price);

  if (price === null || price <= 0) return prev;

  const rawSymbol = String(quote.symbol || "");
  const normalized = normalizeSymbol(rawSymbol);

  return {
    ...prev,
    [normalized]: price,
    [rawSymbol]: price,
    [rawSymbol.toUpperCase()]: price,
  };
}

export function TradingProvider({ children }) {
  const { token, account } = useAuth();

  const [prices, setPrices] = useState({});
  const [livePositions, setLivePositions] = useState([]);

  const [balance, setBalance] = useState(null);
  const [equity, setEquity] = useState(null);
  const [initialBalance, setInitialBalance] = useState(null);
  const [startOfDayBalance, setStartOfDayBalance] = useState(null);
  const [unrealizedPnl, setUnrealizedPnl] = useState(null);

  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [drawdownLocked, setDrawdownLocked] = useState(false);
  const [accountClosed, setAccountClosed] = useState(false);
  const [serverAccountStatus, setServerAccountStatus] = useState("ACTIVE");
  const [payoutHold, setPayoutHold] = useState(false);

  const [dailyLossPercent, setDailyLossPercent] = useState(null);
  const [drawdownPercent, setDrawdownPercent] = useState(null);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(null);

  const [accountType, setAccountType] = useState("access");
  const [rScore, setRScore] = useState(null);

  const equityRef = useRef(equity);
  const unrealizedPnlRef = useRef(unrealizedPnl);

  useEffect(() => {
    equityRef.current = equity;
  }, [equity]);

  useEffect(() => {
    unrealizedPnlRef.current = unrealizedPnl;
  }, [unrealizedPnl]);

  useEffect(() => {
    if (!account) return;

    const nextBalance = safeNumber(account.balance);
    const nextEquity = safeNumber(account.equity) ?? nextBalance;

    const nextInitial =
      safeNumber(account.initialBalance) ??
      safeNumber(account.size) ??
      nextBalance;

    const nextStartDay =
      safeNumber(account.startOfDayBalance) ??
      safeNumber(account.start_of_day_balance) ??
      nextBalance;

    const status = String(
      account.accountStatus || account.status || "ACTIVE"
    ).toUpperCase();

    setBalance(nextBalance);
    setEquity(nextEquity);
    setInitialBalance(nextInitial);
    setStartOfDayBalance(nextStartDay);

    if (nextEquity !== null && nextBalance !== null) {
      setUnrealizedPnl(Number((nextEquity - nextBalance).toFixed(2)));
    }

    setServerAccountStatus(status);
    setAccountType(String(account.type || "access").toLowerCase());
    setMaxDrawdownPercent(safeNumber(account.drawdownLimit));

    setDrawdownLocked(status !== "ACTIVE");
    setAccountClosed(status === "CLOSED");
  }, [account]);

  // ============================
  // MARKET STREAM
  // ============================
  useEffect(() => {
    if (!token || !account?.id) return;

    const es = new EventSource(MARKET_STREAM_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data?.type === "snapshot" && Array.isArray(data.quotes)) {
          setPrices((prev) => {
            let next = { ...prev };

            data.quotes.forEach((quote) => {
              next = applyQuoteToPrices(next, quote);
            });

            return next;
          });

          return;
        }

        if (data?.type === "quote" && data.quote) {
          setPrices((prev) => applyQuoteToPrices(prev, data.quote));
        }
      } catch (e) {
        console.log("Market stream parse failed", e);
      }
    });

    es.addEventListener("error", (event) => {
      console.log("Market stream error", event);
    });

    return () => {
      es.close();
    };
  }, [token, account?.id]);

  // ============================
// INITIAL OPEN POSITIONS LOAD
// ============================
useEffect(() => {
  if (!token || !account?.id) return;

  let mounted = true;

  async function loadOpenPositions() {
    try {
      const res = await getOpenPositionsRequest(
        token,
        account.id
      );

      if (!mounted) return;

      setLivePositions(
        Array.isArray(res?.positions)
          ? res.positions
          : []
      );
    } catch (e) {
      console.log(
        "OPEN POSITIONS LOAD ERROR",
        e
      );
    }
  }

  loadOpenPositions();

  const interval = setInterval(
    loadOpenPositions,
    POSITIONS_REFRESH_INTERVAL
  );

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, [token, account?.id]);

  // ============================
  // TRADING STREAM — POSITIONS / PNL
  // ============================
  useEffect(() => {
    if (!token || !account?.id) return;

    const url = `${TRADING_STREAM_URL}?fundedAccountId=${encodeURIComponent(
      account.id
    )}`;

    const es = new EventSource(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data?.type === "positions_snapshot") {
          const positions = Array.isArray(data.positions) ? data.positions : [];

          setLivePositions(positions);

          const totalUnrealized = safeNumber(data.totalUnrealizedPnl) ?? 0;
          setUnrealizedPnl(totalUnrealized);

          if (balance !== null) {
            setEquity(Number((balance + totalUnrealized).toFixed(2)));
          }
        }
      } catch (e) {
        console.log("Trading stream parse failed", e);
      }
    });

    es.addEventListener("error", (event) => {
      console.log("Trading stream error", event);
    });

    return () => {
      es.close();
    };
  }, [token, account?.id, balance]);

  // ============================
  // R-SCORE
  // ============================
  useEffect(() => {
    if (!token || !account?.id) return;

    let mounted = true;
    let inFlight = false;

    async function loadRScore() {
      if (inFlight) return;

      try {
        inFlight = true;
        const res = await getRScoreRequest(token);

        if (!mounted) return;

        setRScore(safeNumber(res?.score));
      } catch {
        if (mounted) setRScore(null);
      } finally {
        inFlight = false;
      }
    }

    loadRScore();

    const interval = setInterval(loadRScore, RSCORE_REFRESH_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, account?.id]);

  // ============================
  // INSTITUTIONAL REFRESH
  // ============================
  useEffect(() => {
    if (!token || !account?.id) return;

    const isInstitutional =
      accountType === "institutional" ||
      accountType === "institutional_selection";

    if (!isInstitutional) return;

    let mounted = true;
    let inFlight = false;

    async function refreshAccount() {
      if (inFlight) return;

      try {
        inFlight = true;

        const acc = await getAccountRequest(token);

        if (!mounted || !acc) return;

        const nextBalance = safeNumber(acc.balance);
        const nextEquity = safeNumber(acc.equity) ?? nextBalance;

        if (nextBalance !== null) setBalance(nextBalance);
        if (nextEquity !== null) setEquity(nextEquity);

        if (nextEquity !== null && nextBalance !== null) {
          setUnrealizedPnl(Number((nextEquity - nextBalance).toFixed(2)));
        }

        if (typeof acc.rScore !== "undefined") {
          setRScore(safeNumber(acc.rScore));
        }

        setCooldownActive(false);
        setCooldownUntil(null);
        setPayoutHold(false);
        setDailyLossPercent(null);
        setDrawdownPercent(null);
      } catch (e) {
        console.log("Institutional refresh failed", e);
      } finally {
        inFlight = false;
      }
    }

    refreshAccount();

    const interval = setInterval(refreshAccount, ACCOUNT_REFRESH_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, account?.id, accountType]);

  // ============================
  // ACCESS RISK SYNC
  // ============================
  useEffect(() => {
    if (!token || !account?.id) return;

    const isInstitutional =
      accountType === "institutional" ||
      accountType === "institutional_selection";

    if (isInstitutional) return;

    let mounted = true;
    let inFlight = false;

    async function syncRisk() {
      if (inFlight) return;

      try {
        inFlight = true;

        const result = await sendRiskEquityRequest(token, {
          fundedAccountId: account.id,
          equity: equityRef.current,
          floatingPnl: unrealizedPnlRef.current,
        });

        if (!mounted) return;

        setDailyLossPercent(safeNumber(result?.dailyLossPct));
        setDrawdownPercent(safeNumber(result?.drawdownPct));

        if (result?.maxDrawdownLimitPct !== undefined) {
          setMaxDrawdownPercent(safeNumber(result.maxDrawdownLimitPct));
        }

        const status = String(
          result?.accountStatus || result?.status || "ACTIVE"
        ).toUpperCase();

        setServerAccountStatus(status);
        setDrawdownLocked(status !== "ACTIVE");
        setAccountClosed(status === "CLOSED");
        setPayoutHold(!!result?.payoutHold);

        if (result?.lockedUntilTs) {
          setCooldownActive(true);
          setCooldownUntil(new Date(result.lockedUntilTs).getTime());
        } else {
          setCooldownActive(false);
          setCooldownUntil(null);
        }
      } catch (e) {
        console.log("Risk sync failed", e);
      } finally {
        inFlight = false;
      }
    }

    syncRisk();

    const interval = setInterval(syncRisk, RISK_SYNC_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, account?.id, accountType]);

  const value = useMemo(
    () => ({
      prices,
      livePositions,

      balance,
      equity,
      initialBalance,
      startOfDayBalance,
      unrealizedPnl,

      cooldownActive,
      cooldownUntil,
      drawdownLocked,
      accountClosed,
      serverAccountStatus,
      payoutHold,

      dailyLossPercent,
      drawdownPercent,
      maxDrawdownPercent,
      accountType,
      rScore,

      setPrices,
      setLivePositions,
      setBalance,
      setEquity,
      setInitialBalance,
      setUnrealizedPnl,
    }),
    [
      prices,
      livePositions,
      balance,
      equity,
      initialBalance,
      startOfDayBalance,
      unrealizedPnl,
      cooldownActive,
      cooldownUntil,
      drawdownLocked,
      accountClosed,
      serverAccountStatus,
      payoutHold,
      dailyLossPercent,
      drawdownPercent,
      maxDrawdownPercent,
      accountType,
      rScore,
    ]
  );

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  return useContext(TradingContext);
}