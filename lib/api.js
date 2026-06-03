// ============================
// API CONFIG — STORE READY
// ============================

const API_BASE_URL = "https://www.riffardfunded.com/api";

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      const error = new Error(data?.error || "Request failed.");
      error.status = res.status;
      error.code = data?.code || null;
      error.data = data || null;
      error.shouldOpenKyc = !!data?.shouldOpenKyc;
      error.kycStatus = data?.kycStatus || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timeout");
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================
// AUTH
// ============================

export async function loginRequest(email, password) {
  const data = await request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!data?.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  return data;
}

export async function logoutRequest(token) {
  return request("/logout", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getAccountRequest(token) {
  const data = await request("/accounts/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return data?.account || null;
}

// ============================
// MARKET
// ============================

export async function getInstrumentsRequest(token) {
  return request("/instruments", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getMarketQuotesRequest(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";

  return request(`/market/live${query}`, {
    method: "GET",
  });
}

export async function processMarketQuotesRequest(payload = {}) {
  return request("/market/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ============================
// TRADING
// ============================

export async function openTradeRequest(token, payload) {
  return request("/trades/open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function createOrderRequest(token, payload) {
  return request("/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getOpenPositionsRequest(token, fundedAccountId) {
  return request(
    `/positions/open?fundedAccountId=${encodeURIComponent(fundedAccountId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function getPositionHistoryRequest(token, fundedAccountId) {
  return request(
    `/positions/history?fundedAccountId=${encodeURIComponent(
      fundedAccountId
    )}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function modifyPositionRequest(token, payload) {
  return request("/positions/modify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function closePositionRequest(token, payload) {
  return request("/positions/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getPendingOrdersRequest(token, fundedAccountId) {
  return request(
    `/orders/pending?fundedAccountId=${encodeURIComponent(fundedAccountId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function cancelPendingOrderRequest(token, payload) {
  return request("/orders/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ============================
// RISK
// ============================

export async function sendRiskEquityRequest(token, payload) {
  return request("/risk/equity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ============================
// R-SCORE
// ============================

export async function getRScoreRequest(token) {
  return request("/rscore/latest", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================
// DEVICE
// ============================

export async function registerDeviceRequest(token, payload) {
  return request("/device/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ============================
// KYC
// ============================

export async function startDiditKycRequest(token, payload = {}) {
  return request("/kyc/didit/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getDiditKycStatusRequest(token) {
  return request("/kyc/didit/status", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================
// PAYOUTS
// ============================

export async function getPayoutBeneficiariesRequest(token) {
  return request("/payout-beneficiaries", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createPayoutBeneficiaryRequest(token, payload) {
  return request("/payout-beneficiaries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getPayoutStatusRequest(token, fundedAccountId) {
  return request(
    `/payouts/status?fundedAccountId=${encodeURIComponent(fundedAccountId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function createPayoutRequest(token, payload) {
  return request("/payouts/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getManualPayoutChecklistRequest(token, fundedAccountId) {
  return request(
    `/payouts/manual/checklist?fundedAccountId=${encodeURIComponent(
      fundedAccountId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export async function approvePayoutRequest(token, payoutId) {
  return request("/payouts/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payoutId }),
  });
}

export async function rejectPayoutRequest(token, payoutId, reason) {
  return request("/payouts/reject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payoutId, reason }),
  });
}

export async function markPayoutPaidRequest(
  token,
  payoutId,
  externalPayoutId = null
) {
  return request("/payouts/pay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payoutId, externalPayoutId }),
  });
}

// ============================
// ADMIN
// ============================

export async function getAdminAccountsRequest(token) {
  return request("/admin/accounts", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPayoutsRequest(token) {
  return request("/admin/payouts", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAnomaliesRequest(token) {
  return request("/admin/anomalies", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminReviewCasesRequest(token) {
  return request("/admin/review-cases", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminFraudSignalsRequest(token) {
  return request("/admin/fraud-signals", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function lockAccountRequest(token, payload) {
  return request("/admin/account-lock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function unlockAccountRequest(token, payload) {
  return request("/admin/account-unlock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminAuditLogsRequest(token) {
  return request("/admin/audit-logs", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminApiLogsRequest(token) {
  return request("/admin/api-logs", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminJobRunsRequest(token) {
  return request("/admin/job-runs", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMaintenanceStatusRequest(token) {
  return request("/admin/maintenance", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}