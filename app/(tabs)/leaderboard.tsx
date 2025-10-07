import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Removed PanGestureHandler import - using PanResponder instead
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../util/axios";

type LeaderboardEntry = {
  place: string;
  person: string;
  found: number;
  animalType?: string;
  profilePicture?: string;
};

type AnimalType = {
  name: string;
  count: number;
};

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("overall");
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle URL parameters for direct animal type navigation
  useEffect(() => {
    if (params.animalType && typeof params.animalType === 'string') {
      setSelectedTab(params.animalType);
    }
  }, [params.animalType]);

  // Load available animal types on mount
  useEffect(() => {
    const loadAnimalTypes = async () => {
      // Only load if user is authenticated
      if (!token) return;
      
      try {
        const res = await api.get("/api/leaderboard/animals/types");
        const types = res.data.map((animal: string) => ({ name: animal, count: 0 }));
        setAnimalTypes(types);
      } catch (err) {
        console.error("Failed to load animal types:", err);
        // Don't show error popup for animal types, just log it
      }
    };
    loadAnimalTypes();
  }, [token]);

  // Load leaderboard data
  const loadData = async (isRefresh = false) => {
    // Don't load data if user is not authenticated
    if (!token) {
      setData([]);
      setError(null);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      let res;
      if (selectedTab === "overall") {
        res = await api.get("/api/leaderboard");
      } else {
        res = await api.get(`/api/leaderboard/${encodeURIComponent(selectedTab)}`);
      }
      
      const leaderboardData = res.data.map((r: any, i: number) => ({
        place: `#${i + 1}`,
        person: r.username,
        found: r.count,
        animalType: selectedTab !== "overall" ? selectedTab : undefined
      }));
      
      setData(leaderboardData);
    } catch (err: any) {
      // Check if it's an authentication error
      if (err.response?.status === 401 || err.message?.includes('token') || err.message?.includes('auth')) {
        setError("Authentication required");
        setData([]);
        // Don't show alert for auth errors during logout
        return;
      }
      
      setError(err.message || "Failed to load leaderboard");
      setData([]);
      if (!isRefresh) {
        Alert.alert("Error", "Failed to load leaderboard data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadData(true);
  };

  // Get animal emoji for display
  const getAnimalEmoji = (animal: string): string => {
    const emojiMap: { [key: string]: string } = {
      "Raccoon": "🦝",
      "Squirrel": "🐿️",
      "Bear": "🐻",
      "Pigeon": "🕊️",
      "Crow": "🐦‍⬛",
      "Goose": "🪿",
    };
    return emojiMap[animal] || "🐾";
  };

  // Load data when tab changes
  useEffect(() => {
    loadData();
  }, [selectedTab, token]);

  // Refresh data when component focuses (screen opens)
  useEffect(() => {
    const unsubscribe = () => {
      loadData();
    };
    
    // Call immediately when component mounts
    loadData();
    
    return unsubscribe;
  }, []);

  const renderTab = (tabName: string, label: string) => (
    <TouchableOpacity
      key={tabName}
      style={[
        styles.tabButton,
        selectedTab === tabName ? styles.tabActive : styles.tabInactive
      ]}
      onPress={() => setSelectedTab(tabName)}
    >
      <Text style={[
        styles.tabText,
        selectedTab === tabName ? styles.tabTextActive : styles.tabTextInactive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rowStyle = [
      styles.row,
      index === 0 && styles.firstPlace,
      index === 1 && styles.secondPlace,
      index === 2 && styles.thirdPlace,
    ];
    
    return (
      <View style={rowStyle}>
        <Text style={styles.place}>{item.place}</Text>
        <TouchableOpacity 
          style={styles.personContainer}
          onPress={() => {
            // Navigate to person's profile
            router.push({
              pathname: "/person-profile",
              params: { username: item.person, from: "leaderboard" }
            });
          }}
        >
          <View style={styles.personInfo}>
            {item.profilePicture ? (
              <Image 
                source={{ uri: item.profilePicture }} 
                style={styles.leaderboardAvatar}
              />
            ) : (
              <View style={styles.leaderboardAvatarPlaceholder}>
                <Text style={styles.leaderboardInitial}>
                  {item.person.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.person}>{item.person}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.found}>{item.found}</Text>
      </View>
    );
  };

  // Check if we're viewing a specific animal type
  const isViewingSpecificAnimal = selectedTab !== "overall" && selectedTab !== "other";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabContainer}>
        {isViewingSpecificAnimal ? (
          /* Animal-specific header */
          <View style={styles.animalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={styles.animalInfo}>
              <Text style={styles.animalEmoji}>{getAnimalEmoji(selectedTab)}</Text>
              <Text style={styles.animalName}>{selectedTab}</Text>
            </View>
            <View style={styles.backButton} />
          </View>
        ) : (
          /* Tab Navigation */
          <View style={styles.tabRow}>
            <View style={styles.tabsContainer}>
              {renderTab("overall", "Overall")}
              <TouchableOpacity
                style={[styles.tabButton, styles.otherTabButton]}
                onPress={() => router.push("/other")}
              >
                <Text style={[styles.tabText, styles.otherTabText]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4A373" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setSelectedTab(selectedTab)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Leaderboard Data */}
        {!loading && !error && (
          <FlatList
            data={data}
            keyExtractor={(item, index) => `${item.person}-${index}`}
            renderItem={renderLeaderboardItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#D4A373"]}
                tintColor="#D4A373"
              />
            }
            ListHeaderComponent={() => (
              <View style={styles.header}>
                <Text style={styles.headerText}>Rank</Text>
                <Text style={styles.headerText}>Player</Text>
                <Text style={styles.headerText}>Score</Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedTab === "overall" 
                    ? "No captures found yet" 
                    : `No ${selectedTab} captures found yet`
                  }
                </Text>
              </View>
            )}
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
    padding: 16,
  },
  tabContainer: {
    flex: 1,
  },
  tabRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 4,
  },
  tabActive: {
    backgroundColor: "#D4A373",
  },
  tabInactive: {
    backgroundColor: "#E9EDC9",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "white",
  },
  tabTextInactive: {
    color: "#666",
  },
  otherTabButton: {
    backgroundColor: "#E9EDC9",
    borderWidth: 1,
    borderColor: "#D4A373",
  },
  otherTabText: {
    color: "#D4A373",
    fontWeight: "600",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDC9",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: "transparent",
  },
  firstPlace: {
    backgroundColor: "#FFD700", // Gold for first place
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondPlace: {
    backgroundColor: "#C0C0C0", // Silver for second place
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thirdPlace: {
    backgroundColor: "#CD7F32", // Bronze for third place
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  place: {
    fontSize: 16,
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
  },
  personContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  person: {
    fontSize: 16,
    fontWeight: "500",
    color: "#D4A373",
  },
  found: {
    fontSize: 16,
    width: 60,
    textAlign: "right",
    fontWeight: "600",
    color: "#D4A373",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  animalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDC9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  animalInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  animalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  animalName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  personInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  leaderboardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  leaderboardAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  leaderboardInitial: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
});
