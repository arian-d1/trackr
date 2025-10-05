import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  uri: string;
  onCancel: () => void;
  onContinue: () => void;
};

export default function PhotoPreview({ uri, onCancel, onContinue }: Props) {
  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} />

      {/* Top-right X button */}
      <TouchableOpacity
        onPress={onCancel}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="xmark" size={18} color="white" />
      </TouchableOpacity>

      {/* Continue button */}
      <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#00000060",
    borderRadius: 50,
    padding: 4,
  },
  continueButton: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  continueText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
});
