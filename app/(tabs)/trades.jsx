import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundVideo from "../../components/BackgroundVideo";
import { useAuth } from "../../context/AuthContext";
import { useTrading } from "../../context/TradingContext";
import {
  cancelPendingOrderRequest,
  closePositionRequest,
  getPendingOrdersRequest,
  modifyPositionRequest,
} from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

function normalizeNumericInput(value) {
  return String(value || "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
}

function toNumber(value, fallback = 0) {
  const n = Number(
    String(value ?? "")
      .replace(",", ".")
      .trim()
  );
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSymbol(value) {
  return String(value || "").replace("/", "").toUpperCase();
}

function getPositionInstrument(position) {
  return position?.instrument || position?.instruments || null;
}

function getOrderInstrument(order) {
  return order?.instrument || order?.instruments || null;
}

function getPositionEntryPrice(position) {
  return toNumber(position?.entryPrice ?? position?.entry_price, 0);
}

function getPositionMarkPrice(position) {
  return toNumber(
    position?.markPrice ?? position?.mark_price,
    getPositionEntryPrice(position)
  );
}

function getPositionOpenVolume(position) {
  return toNumber(position?.openVolume ?? position?.open_volume, 0);
}

function getPositionStopLoss(position) {
  const value = position?.stopLoss ?? position?.stop_loss;
  return value == null ? null : toNumber(value, 0);
}

function getPositionTakeProfit(position) {
  const value = position?.takeProfit ?? position?.take_profit;
  return value == null ? null : toNumber(value, 0);
}

function getLivePrice(prices, symbol, fallback) {
  const raw = String(symbol || "");
  const normalized = normalizeSymbol(raw);

  return toNumber(
    prices?.[raw] ??
      prices?.[raw.toUpperCase()] ??
      prices?.[normalized] ??
      fallback,
    fallback
  );
}

export default function TradesScreen() {
  const { token, account } = useAuth();
  const {
  prices,
  livePositions,
  serverAccountStatus,
  refreshPositions,
} = useTrading();

  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editStopLoss, setEditStopLoss] = useState("");
  const [editTakeProfit, setEditTakeProfit] = useState("");
  const [partialVolume, setPartialVolume] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const positions = Array.isArray(livePositions) ? livePositions : [];

  const loadData = useCallback(
    async (silent = false) => {
      if (!token || !account?.id) {
        setLoading(false);
        setPendingOrders([]);
        return;
      }

      try {
        if (!silent) setLoading(true);

        const pendingData = await getPendingOrdersRequest(token, account.id);

        setPendingOrders(
          Array.isArray(pendingData?.orders) ? pendingData.orders : []
        );
      } catch (e) {
        console.log("Load orders failed", e);

        if (!silent) {
          setPendingOrders([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, account?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  const totalPnl = useMemo(() => {
    return positions.reduce((acc, position) => {
      const instrument = getPositionInstrument(position);
      const rawSymbol = instrument?.symbol || "";

      const livePrice = getLivePrice(
        prices,
        rawSymbol,
        getPositionMarkPrice(position)
      );

      const contractSize = toNumber(instrument?.contractSize, 1);
      const entryPrice = getPositionEntryPrice(position);
      const openVolume = getPositionOpenVolume(position);

      const diff =
        String(position.side).toUpperCase() === "BUY"
          ? livePrice - entryPrice
          : entryPrice - livePrice;

      return acc + diff * openVolume * contractSize;
    }, 0);
  }, [positions, prices]);

  const formatMoney = (n) =>
    `${toNumber(n, 0) >= 0 ? "+" : ""}${toNumber(n, 0).toFixed(2)} $`;

  const beginEdit = (position) => {
    setEditingId(position.id);
    setEditStopLoss(
      getPositionStopLoss(position) != null
        ? String(getPositionStopLoss(position))
        : ""
    );
    setEditTakeProfit(
      getPositionTakeProfit(position) != null
        ? String(getPositionTakeProfit(position))
        : ""
    );
    setPartialVolume("");
  };

  const saveEdit = async (position) => {
    try {
      setActionLoadingId(position.id);

      await modifyPositionRequest(token, {
        fundedAccountId: account.id,
        positionId: position.id,
        stopLoss: editStopLoss ? toNumber(editStopLoss) : null,
        takeProfit: editTakeProfit ? toNumber(editTakeProfit) : null,
      });
      await loadData(true); 
      setEditingId(null);
      setPartialVolume("");
    } catch (e) {
      Alert.alert("Modify failed", e?.message || "Unknown error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const closeTrade = async (position, full = false) => {
    try {
      const instrument = getPositionInstrument(position);
      const rawSymbol = instrument?.symbol || "";

      const livePrice = getLivePrice(
        prices,
        rawSymbol,
        getPositionMarkPrice(position)
      );

      const openVolume = getPositionOpenVolume(position);
      const volumeToClose = full ? openVolume : toNumber(partialVolume);

      if (!full && (!volumeToClose || volumeToClose <= 0)) {
        Alert.alert(
          "Error",
          `Enter a valid partial volume between 0 and ${openVolume}.`
        );
        return;
      }

      if (volumeToClose > openVolume) {
        Alert.alert(
          "Error",
          `Partial close volume cannot exceed ${openVolume}.`
        );
        return;
      }

      setActionLoadingId(position.id);

    await closePositionRequest(token, {
  fundedAccountId: account.id,
  positionId: position.id,
  closeVolume: volumeToClose,
  marketPrice: livePrice,
});

await refreshPositions();

setEditingId(null);
setPartialVolume("");

Alert.alert(
  "Success",
  "Position closed successfully."
);
    } catch (e) {
      Alert.alert("Close failed", e?.message || "Unknown error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const cancelPending = async (order) => {
    try {
      setActionLoadingId(order.id);

      await cancelPendingOrderRequest(token, {
        fundedAccountId: account.id,
        orderId: order.id,
      });

      setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e) {
      Alert.alert("Cancel failed", e?.message || "Unknown error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.globalCard}>
          <Text style={styles.globalLabel}>TOTAL UNREALIZED PNL</Text>
          <Text
            style={[
              styles.globalValue,
              { color: totalPnl >= 0 ? colors.green : colors.red },
            ]}
          >
            {formatMoney(totalPnl)}
          </Text>
        </View>

        {serverAccountStatus !== "ACTIVE" && (
          <View style={styles.lockBanner}>
            <Text style={styles.lockText}>
              ACCOUNT STATUS: {serverAccountStatus}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pending Orders</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : pendingOrders.length === 0 ? (
          <Text style={styles.emptyText}>No pending orders.</Text>
        ) : (
          pendingOrders.map((order) => {
            const instrument = getOrderInstrument(order);
            const isBusy = actionLoadingId === order.id;

            return (
              <View key={order.id} style={styles.tradeCard}>
                <View style={styles.tradeTop}>
                  <Text style={styles.symbol}>{instrument?.symbol || "—"}</Text>
                  <Text style={styles.side}>{order.type}</Text>
                </View>

                <Text style={styles.meta}>
                  {order.side} • Volume: {String(order.volume)} • Status:{" "}
                  {order.status}
                </Text>

                <Text style={styles.meta}>
                  Stop: {order.stopPrice ?? "—"} • Limit:{" "}
                  {order.limitPrice ?? "—"}
                </Text>

                <TouchableOpacity
                  disabled={isBusy}
                  onPress={() => cancelPending(order)}
                  style={[styles.closeBtn, isBusy && styles.disabledBtn]}
                >
                  <Text style={styles.closeText}>
                    {isBusy ? "Cancelling..." : "Cancel Order"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Open Positions</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : positions.length === 0 ? (
          <Text style={styles.emptyText}>No open positions.</Text>
        ) : (
          positions.map((position) => {
            const instrument = getPositionInstrument(position);
            const rawSymbol = instrument?.symbol || "";

            const livePrice = getLivePrice(
              prices,
              rawSymbol,
              getPositionMarkPrice(position)
            );

            const contractSize = toNumber(instrument?.contractSize, 1);
            const entryPrice = getPositionEntryPrice(position);
            const openVolume = getPositionOpenVolume(position);
            const stopLossValue = getPositionStopLoss(position);
            const takeProfitValue = getPositionTakeProfit(position);

            const diff =
              String(position.side).toUpperCase() === "BUY"
                ? livePrice - entryPrice
                : entryPrice - livePrice;

            const pnl = diff * openVolume * contractSize;
            const isBusy = actionLoadingId === position.id;

            return (
              <View key={position.id} style={styles.tradeCard}>
                <View style={styles.tradeTop}>
                  <Text style={styles.symbol}>{instrument?.symbol || "—"}</Text>
                  <Text
                    style={[
                      styles.side,
                      {
                        color:
                          String(position.side).toUpperCase() === "BUY"
                            ? colors.green
                            : colors.red,
                      },
                    ]}
                  >
                    {position.side}
                  </Text>
                </View>

                <Text style={styles.meta}>
                  Open Volume: {openVolume} • Entry: {entryPrice}
                </Text>

                <Text style={styles.meta}>
                  SL: {stopLossValue ?? "—"} • TP: {takeProfitValue ?? "—"}
                </Text>

                <Text style={styles.meta}>Live: {livePrice.toFixed(5)}</Text>

                <Text
                  style={[
                    styles.pnl,
                    { color: pnl >= 0 ? colors.green : colors.red },
                  ]}
                >
                  {formatMoney(pnl)}
                </Text>

                {editingId === position.id ? (
                  <View>
                    <Text style={styles.label}>New Stop Loss</Text>
                    <TextInput
                      value={editStopLoss}
                      onChangeText={(text) =>
                        setEditStopLoss(normalizeNumericInput(text))
                      }
                      keyboardType="decimal-pad"
                      placeholder="Enter new stop loss"
                      placeholderTextColor={colors.gray}
                      style={styles.input}
                    />

                    <Text style={styles.label}>New Take Profit</Text>
                    <TextInput
                      value={editTakeProfit}
                      onChangeText={(text) =>
                        setEditTakeProfit(normalizeNumericInput(text))
                      }
                      keyboardType="decimal-pad"
                      placeholder="Enter new take profit"
                      placeholderTextColor={colors.gray}
                      style={styles.input}
                    />

                    <Text style={styles.label}>Partial close volume</Text>
                    <TextInput
                      value={partialVolume}
                      onChangeText={(text) =>
                        setPartialVolume(normalizeNumericInput(text))
                      }
                      keyboardType="decimal-pad"
                      placeholder={`Enter volume to close (max ${openVolume})`}
                      placeholderTextColor={colors.gray}
                      style={styles.input}
                    />

                    <View style={styles.actions}>
                      <TouchableOpacity
                        disabled={isBusy}
                        onPress={() => saveEdit(position)}
                        style={[styles.modifyBtn, isBusy && styles.disabledBtn]}
                      >
                        <Text style={styles.modifyText}>
                          {isBusy ? "Saving..." : "Save SL/TP"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={isBusy}
                        onPress={() => closeTrade(position, false)}
                        style={[styles.partialBtn, isBusy && styles.disabledBtn]}
                      >
                        <Text style={styles.partialText}>
                          {isBusy ? "Closing..." : "Partial Close"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={isBusy}
                        onPress={() => closeTrade(position, true)}
                        style={[styles.closeBtn, isBusy && styles.disabledBtn]}
                      >
                        <Text style={styles.closeText}>
                          {isBusy ? "Closing..." : "Full Close"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      disabled={isBusy}
                      onPress={() => beginEdit(position)}
                      style={[styles.modifyBtn, isBusy && styles.disabledBtn]}
                    >
                      <Text style={styles.modifyText}>Modify</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isBusy}
                      onPress={() => closeTrade(position, true)}
                      style={[styles.closeBtn, isBusy && styles.disabledBtn]}
                    >
                      <Text style={styles.closeText}>
                        {isBusy ? "Closing..." : "Close"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  globalCard: {
    borderRadius: 18,
    paddingVertical: 26,
    alignItems: "center",
    marginBottom: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  globalLabel: {
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 6,
  },
  globalValue: {
    fontSize: 34,
    fontWeight: "900",
  },
  lockBanner: {
    padding: 14,
    marginBottom: spacing.md,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.4)",
  },
  lockText: {
    color: "#ff6b6b",
    fontWeight: "900",
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.gray,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  tradeCard: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tradeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  symbol: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  side: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.white,
  },
  meta: {
    color: colors.gray,
    fontSize: 13,
    marginBottom: 6,
  },
  pnl: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    color: colors.white,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  modifyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
  },
  modifyText: {
    color: colors.gold,
    fontWeight: "800",
  },
  partialBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  partialText: {
    color: colors.white,
    fontWeight: "800",
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.15)",
    alignItems: "center",
  },
  closeText: {
    color: "#ff6b6b",
    fontWeight: "900",
  },
  disabledBtn: {
    opacity: 0.45,
  },
});