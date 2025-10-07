import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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

export default function AnimalGalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { username, animalType, from } = params as {
    username: string;
    animalType: string;
    from: string;
  };

  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAnimalEmoji = (animal: string) => {
    const emojiMap: { [key: string]: string } = {
      "Bear": "🐻",
      "Crow": "🐦‍⬛",
      "Goose": "🪿",
      "Pigeon": "🕊️",
      "Raccoon": "🦝",
      "Squirrel": "🐿️",
    };
    return emojiMap[animal] || "🐾";
  };

  const loadAnimalCaptures = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/captures/${username}`);
      const allCaptures = response.data;
      
      // Filter captures by animal type
      const filteredCaptures = allCaptures.filter((capture: Capture) => 
        capture.animal.toLowerCase() === animalType.toLowerCase()
      );
      
      setCaptures(filteredCaptures);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to load captures";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username && animalType) {
      loadAnimalCaptures();
    }
  }, [username, animalType]);

  const renderCapture = ({ item }: { item: Capture }) => (
    <TouchableOpacity 
      style={styles.captureItem}
      onPress={() => {
        router.push({
          pathname: "/animal-detail",
          params: {
            animal: item.animal,
            rating: item.rating.toString(),
            foundBy: username,
            foundByUsername: username,
            capturedAt: item.capturedAt,
            photo: item.photo,
            latitude: item.latitude.toString(),
            longitude: item.longitude.toString(),
            from: "animal-gallery"
          }
        });
      }}
    >
      <Image source={{ uri: item.photo }} style={styles.captureImage} />
      <View style={styles.captureInfo}>
        <Text style={styles.ratingText}>Rating: {item.rating}</Text>
        <Text style={styles.dateText}>
          {new Date(item.capturedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{animalType} Gallery</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading captures...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{animalType} Gallery</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color="#CCD5AE" />
          <Text style={styles.errorText}>Error</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadAnimalCaptures}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{getAnimalEmoji(animalType)} {animalType}</Text>
          <Text style={styles.headerSubtitle}>by {username}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {captures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{getAnimalEmoji(animalType)}</Text>
            <Text style={styles.emptyText}>No {animalType} captures found</Text>
            <Text style={styles.emptySubtext}>
              {username} hasn't captured any {animalType.toLowerCase()}s yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={captures}
            renderItem={renderCapture}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={styles.capturesGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFAE0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#D4A373",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  capturesGrid: {
    paddingBottom: 20,
  },
  captureItem: {
    flex: 1,
    margin: 8,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  captureImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  captureInfo: {
    padding: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
});
