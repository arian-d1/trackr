import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

type AnimalType = {
  name: string;
  count: number;
};

export default function OtherScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimalTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all possible animal types from configuration
        const allTypesResponse = await api.get("/api/leaderboard/animals/all-types");
        const allTypes = allTypesResponse.data;
        
        // Fetch only animal types that have actual captures
        const capturedTypesResponse = await api.get("/api/leaderboard/animals/types");
        const capturedTypes = capturedTypesResponse.data;
        
        // Filter to only show animals that have captures
        const availableTypes = allTypes.filter((animal: string) => 
          capturedTypes.includes(animal)
        );
        
        const types = availableTypes.map((animal: string) => ({ name: animal, count: 0 }));
        setAnimalTypes(types);
      } catch (err: any) {
        setError(err.message || "Failed to load animal types");
        console.error("Failed to load animal types:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnimalTypes();
  }, []);

  const navigateToAnimalLeaderboard = (animalName: string) => {
    router.push({
      pathname: "/(tabs)/leaderboard",
      params: { animalType: animalName }
    });
  };

  const renderAnimalType = ({ item }: { item: AnimalType }) => (
    <TouchableOpacity
      style={styles.animalCard}
      onPress={() => navigateToAnimalLeaderboard(item.name)}
    >
      <View style={styles.animalIcon}>
        <Text style={styles.animalEmoji}>
          {getAnimalEmoji(item.name)}
        </Text>
      </View>
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <Text style={styles.animalSubtext}>View leaderboard</Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#666" />
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

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Animal Types</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading animal types...</Text>
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
            <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Animal Types</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                // Fetch all possible animal types from configuration
                const allTypesResponse = await api.get("/api/leaderboard/animals/all-types");
                const allTypes = allTypesResponse.data;
                
                // Fetch only animal types that have actual captures
                const capturedTypesResponse = await api.get("/api/leaderboard/animals/types");
                const capturedTypes = capturedTypesResponse.data;
                
                // Filter to only show animals that have captures
                const availableTypes = allTypes.filter((animal: string) => 
                  capturedTypes.includes(animal)
                );
                
                const types = availableTypes.map((animal: string) => ({ name: animal, count: 0 }));
                setAnimalTypes(types);
              } catch (err: any) {
                setError(err.message || "Failed to load animal types");
                console.error("Failed to load animal types:", err);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Animal Types</Text>
        <View style={styles.backButton} />
      </View>

      {/* Animal Types List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Animals</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any animal to view its leaderboard
          </Text>
        </View>

        <FlatList
          data={animalTypes}
          keyExtractor={(item) => item.name}
          renderItem={renderAnimalType}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Trackr 2025. All Rights Reserved.
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDC9",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  animalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  animalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  animalEmoji: {
    fontSize: 24,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  animalSubtext: {
    fontSize: 14,
    color: "#666",
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#D4A373",
  },
});
