// src/services/api.js
// VERSION TERMINAL — ALIGNÉE AVEC RIFFARD ACCESS & INSTITUTIONAL
// ✅ Access
// ✅ Institutional (observation only)
// ⚠️ Toujours MOCK tant que le vrai backend terminal n’est pas branché

const wait = (ms = 400) => new Promise((res) => setTimeout(res, ms));

/**
 * =========================================
 * AUTH
 * =========================================
 */
export async function loginRequest(email, password) {
  await wait();

  // ⚠️ MOCK : plus tard relié à /api/auth/login
  return {
    token: "MOCK_TOKEN_RIFFARD",
    account: {
      id: "ACC-ACCESS-100K",
      type: "ACCESS", // ACCESS | INSTITUTIONAL
      balance: 100000,
      equity: 100000,
      dailyLossPercent: 0,
      cooldownActive: false,
      drawdownLocked: false,
      observationOnly: false
    }
  };
}

export async function getAccountRequest(token) {
  await wait();

  // ⚠️ MOCK — à remplacer par fetch backend
  return {
    id: "ACC-ACCESS-100K",
    type: "ACCESS", // ACCESS | INSTITUTIONAL
    balance: 100000,
    equity: 100420,
    dailyLossPercent: 0.3,
    cooldownActive: false,
    drawdownLocked: false,
    observationOnly: false
  };
}

/**
 * =========================================
 * MARCHÉS
 * =========================================
 */
export async function getMarketsRequest(token) {
  await wait();
  return [
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "BTCUSD",
    "ETHUSD",
    "NAS100",
    "SP500"
  ];
}

export async function getCandlesRequest(token, symbol, timeframe = "M15") {
  await wait();

  const now = Date.now();
  return Array.from({ length: 40 }).map((_, i) => {
    const t = now - (40 - i) * 60 * 1000;
    const base = 100 + i * 0.6;
    return {
      time: t,
      open: base,
      high: base + 1.5,
      low: base - 1.5,
      close: base + (i % 2 ? 0.8 : -0.6)
    };
  });
}

/**
 * =========================================
 * TRADING
 * =========================================
 */
export async function openTradeRequest(token, payload) {
  await wait();

  return {
    id: "TRADE-" + Math.floor(Math.random() * 100000),
    ...payload,
    status: "OPEN",
    openedAt: Date.now()
  };
}

export async function closeTradeRequest(token, tradeId) {
  await wait();

  return {
    success: true,
    id: tradeId,
    closedAt: Date.now()
  };
}

export async function getTradesRequest(token) {
  await wait();

  return [
    {
      id: "T-1",
      symbol: "XAUUSD",
      side: "BUY",
      lot: 3,
      pnl: 4200,
      openedAt: Date.now() - 3600 * 1000,
      closedAt: Date.now() - 1200 * 1000
    },
    {
      id: "T-2",
      symbol: "NAS100",
      side: "SELL",
      lot: 2,
      pnl: -1800,
      openedAt: Date.now() - 7200 * 1000,
      closedAt: Date.now() - 4000 * 1000
    }
  ];
}

/**
 * =========================================
 * PAYOUTS — ACCESS ONLY
 * =========================================
 */
export async function getPayoutsRequest(token) {
  await wait();

  return [
    {
      id: "P-ACCESS-1",
      date: "2025-11-01",
      grossAmount: 12000,
      netAmount: 12000,
      status: "Paid"
    }
  ];
}

/**
 * =========================================
 * UPGRADES ACCESS
 * =========================================
 */
export async function getUpgradesRequest(token) {
  await wait();

  return [
    { from: "100K", to: "250K", price: 29.99 },
    { from: "250K", to: "500K", price: 59.99 },
    { from: "500K", to: "1M", price: 79.99 }
  ];
}

export async function createUpgradeRequest(token, payload) {
  await wait();

  return {
    success: true,
    ...payload
  };
}
