import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  createOrderRequest,
  getInstrumentsRequest,
  openTradeRequest,
} from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

const ORDER_TYPES = [
  "MARKET",
  "BUY_LIMIT",
  "SELL_LIMIT",
  "BUY_STOP",
  "SELL_STOP",
  "BUY_STOP_LIMIT",
  "SELL_STOP_LIMIT",
];

function normalizeNumericInput(value) {
  const cleaned = String(value || "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const firstDotIndex = cleaned.indexOf(".");
  if (firstDotIndex === -1) return cleaned;

  const beforeDot = cleaned.slice(0, firstDotIndex + 1);
  const afterDot = cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
  return beforeDot + afterDot;
}

function toNumber(value, fallback = NaN) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(normalizeNumericInput(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMarketPrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function formatMoney(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "—";
}

function formatPct(value, digits = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(digits)}%` : "—";
}

function normalizeSymbol(value) {
  return String(value || "").replace("/", "").toUpperCase();
}

function buildNeutralValidation(message = "Market data unavailable.") {
  return {
    canPlace: false,
    message,
    riskAmount: 0,
    riskPct: 0,
    maxAllowedRisk: 0,
    maxPerTradeRisk: 0,
    maxDailyLossAmount: 0,
    dailyLossUsedAmount: 0,
    dailyLossUsedPct: 0,
    remainingDailyRisk: 0,
    estimatedEntryPrice: NaN,
  };
}

export default function MarketSymbolScreen() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams();
  const { token, account } = useAuth();
  const { prices, setLivePositions } = useTrading();

  const normalizedSymbol = normalizeSymbol(symbol);

  const [instrument, setInstrument] = useState(null);
  const [loadingInstrument, setLoadingInstrument] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [orderType, setOrderType] = useState("MARKET");
  const [volume, setVolume] = useState("1.00");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [previewSide, setPreviewSide] = useState("BUY");

  useEffect(() => {
    let cancelled = false;

    async function loadInstrument() {
      try {
        setLoadingInstrument(true);

        const instrumentsRes = await getInstrumentsRequest(token);

        const foundInstrument =
          instrumentsRes?.instruments?.find(
            (item) =>
              normalizeSymbol(item.symbol || item.displaySymbol) ===
              normalizedSymbol
          ) || null;

        if (!cancelled) {
          setInstrument(foundInstrument);
        }
      } catch (e) {
        console.log("MARKET INSTRUMENT LOAD ERROR", e);

        if (!cancelled) {
          setInstrument(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingInstrument(false);
        }
      }
    }

    loadInstrument();

    return () => {
      cancelled = true;
    };
  }, [normalizedSymbol, token]);

  const pricePrecision =
    instrument?.pricePrecision ?? instrument?.price_digits ?? 5;

  const livePrice =
    prices?.[normalizedSymbol] ??
    prices?.[String(symbol || "")] ??
    prices?.[String(symbol || "").toUpperCase()] ??
    null;

  const currentPrice = toMarketPrice(livePrice);
  const hasPrice = Number.isFinite(currentPrice) && currentPrice > 0;

  const spreadBps = Number(instrument?.spreadBps || 0);
  const fallbackSpreadAbsolute = Number(instrument?.spread || 0);

  const absoluteSpread =
    hasPrice && spreadBps > 0
      ? currentPrice * (spreadBps / 10000)
      : fallbackSpreadAbsolute > 0
      ? fallbackSpreadAbsolute
      : 0;

  const halfSpread = absoluteSpread / 2;

  const currentBid =
    hasPrice ? Number((currentPrice - halfSpread).toFixed(pricePrecision)) : NaN;

  const currentAsk =
    hasPrice ? Number((currentPrice + halfSpread).toFixed(pricePrecision)) : NaN;

  const buyText = Number.isFinite(currentAsk)
    ? currentAsk.toFixed(pricePrecision)
    : "—";

  const sellText = Number.isFinite(currentBid)
    ? currentBid.toFixed(pricePrecision)
    : "—";

  const accountType = String(account?.type || "").toLowerCase();
  const isAccess = accountType === "access";
  const isInstitutional =
    accountType === "institutional" ||
    accountType === "institutional_selection";

  const accountStatus = String(
    account?.accountStatus || account?.status || ""
  ).toUpperCase();

  const accountBalance = Number(account?.balance || 0);
  const accountEquity = Number(account?.equity ?? account?.balance ?? 0);

  const startOfDayBalance = Number(
    account?.startOfDayBalance ??
      account?.start_of_day_balance ??
      accountBalance
  );

  function getEstimatedEntryPriceForSide(side) {
    if (orderType === "MARKET") {
      if (!hasPrice) return NaN;
      return side === "BUY" ? currentAsk : currentBid;
    }

    if (orderType === "BUY_LIMIT" || orderType === "SELL_LIMIT") {
      return toNumber(limitPrice, NaN);
    }

    if (orderType === "BUY_STOP" || orderType === "SELL_STOP") {
      return toNumber(stopPrice, NaN);
    }

    if (orderType === "BUY_STOP_LIMIT" || orderType === "SELL_STOP_LIMIT") {
      return toNumber(limitPrice, NaN);
    }

    return NaN;
  }

  const estimatedEntryPrice = useMemo(() => {
    return getEstimatedEntryPriceForSide(previewSide);
  }, [
    previewSide,
    orderType,
    hasPrice,
    currentAsk,
    currentBid,
    limitPrice,
    stopPrice,
  ]);

  function buildValidation(side) {
    const sideEstimatedEntryPrice = getEstimatedEntryPriceForSide(side);
    const fallbackPerTradeRisk = accountBalance * 0.005;

    const maxDailyLossAmount = startOfDayBalance * 0.01;
    const referenceEquity = Math.min(accountBalance, accountEquity);
    const dailyLossUsedAmount = Math.max(0, startOfDayBalance - referenceEquity);
    const remainingDailyRisk = Math.max(
      0,
      maxDailyLossAmount - dailyLossUsedAmount
    );
    const dailyLossUsedPct =
      startOfDayBalance > 0
        ? (dailyLossUsedAmount / startOfDayBalance) * 100
        : 0;

    if (!token) {
      return buildNeutralValidation("Authentication required.");
    }

    if (!account?.id) {
      return {
        ...buildNeutralValidation("No funded account loaded."),
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    if (accountStatus !== "ACTIVE") {
      return {
        canPlace: false,
        message: "Account is not active for trading.",
        riskAmount: 0,
        riskPct: 0,
        maxAllowedRisk: fallbackPerTradeRisk,
        maxPerTradeRisk: fallbackPerTradeRisk,
        maxDailyLossAmount,
        dailyLossUsedAmount,
        dailyLossUsedPct,
        remainingDailyRisk,
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    if (!instrument || !hasPrice) {
      return {
        canPlace: false,
        message: "Market data unavailable.",
        riskAmount: 0,
        riskPct: 0,
        maxAllowedRisk: fallbackPerTradeRisk,
        maxPerTradeRisk: fallbackPerTradeRisk,
        maxDailyLossAmount,
        dailyLossUsedAmount,
        dailyLossUsedPct,
        remainingDailyRisk,
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    const parsedVolume = toNumber(volume, NaN);

    if (!Number.isFinite(parsedVolume) || parsedVolume <= 0) {
      return {
        canPlace: false,
        message: "Enter a valid volume.",
        riskAmount: 0,
        riskPct: 0,
        maxAllowedRisk: fallbackPerTradeRisk,
        maxPerTradeRisk: fallbackPerTradeRisk,
        maxDailyLossAmount,
        dailyLossUsedAmount,
        dailyLossUsedPct,
        remainingDailyRisk,
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    if (
      !Number.isFinite(sideEstimatedEntryPrice) ||
      sideEstimatedEntryPrice <= 0
    ) {
      return {
        canPlace: false,
        message: "Entry price unavailable.",
        riskAmount: 0,
        riskPct: 0,
        maxAllowedRisk: fallbackPerTradeRisk,
        maxPerTradeRisk: fallbackPerTradeRisk,
        maxDailyLossAmount,
        dailyLossUsedAmount,
        dailyLossUsedPct,
        remainingDailyRisk,
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    const parsedStopLoss = toNumber(stopLoss, NaN);
    const parsedTakeProfit = toNumber(takeProfit, NaN);

    const maxPerTradeRisk = accountBalance * 0.005;
    const maxAllowedRisk = Math.min(maxPerTradeRisk, remainingDailyRisk);

    if (isAccess) {
      if (!Number.isFinite(parsedStopLoss) || parsedStopLoss <= 0) {
        return {
          canPlace: false,
          message: "Stop Loss is mandatory for Riffard Access.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk,
          maxPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (side === "BUY" && parsedStopLoss >= sideEstimatedEntryPrice) {
        return {
          canPlace: false,
          message: "For BUY, Stop Loss must be below entry price.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk,
          maxPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (side === "SELL" && parsedStopLoss <= sideEstimatedEntryPrice) {
        return {
          canPlace: false,
          message: "For SELL, Stop Loss must be above entry price.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk,
          maxPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      const contractSize = Number(instrument?.contractSize || 1);
      const riskPerUnit = Math.abs(sideEstimatedEntryPrice - parsedStopLoss);
      const riskAmount = Number(
        (riskPerUnit * parsedVolume * contractSize).toFixed(2)
      );
      const riskPct =
        accountBalance > 0 ? (riskAmount / accountBalance) * 100 : 0;

      if (maxAllowedRisk <= 0) {
        return {
          canPlace: false,
          message: "Daily loss limit already reached. Trading is blocked.",
          riskAmount,
          riskPct,
          maxAllowedRisk,
          maxPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (riskAmount > maxAllowedRisk) {
        return {
          canPlace: false,
          message: `Risk exceeds allowed remaining daily risk. Max allowed now: ${formatMoney(
            maxAllowedRisk
          )} $.`,
          riskAmount,
          riskPct,
          maxAllowedRisk,
          maxPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (takeProfit !== "") {
        if (!Number.isFinite(parsedTakeProfit) || parsedTakeProfit <= 0) {
          return {
            canPlace: false,
            message: "Take Profit is invalid.",
            riskAmount,
            riskPct,
            maxAllowedRisk,
            maxPerTradeRisk,
            maxDailyLossAmount,
            dailyLossUsedAmount,
            dailyLossUsedPct,
            remainingDailyRisk,
            estimatedEntryPrice: sideEstimatedEntryPrice,
          };
        }

        if (side === "BUY" && parsedTakeProfit <= sideEstimatedEntryPrice) {
          return {
            canPlace: false,
            message: "For BUY, Take Profit must be above entry price.",
            riskAmount,
            riskPct,
            maxAllowedRisk,
            maxPerTradeRisk,
            maxDailyLossAmount,
            dailyLossUsedAmount,
            dailyLossUsedPct,
            remainingDailyRisk,
            estimatedEntryPrice: sideEstimatedEntryPrice,
          };
        }

        if (side === "SELL" && parsedTakeProfit >= sideEstimatedEntryPrice) {
          return {
            canPlace: false,
            message: "For SELL, Take Profit must be below entry price.",
            riskAmount,
            riskPct,
            maxAllowedRisk,
            maxPerTradeRisk,
            maxDailyLossAmount,
            dailyLossUsedAmount,
            dailyLossUsedPct,
            remainingDailyRisk,
            estimatedEntryPrice: sideEstimatedEntryPrice,
          };
        }
      }

      return {
        canPlace: true,
        message: "Order is valid.",
        riskAmount,
        riskPct,
        maxAllowedRisk,
        maxPerTradeRisk,
        maxDailyLossAmount,
        dailyLossUsedAmount,
        dailyLossUsedPct,
        remainingDailyRisk,
        estimatedEntryPrice: sideEstimatedEntryPrice,
      };
    }

    if (takeProfit !== "") {
      if (!Number.isFinite(parsedTakeProfit) || parsedTakeProfit <= 0) {
        return {
          canPlace: false,
          message: "Take Profit is invalid.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk: fallbackPerTradeRisk,
          maxPerTradeRisk: fallbackPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (side === "BUY" && parsedTakeProfit <= sideEstimatedEntryPrice) {
        return {
          canPlace: false,
          message: "For BUY, Take Profit must be above entry price.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk: fallbackPerTradeRisk,
          maxPerTradeRisk: fallbackPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }

      if (side === "SELL" && parsedTakeProfit >= sideEstimatedEntryPrice) {
        return {
          canPlace: false,
          message: "For SELL, Take Profit must be below entry price.",
          riskAmount: 0,
          riskPct: 0,
          maxAllowedRisk: fallbackPerTradeRisk,
          maxPerTradeRisk: fallbackPerTradeRisk,
          maxDailyLossAmount,
          dailyLossUsedAmount,
          dailyLossUsedPct,
          remainingDailyRisk,
          estimatedEntryPrice: sideEstimatedEntryPrice,
        };
      }
    }

    return {
      canPlace: true,
      message: "Order is valid.",
      riskAmount: 0,
      riskPct: 0,
      maxAllowedRisk: fallbackPerTradeRisk,
      maxPerTradeRisk: fallbackPerTradeRisk,
      maxDailyLossAmount,
      dailyLossUsedAmount,
      dailyLossUsedPct,
      remainingDailyRisk,
      estimatedEntryPrice: sideEstimatedEntryPrice,
    };
  }

  const buyValidation = useMemo(
    () => buildValidation("BUY"),
    [
      token,
      account?.id,
      account?.type,
      account?.status,
      account?.accountStatus,
      account?.balance,
      account?.equity,
      account?.startOfDayBalance,
      account?.start_of_day_balance,
      instrument,
      hasPrice,
      orderType,
      volume,
      stopLoss,
      takeProfit,
      limitPrice,
      stopPrice,
      currentAsk,
      currentBid,
    ]
  );

  const sellValidation = useMemo(
    () => buildValidation("SELL"),
    [
      token,
      account?.id,
      account?.type,
      account?.status,
      account?.accountStatus,
      account?.balance,
      account?.equity,
      account?.startOfDayBalance,
      account?.start_of_day_balance,
      instrument,
      hasPrice,
      orderType,
      volume,
      stopLoss,
      takeProfit,
      limitPrice,
      stopPrice,
      currentAsk,
      currentBid,
    ]
  );

  const liveValidation =
    previewSide === "SELL" ? sellValidation : buyValidation;

  const parsedVolume = toNumber(volume, 0);

  const submitOrder = async (side) => {
    const validation = side === "SELL" ? sellValidation : buyValidation;

    if (!validation.canPlace || placing) {
      Alert.alert("Order blocked", validation.message);
      return;
    }

    try {
      setPlacing(true);

      const finalVolume = toNumber(volume);

      const payload = {
        fundedAccountId: account.id,
        symbol: normalizedSymbol,
        side,
        volume: finalVolume,
        stopLoss: stopLoss ? toNumber(stopLoss) : null,
        takeProfit: takeProfit ? toNumber(takeProfit) : null,
      };

      if (orderType === "MARKET") {
  const data = await openTradeRequest(token, {
    ...payload,
    entryPrice: validation.estimatedEntryPrice,
  });

  if (!data?.success) {
    throw new Error("Unable to open trade.");
  }

  if (data?.position) {
    setLivePositions((prev) => [
      data.position,
      ...(Array.isArray(prev)
        ? prev.filter((p) => p.id !== data.position.id)
        : []),
    ]);
  }

  Alert.alert("Trade opened", "Your position has been created.");
      } else {
        const pendingPayload = {
          fundedAccountId: account.id,
          symbol: normalizedSymbol,
          orderType,
          side,
          volume: finalVolume,
          markPrice: hasPrice ? currentPrice : null,
          stopLoss: stopLoss ? toNumber(stopLoss) : null,
          takeProfit: takeProfit ? toNumber(takeProfit) : null,
          limitPrice: limitPrice ? toNumber(limitPrice) : null,
          stopPrice: stopPrice ? toNumber(stopPrice) : null,
        };

        const data = await createOrderRequest(token, pendingPayload);

        if (!data?.success) {
          throw new Error("Unable to create pending order.");
        }

        Alert.alert("Order created", "Your pending order has been created.");
      }

      router.back();
    } catch (e) {
      Alert.alert("Order failed", e?.message || "Unknown error");
    } finally {
      setPlacing(false);
    }
  };

  const isLoading = loadingInstrument;

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{normalizedSymbol}</Text>
        <Text style={styles.subtitle}>
          {instrument?.name ||
            instrument?.display_name ||
            (loadingInstrument
              ? "Loading instrument..."
              : "Instrument unavailable")}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Order type</Text>
          {ORDER_TYPES.map((type) => {
            const active = type === orderType;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => setOrderType(type)}
                activeOpacity={0.7}
                style={[
                  styles.selectorBtn,
                  active && styles.selectorBtnActive,
                ]}
              >
                <Text style={styles.selectorText}>
                  {type.replaceAll("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Current price</Text>
          <Text style={styles.priceValue}>
            {isLoading
              ? "Loading..."
              : hasPrice
              ? currentPrice.toFixed(pricePrecision)
              : "—"}
          </Text>
          <Text style={styles.riskLine}>
            Bid: <Text style={styles.riskValue}>{sellText}</Text>
          </Text>
          <Text style={styles.riskLine}>
            Ask: <Text style={styles.riskValue}>{buyText}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Volume</Text>
          <TextInput
            value={volume}
            onChangeText={(text) => setVolume(normalizeNumericInput(text))}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="1.00"
            placeholderTextColor={colors.gray}
          />

          <View style={styles.quickRow}>
            {["0.10", "0.50", "1.00", "2.00"].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setVolume(v)}
                style={[
                  styles.quickBtn,
                  volume === v && styles.quickBtnActive,
                ]}
              >
                <Text style={styles.quickBtnText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.volumeInfo}>
            Volume that will be sent:{" "}
            <Text style={styles.volumeInfoValue}>
              {Number.isFinite(parsedVolume) && parsedVolume > 0
                ? parsedVolume.toFixed(2)
                : "—"}
            </Text>
          </Text>
        </View>

        {(orderType === "BUY_LIMIT" ||
          orderType === "SELL_LIMIT" ||
          orderType === "BUY_STOP_LIMIT" ||
          orderType === "SELL_STOP_LIMIT") && (
          <View style={styles.card}>
            <Text style={styles.label}>Limit Price</Text>
            <TextInput
              value={limitPrice}
              onChangeText={(text) => setLimitPrice(normalizeNumericInput(text))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="Limit price"
              placeholderTextColor={colors.gray}
            />
          </View>
        )}

        {(orderType === "BUY_STOP" ||
          orderType === "SELL_STOP" ||
          orderType === "BUY_STOP_LIMIT" ||
          orderType === "SELL_STOP_LIMIT") && (
          <View style={styles.card}>
            <Text style={styles.label}>Stop Price</Text>
            <TextInput
              value={stopPrice}
              onChangeText={(text) => setStopPrice(normalizeNumericInput(text))}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="Stop price"
              placeholderTextColor={colors.gray}
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Stop Loss</Text>
          <TextInput
            value={stopLoss}
            onChangeText={(text) => setStopLoss(normalizeNumericInput(text))}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder={isAccess ? "Mandatory for Access" : "Optional"}
            placeholderTextColor={colors.gray}
          />

          <Text style={styles.label}>Take Profit</Text>
          <TextInput
            value={takeProfit}
            onChangeText={(text) => setTakeProfit(normalizeNumericInput(text))}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor={colors.gray}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Risk preview</Text>

          <View style={styles.previewRow}>
            <TouchableOpacity
              onPress={() => setPreviewSide("BUY")}
              style={[
                styles.previewSideBtn,
                previewSide === "BUY" && styles.previewSideBtnActive,
              ]}
            >
              <Text style={styles.previewSideText}>BUY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPreviewSide("SELL")}
              style={[
                styles.previewSideBtn,
                previewSide === "SELL" && styles.previewSideBtnActive,
              ]}
            >
              <Text style={styles.previewSideText}>SELL</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.riskLine}>
            Estimated entry:{" "}
            <Text style={styles.riskValue}>
              {Number.isFinite(liveValidation.estimatedEntryPrice)
                ? liveValidation.estimatedEntryPrice.toFixed(pricePrecision)
                : "—"}
            </Text>
          </Text>

          {isAccess && (
            <>
              <Text style={styles.riskLine}>
                Risk amount:{" "}
                <Text
                  style={[
                    styles.riskValue,
                    liveValidation.riskAmount >
                      liveValidation.maxAllowedRisk && {
                      color: colors.red,
                    },
                  ]}
                >
                  {formatMoney(liveValidation.riskAmount)} $
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Risk %:{" "}
                <Text
                  style={[
                    styles.riskValue,
                    liveValidation.riskAmount >
                      liveValidation.maxAllowedRisk && {
                      color: colors.red,
                    },
                  ]}
                >
                  {formatPct(liveValidation.riskPct)}
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Daily loss used:{" "}
                <Text style={styles.riskValue}>
                  {formatMoney(liveValidation.dailyLossUsedAmount)} $ (
                  {formatPct(liveValidation.dailyLossUsedPct)})
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Daily loss cap:{" "}
                <Text style={styles.riskValue}>
                  {formatMoney(liveValidation.maxDailyLossAmount)} $ (1.00%)
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Remaining daily risk:{" "}
                <Text
                  style={[
                    styles.riskValue,
                    liveValidation.remainingDailyRisk <= 0 && {
                      color: colors.red,
                    },
                  ]}
                >
                  {formatMoney(liveValidation.remainingDailyRisk)} $
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Per-trade cap:{" "}
                <Text style={styles.riskValue}>
                  {formatMoney(liveValidation.maxPerTradeRisk)} $ (0.50%)
                </Text>
              </Text>

              <Text style={styles.riskLine}>
                Effective max allowed now:{" "}
                <Text
                  style={[
                    styles.riskValue,
                    liveValidation.riskAmount >
                      liveValidation.maxAllowedRisk && {
                      color: colors.red,
                    },
                  ]}
                >
                  {formatMoney(liveValidation.maxAllowedRisk)} $
                </Text>
              </Text>
            </>
          )}

          {isInstitutional && (
            <Text style={styles.riskLine}>
              <Text style={styles.riskValue}>Institutional environment:</Text>
            </Text>
          )}

          <Text
            style={[
              styles.validationText,
              liveValidation.canPlace
                ? styles.validationOk
                : styles.validationError,
            ]}
          >
            {liveValidation.message}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={!sellValidation.canPlace || placing}
            onPress={() => submitOrder("SELL")}
            style={[
              styles.sellBtn,
              (!sellValidation.canPlace || placing) && styles.disabledBtn,
            ]}
          >
            <Text style={styles.actionText}>
              {placing
                ? "Placing..."
                : orderType === "MARKET"
                ? `Sell ${sellText}`
                : "Create Sell Order"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!buyValidation.canPlace || placing}
            onPress={() => submitOrder("BUY")}
            style={[
              styles.buyBtn,
              (!buyValidation.canPlace || placing) && styles.disabledBtn,
            ]}
          >
            <Text style={styles.actionText}>
              {placing
                ? "Placing..."
                : orderType === "MARKET"
                ? `Buy ${buyText}`
                : "Create Buy Order"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  scroll: { backgroundColor: "transparent" },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backBtnText: {
    color: colors.white,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
  },
  subtitle: {
    color: colors.gray,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  label: {
    color: colors.gold,
    fontWeight: "700",
    marginBottom: 8,
  },
  selectorBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 8,
  },
  selectorBtnActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  selectorText: {
    color: colors.white,
    fontWeight: "600",
  },
  priceValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
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
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  quickBtnActive: {
    borderWidth: 1,
    borderColor: colors.gold,
  },
  quickBtnText: {
    color: colors.gold,
    fontWeight: "700",
  },
  volumeInfo: {
    color: colors.gray,
    marginTop: 10,
    fontSize: 14,
  },
  volumeInfoValue: {
    color: colors.white,
    fontWeight: "800",
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  previewSideBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  previewSideBtnActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  previewSideText: {
    color: colors.white,
    fontWeight: "700",
  },
  riskLine: {
    color: colors.gray,
    marginBottom: 6,
    fontSize: 14,
  },
  riskValue: {
    color: colors.white,
    fontWeight: "800",
  },
  validationText: {
    marginTop: 8,
    fontWeight: "700",
  },
  validationOk: {
    color: colors.green,
  },
  validationError: {
    color: colors.red,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.md,
  },
  sellBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(220,80,80,0.9)",
  },
  buyBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(50,120,230,0.95)",
  },
  actionText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.4,
  },
});