import { IconSymbol } from "@/components/ui/icon-symbol";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_PEEK_HEIGHT = 100;

export default function CameraScreen() {
    
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const sheetTranslation = useSharedValue(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslation.value }],
  }));

  const cameraAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  if (!permission) {
    return <Text>Loading permissions...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraType = () => {
    setFacing((facing) => (facing === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      console.log("Photo URI:", photo.uri);
    }
  };

  const toggleSheet = () => {
    if (sheetTranslation.value < SCREEN_HEIGHT / 2) {
      sheetTranslation.value = withSpring(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);
    } else {
      sheetTranslation.value = withSpring(0);
    }
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslation = sheetTranslation.value + event.translationY;
      if (newTranslation >= 0 && newTranslation <= SCREEN_HEIGHT - SHEET_PEEK_HEIGHT) {
        sheetTranslation.value = newTranslation;
      }
    })
    .onEnd(() => {
      if (sheetTranslation.value < SCREEN_HEIGHT / 2) {
        sheetTranslation.value = withSpring(0);
      } else {
        sheetTranslation.value = withSpring(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, cameraAnimatedStyle]}>
          <CameraView
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            facing={facing}
          >
            <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
              <TouchableOpacity
                style={styles.utilButton}
                onPress={toggleCameraType}
              >
                <IconSymbol
                  name="arrow.triangle.2.circlepath"
                  size={32}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.utilButton}
                onPress={toggleSheet}
              >
                <IconSymbol
                  name="arrow.down"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
            </Animated.View>
          </CameraView>
        </Animated.View>

        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />
            <Text
              style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}
            >
              Inventory
            </Text>
            <ScrollView>
              {[...Array(20)].map((_, i) => (
                <Text key={i} style={{ padding: 10 }}>
                  Item {i + 1}
                </Text>
              ))}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 20,
  },
  utilButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00000060",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#00000040",
  },
  captureButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#00000020",
  },
 
  bottomSheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    paddingTop: 40,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    paddingBottom: 20,
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  button: {
    padding: 15,
    backgroundColor: "#00000080",
    borderRadius: 10,
  },
  text: { color: "white", fontSize: 18 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});