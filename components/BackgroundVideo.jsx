import { ResizeMode, Video } from "expo-av";
import { Platform, StyleSheet, View } from "react-native";

export default function BackgroundVideo() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Video
        source={
          Platform.OS === "web"
            ? require("../assets/welcome-fixed.mp4")
            : require("../assets/welcome.mp4")
        }
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        ignoreSilentSwitch="obey"
      />
    </View>
  );
}