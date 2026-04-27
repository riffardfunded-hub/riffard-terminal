import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import ContractModal from "../components/ContractModal";
import {
    acceptInstitutionalContract,
    loadInstitutionalState,
} from "../core/institutional/service";

import {
    RIFFARD_INSTITUTIONAL_CONTRACT_FR,
} from "../core/legal/RiffardInstitutionalAgreement.fr";

import { InstitutionalState } from "../core/institutional/types";

// ⚠️ À remplacer plus tard par ton vrai userId (auth / backend)
const USER_ID = "local-user";

export default function InstitutionalAccessScreen() {
  const [state, setState] = useState<InstitutionalState | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadInstitutionalState(USER_ID).then(setState);
  }, []);

  if (!state) {
    return (
      <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "white" }}>Chargement…</Text>
      </View>
    );
  }

  const canActivate =
    state.tier === "ELIGIBLE_85" || state.tier === "ELIGIBLE_95";

  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 20 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
        {state.rScore}%
      </Text>

      <Text style={{ color: "white", marginTop: 8 }}>
        Statut : {state.tier}
      </Text>

      <Text style={{ color: "white", marginTop: 8 }}>
        Salaire : {state.monthlySalaryUsd} $
      </Text>

      {canActivate && (
        <TouchableOpacity onPress={() => setOpen(true)}>
          <Text style={{ color: "#D4AF37", marginTop: 20, fontWeight: "700" }}>
            Activer l’accès Institutional
          </Text>
        </TouchableOpacity>
      )}

      <ContractModal
        visible={open}
        text={RIFFARD_INSTITUTIONAL_CONTRACT_FR}
        onClose={() => setOpen(false)}
        onAccept={async () => {
          const next = await acceptInstitutionalContract(
            USER_ID,
            RIFFARD_INSTITUTIONAL_CONTRACT_FR
          );
          setState(next);
          setOpen(false);
        }}
      />
    </View>
  );
}
