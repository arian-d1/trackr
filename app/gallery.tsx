import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

type Capture = {
  _id: string;
  animal: string;
  photo: string;
  rating: number;
  capturedAt: string;
  latitude: number;
  longitude: number;
};

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserCaptures();
    }
  }, [user]);

  const loadUserCaptures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/captures/${user?.username}`);
      setCaptures(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load captures");
      console.error("Error loading captures:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCapture = ({ item }: { item: Capture }) => (
    <TouchableOpacity
      style={galleryStyles.captureItem}
      onPress={() => {
        router.push({
          pathname: "/animal-detail",
          params: {
            animal: item.animal,
            rating: item.rating.toString(),
            foundBy: user?.username || "",
            foundByUsername: user?.username || "",
            capturedAt: item.capturedAt,
            photo: item.photo,
            latitude: item.latitude.toString(),
            longitude: item.longitude.toString(),
            from: "gallery"
          }
        });
      }}
    >
      <View style={galleryStyles.captureImageContainer}>
        {item.photo ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
            style={galleryStyles.captureImage}
            resizeMode="cover"
          />
        ) : (
          <View style={galleryStyles.capturePlaceholder}>
            <Text style={galleryStyles.captureEmoji}>
              {getAnimalEmoji(item.animal)}
            </Text>
          </View>
        )}
        <View style={[galleryStyles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
          <Text style={galleryStyles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      <View style={galleryStyles.captureInfo}>
        <Text style={galleryStyles.captureAnimal}>{item.animal}</Text>
        <Text style={galleryStyles.captureDate}>
          {new Date(item.capturedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getAnimalEmoji = (animalName: string): string => {
    const emojiMap: { [key: string]: string } = {
      "Raccoon": "🦝",
      "Squirrel": "🐿️",
      "Bear": "🐻",
      "Pigeon": "🕊️",
      "Crow": "🐦‍⬛",
      "Goose": "🪿",
      "Dog": "🐕"
    };
    return emojiMap[animalName] || "🐾";
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 80) return "#4CAF50";
    if (rating >= 60) return "#FF9800";
    if (rating >= 40) return "#FFC107";
    return "#F44336";
  };

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
        <Text style={galleryStyles.headerTitle}>Your Gallery</Text>
        <View style={galleryStyles.backButton} />
      </View>

      <ScrollView style={galleryStyles.content}>
        {/* Gallery Header */}
        <View style={galleryStyles.galleryHeader}>
          <Text style={galleryStyles.galleryTitle}>Your Gallery</Text>
          <Text style={galleryStyles.gallerySubtitle}>
            View all of your animal photos.
          </Text>
        </View>

        {loading ? (
          <View style={galleryStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4A373" />
            <Text style={galleryStyles.loadingText}>Loading your captures...</Text>
          </View>
        ) : error ? (
          <View style={galleryStyles.errorContainer}>
            <Text style={galleryStyles.errorText}>{error}</Text>
            <TouchableOpacity
              style={galleryStyles.retryButton}
              onPress={loadUserCaptures}
            >
              <Text style={galleryStyles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : captures.length > 0 ? (
          <View style={galleryStyles.galleryContainer}>
            <FlatList
              data={captures}
              renderItem={renderCapture}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={galleryStyles.capturesGrid}
            />
          </View>
        ) : (
          <View style={galleryStyles.emptyState}>
            <IconSymbol name="photo.on.rectangle" size={80} color="#CCD5AE" />
            <Text style={galleryStyles.emptyTitle}>No Photos Yet</Text>
            <Text style={galleryStyles.emptyDescription}>
              Start capturing animals to build your gallery
            </Text>
            <TouchableOpacity
              style={galleryStyles.cameraButton}
              onPress={() => router.push("/(tabs)/")}
            >
              <IconSymbol name="camera.fill" size={24} color="white" />
              <Text style={galleryStyles.cameraButtonText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#D9534F",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#D4A373",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
  galleryContainer: {
    paddingHorizontal: 20,
  },
  capturesGrid: {
    paddingBottom: 10,
  },
  captureItem: {
    flex: 1,
    margin: 4,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  captureImageContainer: {
    position: "relative",
    height: 120,
  },
  captureImage: {
    width: "100%",
    height: "100%",
  },
  capturePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E9EDC9",
    justifyContent: "center",
    alignItems: "center",
  },
  captureEmoji: {
    fontSize: 32,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  captureInfo: {
    padding: 12,
  },
  captureAnimal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  captureDate: {
    fontSize: 12,
    color: "#666",
  },
});
