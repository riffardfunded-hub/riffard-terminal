import { ResizeMode, Video } from "expo-av";
import { Platform, StyleSheet, View } from "react-native";

export default function BackgroundVideo() {
  if (Platform.OS === "web") {
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            overflow: "hidden",
            zIndex: -1,
          },
        ]}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          <source src="/welcome.mp4" type="video/mp4" />
        </video>
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          overflow: "hidden",
        },
      ]}
    >
      <Video
        source={require("../assets/welcome.mp4")}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        ignoreSilentSwitch="obey"
      />
    </View>
  );
}