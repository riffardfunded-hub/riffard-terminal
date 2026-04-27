import { useRouter } from "expo-router";
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
  createPayoutBeneficiaryRequest,
  createPayoutRequest,
  getPayoutBeneficiariesRequest,
  getPayoutStatusRequest,
} from "../../lib/api";
import { colors, spacing } from "../../lib/theme";

const PAYOUT_METHODS = [
  { key: "BANK", label: "Bank transfer" },
  { key: "BTC", label: "Crypto – Bitcoin (BTC)" },
  { key: "ETH", label: "Crypto – Ethereum (ETH)" },
];

const CRYPTO_NETWORKS = {
  BTC: ["Bitcoin"],
  ETH: ["Ethereum"],
};

function safeString(v) {
  return String(v || "").trim();
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(v) {
  return Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PayoutScreen() {
  const router = useRouter();
  const { token, account } = useAuth();
  const {
    balance,
    initialBalance,
    payoutHold,
    dailyLossPercent,
    cooldownActive,
  } = useTrading();

  const normalizedAccountType = String(
    account?.type || account?.accountType || ""
  ).toUpperCase();

  const isInstitutional =
    normalizedAccountType === "INSTITUTIONAL" ||
    normalizedAccountType === "INSTITUTIONAL_SELECTION";

  const isAccess = normalizedAccountType === "ACCESS";

  const [method, setMethod] = useState("BANK");
  const [grossAmount, setGrossAmount] = useState("");

  const [beneficiary, setBeneficiary] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("USD");

  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [confirmRisk, setConfirmRisk] = useState(false);

  const [statusLoading, setStatusLoading] = useState(true);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [eligible, setEligible] = useState(false);
  const [reason, setReason] = useState("");
  const [daysLeft, setDaysLeft] = useState(null);
  const [openRequest, setOpenRequest] = useState(null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(null);

  const baseBalance = useMemo(() => {
    return toNumber(initialBalance, 0);
  }, [initialBalance]);

  const liveBalance = useMemo(() => {
    return toNumber(balance, 0);
  }, [balance]);

  const effectiveDailyLossPercent = useMemo(() => {
    return toNumber(dailyLossPercent, 0);
  }, [dailyLossPercent]);

  const availableGrossProfit = useMemo(() => {
    return Math.max(0, Number((liveBalance - baseBalance).toFixed(2)));
  }, [liveBalance, baseBalance]);

  const suggestedGross = useMemo(() => {
    return availableGrossProfit > 0 ? availableGrossProfit.toFixed(2) : "";
  }, [availableGrossProfit]);

  useEffect(() => {
    if (!grossAmount && suggestedGross && isAccess) {
      setGrossAmount(suggestedGross);
    }
  }, [suggestedGross, grossAmount, isAccess]);

  useEffect(() => {
    async function loadStatus() {
      if (!token || !account?.id) {
        setStatusLoading(false);
        return;
      }

      if (isInstitutional) {
        setEligible(false);
        setReason(
          "Institutional Selection does not provide payout requests. This environment is used for observation, internal scoring and selection only."
        );
        setDaysLeft(null);
        setOpenRequest(null);
        setStatusLoading(false);
        return;
      }

      try {
        setStatusLoading(true);
        const data = await getPayoutStatusRequest(token, account.id);

        setEligible(!!data?.eligible);
        setReason(data?.reason || "");
        setDaysLeft(data?.daysLeft ?? null);
        setOpenRequest(data?.openRequest || null);
      } catch (e) {
        setEligible(false);
        setReason(e?.message || "Unable to load payout status.");
      } finally {
        setStatusLoading(false);
      }
    }

    loadStatus();
  }, [token, account?.id, balance, isInstitutional]);

  useEffect(() => {
    async function loadBeneficiaries() {
      if (!token || isInstitutional) {
        setBeneficiariesLoading(false);
        setBeneficiaries([]);
        return;
      }

      try {
        setBeneficiariesLoading(true);
        const data = await getPayoutBeneficiariesRequest(token);
        const rows = Array.isArray(data?.beneficiaries) ? data.beneficiaries : [];
        setBeneficiaries(rows);
      } catch {
        setBeneficiaries([]);
      } finally {
        setBeneficiariesLoading(false);
      }
    }

    loadBeneficiaries();
  }, [token, isInstitutional]);

  useEffect(() => {
    setSelectedBeneficiaryId(null);

    if (method === "BTC" && !cryptoNetwork) {
      setCryptoNetwork("Bitcoin");
    }

    if (method === "ETH" && !cryptoNetwork) {
      setCryptoNetwork("Ethereum");
    }
  }, [method, cryptoNetwork]);

  const amountNumber = Number(grossAmount || 0);
  const traderNet = amountNumber > 0 ? amountNumber * 0.8 : 0;
  const firmShare = amountNumber > 0 ? amountNumber * 0.2 : 0;
  const projectedBalanceAfterPayout =
    amountNumber > 0 ? Math.max(0, liveBalance - amountNumber) : liveBalance;

  const selectedBeneficiary = useMemo(() => {
    return beneficiaries.find((item) => item.id === selectedBeneficiaryId) || null;
  }, [beneficiaries, selectedBeneficiaryId]);

  const availableBeneficiaries = useMemo(() => {
    if (method === "BANK") {
      return beneficiaries.filter(
        (b) => String(b.type || "").toUpperCase() === "BANK"
      );
    }

    return beneficiaries.filter(
      (b) =>
        String(b.type || "").toUpperCase() === "CRYPTO" &&
        String(b.cryptoCurrency || "").toUpperCase() === method
    );
  }, [beneficiaries, method]);

  const bankFieldsValid =
    safeString(beneficiary).length >= 3 &&
    safeString(country).length >= 2 &&
    safeString(currency).length >= 3 &&
    (
      safeString(iban).length >= 10 ||
      (safeString(accountNumber).length >= 4 &&
        safeString(routingNumber).length >= 4)
    );

  const cryptoFieldsValid =
    safeString(cryptoAddress).length >= 20 &&
    safeString(cryptoNetwork).length >= 2 &&
    confirmRisk;

  const canSaveBeneficiary =
    !!token &&
    isAccess &&
    (method === "BANK" ? bankFieldsValid : cryptoFieldsValid);

  const grossValid =
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    amountNumber <= availableGrossProfit;

  const blockedByRisk =
    payoutHold || cooldownActive || effectiveDailyLossPercent >= 1;

  const canSubmit =
    !!token &&
    !!account?.id &&
    isAccess &&
    eligible &&
    !blockedByRisk &&
    !openRequest &&
    !!method &&
    grossValid &&
    (!!selectedBeneficiary ||
      (method === "BANK" ? bankFieldsValid : cryptoFieldsValid));

  const buildBeneficiaryPayload = () => {
    if (method === "BANK") {
      return {
        type: "BANK",
        label: safeString(beneficiary),
        country: safeString(country),
        currency: safeString(currency).toUpperCase(),
        bankDetails: {
          beneficiary: safeString(beneficiary),
          country: safeString(country),
          currency: safeString(currency).toUpperCase(),
          iban: safeString(iban),
          bic: safeString(bic),
          accountNumber: safeString(accountNumber),
          routingNumber: safeString(routingNumber),
        },
        cryptoDetails: null,
        cryptoCurrency: null,
        isDefault: false,
      };
    }

    return {
      type: "CRYPTO",
      label: `${method} - ${safeString(cryptoNetwork)}`,
      country: null,
      currency: method,
      bankDetails: null,
      cryptoDetails: {
        network: safeString(cryptoNetwork),
        address: safeString(cryptoAddress),
      },
      cryptoCurrency: method,
      isDefault: false,
    };
  };

  const openKycFlow = () => {
    try {
      router.push("/kyc");
    } catch {
      Alert.alert(
        "KYC required",
        "Please open the KYC screen manually and complete verification before requesting a payout."
      );
    }
  };

  const saveBeneficiary = async () => {
    if (!canSaveBeneficiary) return null;

    try {
      setSavingBeneficiary(true);

      const result = await createPayoutBeneficiaryRequest(
        token,
        buildBeneficiaryPayload()
      );

      const created =
        result?.beneficiary || result?.payoutBeneficiary || result || null;

      if (!created?.id) {
        throw new Error("Beneficiary could not be saved.");
      }

      const refreshed = await getPayoutBeneficiariesRequest(token);
      const rows = Array.isArray(refreshed?.beneficiaries)
        ? refreshed.beneficiaries
        : [];

      setBeneficiaries(rows);
      setSelectedBeneficiaryId(created.id);

      Alert.alert("Beneficiary saved", "Your payout beneficiary has been saved.");
      return created;
    } catch (e) {
      Alert.alert("Save failed", e?.message || "Unable to save beneficiary.");
      return null;
    } finally {
      setSavingBeneficiary(false);
    }
  };

  const submitPayout = async () => {
    if (isInstitutional) {
      Alert.alert(
        "Unavailable",
        "Institutional Selection does not support payout requests."
      );
      return;
    }

    if (!canSubmit) return;

    if (amountNumber > availableGrossProfit) {
      Alert.alert(
        "Payout blocked",
        "Gross payout amount cannot exceed current available profit."
      );
      return;
    }

    if (cooldownActive || effectiveDailyLossPercent >= 1) {
      Alert.alert(
        "Payout blocked",
        "Payout is unavailable while the daily cooldown is active."
      );
      return;
    }

    if (payoutHold) {
      Alert.alert(
        "Payout blocked",
        "Payout hold is currently active on this account."
      );
      return;
    }

    try {
      setSubmitting(true);

      let beneficiaryRecord = selectedBeneficiary;

      if (!beneficiaryRecord) {
        beneficiaryRecord = await saveBeneficiary();
        if (!beneficiaryRecord?.id) {
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        fundedAccountId: account.id,
        grossAmount: amountNumber,
        method,
        beneficiaryId: beneficiaryRecord.id,

        bankDetails:
          method === "BANK"
            ? {
                beneficiary: safeString(beneficiary),
                country: safeString(country),
                currency: safeString(currency).toUpperCase(),
                iban: safeString(iban),
                bic: safeString(bic),
                accountNumber: safeString(accountNumber),
                routingNumber: safeString(routingNumber),
              }
            : null,

        cryptoDetails:
          method !== "BANK"
            ? {
                currency: method,
                network: safeString(cryptoNetwork),
                address: safeString(cryptoAddress),
              }
            : null,

        note:
          method === "BANK"
            ? `MANUAL BANK PAYOUT | Beneficiary: ${beneficiary} | Country: ${country} | Currency: ${currency}`
            : `MANUAL CRYPTO PAYOUT | ${method} | Network: ${cryptoNetwork}`,
      };

      const result = await createPayoutRequest(token, payload);

      Alert.alert(
        "Payout requested",
        "Your payout request has been submitted and is now under review."
      );

      setOpenRequest(result?.payoutRequest || result?.payout || { status: "PENDING" });
      setEligible(false);
      setReason("A payout request is already open for this account.");
    } catch (e) {
      const code = e?.code || e?.response?.data?.code;
      const shouldOpenKyc =
        e?.shouldOpenKyc || e?.response?.data?.shouldOpenKyc;

      if (code === "KYC_REQUIRED" || shouldOpenKyc) {
        Alert.alert(
          "KYC required",
          "You must complete identity verification before requesting a payout.",
          [
            {
              text: "Start KYC",
              onPress: openKycFlow,
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      Alert.alert("Payout request failed", e?.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isInstitutional) {
    return (
      <View style={styles.root}>
        <BackgroundVideo />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Institutional Selection</Text>
            <Text style={styles.goldText}>Payouts unavailable</Text>
            <Text style={styles.infoText}>
              Institutional Selection does not include payout requests.
            </Text>
            <Text style={styles.infoText}>
              This environment is dedicated to observation, internal scoring,
              discipline evaluation and long-term trader selection.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Selection framework</Text>
            <Text style={styles.helperText}>
              • No payout cycle
            </Text>
            <Text style={styles.helperText}>
              • No 80 / 20 payout split
            </Text>
            <Text style={styles.helperText}>
              • No payout beneficiary setup
            </Text>
            <Text style={styles.helperText}>
              • Evaluation is based on performance, discipline and internal scoring
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Current account</Text>
            <Text style={styles.helperText}>
              Base balance: {formatMoney(baseBalance)} $
            </Text>
            <Text style={styles.helperText}>
              Current balance: {formatMoney(liveBalance)} $
            </Text>
            <Text style={styles.splitLine}>
              Net performance:{" "}
              <Text style={styles.splitValue}>
                {formatMoney(liveBalance - baseBalance)} $
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundVideo />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Payout status</Text>

          {statusLoading ? (
            <Text style={styles.infoText}>Loading status...</Text>
          ) : eligible ? (
            <Text style={styles.okText}>Eligible for payout</Text>
          ) : (
            <>
              <Text style={styles.errorText}>Not eligible</Text>
              {!!reason && <Text style={styles.infoText}>{reason}</Text>}
              {daysLeft !== null && (
                <Text style={styles.goldText}>{daysLeft} days remaining</Text>
              )}
            </>
          )}

          {payoutHold && (
            <Text style={styles.errorText}>
              Payout hold is currently active.
            </Text>
          )}

          {cooldownActive && (
            <Text style={styles.errorText}>
              Daily cooldown is active until the next day reset.
            </Text>
          )}

          {!cooldownActive && effectiveDailyLossPercent >= 1 && (
            <Text style={styles.errorText}>
              Daily loss limit reached. Trading and payout are blocked until tomorrow.
            </Text>
          )}

          {openRequest && (
            <Text style={styles.goldText}>
              Open request: {String(openRequest.status || "PENDING").toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Profit available for payout</Text>
          <Text style={styles.helperText}>
            Base balance: {formatMoney(baseBalance)} $
          </Text>
          <Text style={styles.helperText}>
            Current balance: {formatMoney(liveBalance)} $
          </Text>
          <Text style={styles.helperText}>
            Cycle: 30 days minimum • 1 payout allowed per cycle
          </Text>
          <Text style={styles.splitLine}>
            Available gross profit:{" "}
            <Text style={styles.splitValue}>{formatMoney(availableGrossProfit)} $</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Payout split</Text>
          <Text style={styles.helperText}>
            Gross profit is split automatically. The full gross amount is removed from the account.
          </Text>

          <TextInput
            placeholder="Gross amount in USD"
            placeholderTextColor={colors.gray}
            value={grossAmount}
            onChangeText={setGrossAmount}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.splitLine}>
            Trader (80%): <Text style={styles.splitValue}>{formatMoney(traderNet)} $</Text>
          </Text>
          <Text style={styles.splitLine}>
            Riffard (20%): <Text style={styles.splitValue}>{formatMoney(firmShare)} $</Text>
          </Text>
          <Text style={styles.splitLine}>
            Balance after payout:{" "}
            <Text style={styles.splitValue}>{formatMoney(projectedBalanceAfterPayout)} $</Text>
          </Text>

          {amountNumber > availableGrossProfit && (
            <Text style={styles.errorText}>
              Gross payout cannot exceed available profit.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Payout method</Text>

          {PAYOUT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={[
                styles.methodBtn,
                method === m.key && styles.methodSelected,
              ]}
            >
              <Text style={styles.methodText}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Saved beneficiaries</Text>

          {beneficiariesLoading ? (
            <Text style={styles.infoText}>Loading beneficiaries...</Text>
          ) : availableBeneficiaries.length === 0 ? (
            <Text style={styles.infoText}>No saved beneficiary for this method.</Text>
          ) : (
            availableBeneficiaries.map((item) => {
              const isSelected = selectedBeneficiaryId === item.id;
              const label = item.label || "Unnamed beneficiary";

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedBeneficiaryId(item.id)}
                  style={[
                    styles.methodBtn,
                    isSelected && styles.methodSelected,
                  ]}
                >
                  <Text style={styles.methodText}>{label}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {method === "BANK" && (
          <View style={styles.card}>
            <Text style={styles.title}>Bank details</Text>

            <TextInput
              placeholder="Beneficiary name"
              placeholderTextColor={colors.gray}
              value={beneficiary}
              onChangeText={setBeneficiary}
              style={styles.input}
            />

            <TextInput
              placeholder="Country"
              placeholderTextColor={colors.gray}
              value={country}
              onChangeText={setCountry}
              style={styles.input}
            />

            <TextInput
              placeholder="Currency (USD, EUR, GBP...)"
              placeholderTextColor={colors.gray}
              value={currency}
              onChangeText={setCurrency}
              style={styles.input}
              autoCapitalize="characters"
            />

            <TextInput
              placeholder="IBAN (for IBAN countries)"
              placeholderTextColor={colors.gray}
              value={iban}
              onChangeText={setIban}
              style={styles.input}
              autoCapitalize="characters"
            />

            <TextInput
              placeholder="BIC / SWIFT"
              placeholderTextColor={colors.gray}
              value={bic}
              onChangeText={setBic}
              style={styles.input}
              autoCapitalize="characters"
            />

            <TextInput
              placeholder="Account Number (non-IBAN countries)"
              placeholderTextColor={colors.gray}
              value={accountNumber}
              onChangeText={setAccountNumber}
              style={styles.input}
            />

            <TextInput
              placeholder="Routing Number / ABA / Sort Code"
              placeholderTextColor={colors.gray}
              value={routingNumber}
              onChangeText={setRoutingNumber}
              style={styles.input}
            />

            <TouchableOpacity
              disabled={!canSaveBeneficiary || savingBeneficiary}
              onPress={saveBeneficiary}
              style={[
                styles.secondaryBtn,
                (!canSaveBeneficiary || savingBeneficiary) && styles.disabledBtn,
              ]}
            >
              <Text style={styles.secondaryBtnText}>
                {savingBeneficiary ? "SAVING..." : "SAVE BENEFICIARY"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(method === "BTC" || method === "ETH") && (
          <View style={styles.card}>
            <Text style={styles.title}>Crypto payout</Text>

            <Text style={styles.label}>Network</Text>
            {CRYPTO_NETWORKS[method].map((network) => {
              const active = cryptoNetwork === network;

              return (
                <TouchableOpacity
                  key={network}
                  onPress={() => setCryptoNetwork(network)}
                  style={[
                    styles.methodBtn,
                    active && styles.methodSelected,
                  ]}
                >
                  <Text style={styles.methodText}>{network}</Text>
                </TouchableOpacity>
              );
            })}

            <TextInput
              placeholder="Wallet address"
              placeholderTextColor={colors.gray}
              value={cryptoAddress}
              onChangeText={setCryptoAddress}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => setConfirmRisk(!confirmRisk)}
              style={styles.checkbox}
            >
              <Text style={styles.checkboxText}>
                {confirmRisk ? "☑" : "☐"} I understand crypto payouts are irreversible
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canSaveBeneficiary || savingBeneficiary}
              onPress={saveBeneficiary}
              style={[
                styles.secondaryBtn,
                (!canSaveBeneficiary || savingBeneficiary) && styles.disabledBtn,
              ]}
            >
              <Text style={styles.secondaryBtnText}>
                {savingBeneficiary ? "SAVING..." : "SAVE BENEFICIARY"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={submitPayout}
          style={[
            styles.submitBtn,
            (!canSubmit || submitting) && styles.disabledBtn,
          ]}
        >
          <Text style={styles.submitText}>
            {submitting ? "REQUESTING..." : "REQUEST PAYOUT"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { backgroundColor: "transparent" },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  card: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  title: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },

  label: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  helperText: {
    color: colors.gray,
    marginBottom: spacing.sm,
  },

  splitLine: {
    color: colors.gray,
    marginTop: 4,
  },

  splitValue: {
    color: colors.white,
    fontWeight: "800",
  },

  methodBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    marginBottom: spacing.sm,
  },

  methodSelected: {
    backgroundColor: "rgba(212,175,55,0.15)",
  },

  methodText: {
    color: colors.white,
    fontWeight: "700",
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

  checkbox: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  checkboxText: {
    color: colors.white,
  },

  secondaryBtn: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.10)",
  },

  secondaryBtnText: {
    color: colors.gold,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  submitBtn: {
    marginTop: spacing.lg,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
  },

  submitText: {
    color: "#000",
    fontWeight: "900",
    letterSpacing: 1,
  },

  disabledBtn: {
    opacity: 0.4,
  },

  infoText: {
    color: colors.gray,
    marginTop: 4,
    lineHeight: 20,
  },

  goldText: {
    color: colors.gold,
    marginTop: 6,
  },

  okText: {
    color: colors.green,
    marginTop: 4,
  },

  errorText: {
    color: colors.red,
    marginTop: 4,
    lineHeight: 20,
  },
});