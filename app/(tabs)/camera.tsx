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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function CameraScreen() {
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const insets = useSafeAreaInsets();
  const SHEET_PEEK_HEIGHT = 0; // how much shows when collapsed
  const SHEET_PARTIAL_OPEN = insets.top; // small gap below notch

  const sheetTranslation = useSharedValue(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslation.value }],
    borderTopLeftRadius: interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [20, 20], // keep rounded at all times
      Extrapolate.CLAMP,
    ),
    borderTopRightRadius: interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [20, 20],
      Extrapolate.CLAMP,
    ),
  }));

  const cameraAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP,
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
      Extrapolate.CLAMP,
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
    // If currently collapsed, animate to partially open
    if (sheetTranslation.value > SHEET_PARTIAL_OPEN) {
      sheetTranslation.value = withSpring(SHEET_PARTIAL_OPEN, {
        damping: 100, // higher damping, less bounce
        stiffness: 100,
      }); // optional, makes snap firmer });
    } else {
      // Collapse to peek height
      sheetTranslation.value = withSpring(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT, {
        damping: 100,
        stiffness: 100,
      });
    }
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslation = sheetTranslation.value + event.translationY;
      if (
        newTranslation >= 0 &&
        newTranslation <= SCREEN_HEIGHT - SHEET_PEEK_HEIGHT
      ) {
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
            <Animated.View
              style={[styles.buttonContainer, buttonAnimatedStyle]}
            >
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

              <TouchableOpacity style={styles.utilButton} onPress={toggleSheet}>
                <IconSymbol name="arrow.down" size={28} color="white" />
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
              <View style={styles.gridContainer}>
                {[...Array(20)].map((_, i) => (
                  <View key={i} style={styles.gridItem}>
                    <Text style={styles.gridItemText}>Item {i + 1}</Text>
                  </View>
                ))}
              </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20, // <-- reduced padding
    paddingTop: 10, // <-- small gap above content
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 2, // <-- tiny margin so handle is close to content
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // spread items evenly
    gap: 10,
    paddingBottom: 20,
  },
  gridItem: {
    width: "48%", // ~50% to make 2 items per row with spacing
    aspectRatio: 1, // keep square
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
