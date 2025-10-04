import { IconSymbol } from '@/components/ui/icon-symbol';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");

  // useCameraPermissions hook returns [permission, requestPermission]
  const [permission, requestPermission] = useCameraPermissions();

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
    setFacing(facing => (facing === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      console.log("Photo URI:", photo.uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={(ref) => setCameraRef(ref)}
        style={{ flex: 1 }}
        facing={facing}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Empty view for spacing symmetry */}
          <View style={{ width: 60 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00000060",
    justifyContent: "center",
    alignItems: "center",
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
  button: {
    padding: 15,
    backgroundColor: "#00000080",
    borderRadius: 10,
  },
  text: { color: "white", fontSize: 18 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});