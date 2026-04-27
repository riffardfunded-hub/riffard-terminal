import { ResizeMode, Video } from "expo-av";
import { StyleSheet, View } from "react-native";

export default function BackgroundVideo() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Video
        source={require("../assets/welcome.mp4")}
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
