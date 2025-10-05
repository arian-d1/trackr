import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[galleryStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={galleryStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={galleryStyles.backButton}
        >
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={galleryStyles.content}>
        {/* Gallery Header */}
        <View style={galleryStyles.galleryHeader}>
          <Text style={galleryStyles.galleryTitle}>Your Gallery</Text>
          <Text style={galleryStyles.gallerySubtitle}>
            View all of your animal photos.
          </Text>
        </View>

        {/* Empty State */}
        <View style={galleryStyles.emptyState}>
          <IconSymbol name="photo.on.rectangle" size={80} color="#CCD5AE" />
          <Text style={galleryStyles.emptyTitle}>No Photos Yet</Text>
          <Text style={galleryStyles.emptyDescription}>
            Start capturing animals to build your gallery
          </Text>
          <TouchableOpacity
            style={galleryStyles.cameraButton}
            onPress={() => router.push("/(tabs)/camera")}
          >
            <IconSymbol name="camera.fill" size={24} color="white" />
            <Text style={galleryStyles.cameraButtonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const galleryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFAE0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  galleryHeader: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  galleryTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  gallerySubtitle: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  cameraButton: {
    flexDirection: "row",
    backgroundColor: "#D4A373",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  cameraButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
});
