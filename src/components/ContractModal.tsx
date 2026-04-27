import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ContractModal({
  visible,
  text,
  onAccept,
  onClose,
}: {
  visible: boolean;
  text: string;
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", padding: 20 }}>
        <View style={{ backgroundColor: "#0B0B0D", borderRadius: 16 }}>
          <ScrollView style={{ maxHeight: 500, padding: 16 }}>
            <Text style={{ color: "white", lineHeight: 20 }}>{text}</Text>
          </ScrollView>
          <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1 }}>
              <Text style={{ color: "white", textAlign: "center" }}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={{ flex: 1 }}>
              <Text style={{ color: "#D4AF37", textAlign: "center" }}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
