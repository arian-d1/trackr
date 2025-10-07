import { ThemedView } from "@/components/themed-view";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";
// Removed PanGestureHandler import - using PanResponder instead
import { useAuth } from "@/context/AuthContext";
import api from "../util/axios";

let MapView: any;
let Marker: any;
let Callout: any;

if (Platform.OS !== "web") {
  const RNMaps = require("react-native-maps");
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  Callout = RNMaps.Callout;
}

type Animal = {
  latitude: number;
  longitude: number;
  animal: string;
  image?: any; // animal image
  profilePic?: any; // friend's profile photo
  foundBy?: string;
};

export default function TabTwoScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"animals" | "friends">(
    "animals",
  );
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
      } else {
        console.log("Location permission denied");
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Refresh function to reload data (useful for periodic updates)
  const refreshData = async () => {
    // Don't load data if user is not authenticated
    if (!token) {
      setRecent([]);
      setFriends([]);
      return;
    }

    try {
      setLoading(true);
      const [recentRes, friendsRes] = await Promise.all([
        api.get("/api/map/recent"),
        api.get("/api/map/friends")
      ]);
      
      // Filter out animals older than 48 hours
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const filteredRecent = recentRes.data.filter((animal: any) => {
        const capturedAt = new Date(animal.capturedAt);
        return capturedAt >= fortyEightHoursAgo;
      });
      
      setRecent(filteredRecent);
      setFriends(friendsRes.data); // Friends locations remain unchanged
    } catch (e) {
      console.error("Failed to refresh map data:", e);
      // Don't show error popup for map data refresh failures
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    refreshData();
  }, [token]);

  const data = selectedTab === "animals" ? recent : friends;

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

  const handleAnimalPress = (animal: any) => {
    router.push({
      pathname: "/animal-detail",
      params: {
        animal: animal.animal,
        rating: animal.rating.toString(),
        foundBy: animal.foundBy,
        foundByUsername: animal.foundByUsername,
        capturedAt: animal.capturedAt,
        photo: animal.photo,
        latitude: animal.latitude.toString(),
        longitude: animal.longitude.toString(),
        from: "map"
      }
    });
  };

  const handlePersonPress = (person: any) => {
    router.push({
      pathname: "/person-profile",
      params: { username: person.username, from: "map" }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Map (background) */}
        {Platform.OS !== "web" && MapView ? (
          <MapView
            style={styles.map}
            region={userLocation ? {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : {
              latitude: 49.2827,
              longitude: -122.9202,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
          >
            {data.map((item, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                }}
                anchor={{ x: 0.5, y: 0.7 }}
                onPress={() => selectedTab === "animals" ? handleAnimalPress(item) : handlePersonPress(item)}
              >
                {selectedTab === "animals" ? (
                  <View style={styles.animalMarker}>
                    <Text style={styles.animalEmoji}>{getAnimalEmoji(item.animal)}</Text>
                    <View style={[styles.ratingBadge, { backgroundColor: item.rating >= 80 ? "#4CAF50" : item.rating >= 60 ? "#FF9800" : "#FFC107" }]}>
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.personMarker}>
                    <View style={styles.personAvatar}>
                      {item.profilePicture ? (
                        <Image 
                          source={{ uri: item.profilePicture }} 
                          style={styles.personProfileImage}
                        />
                      ) : (
                        <Text style={styles.personInitial}>
                          {item.displayName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                <Callout tooltip>
                  <View style={styles.callout}>
                    {selectedTab === "animals" ? (
                      <View>
                        <Text style={styles.calloutText}>{item.animal}</Text>
                        <Text style={styles.calloutSubtext}>Found by {item.foundBy}</Text>
                        <Text style={styles.calloutSubtext}>Rating: {item.rating}/100</Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.calloutText}>{item.displayName}</Text>
                        <Text style={styles.calloutSubtext}>@{item.username}</Text>
                        <Text style={styles.calloutSubtext}>
                          Last seen: {new Date(item.lastSeen).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.map}>
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              Map is not available on web
            </Text>
          </View>
        )}

        {/* Floating Toggle Bar (transparent background) */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              selectedTab === "animals" && styles.toggleSelected,
            ]}
            onPress={() => setSelectedTab("animals")}
          >
            <Text
              style={[
                styles.toggleText,
                selectedTab === "animals" && styles.toggleTextSelected,
              ]}
            >
              My Animals
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleButton,
              selectedTab === "friends" && styles.toggleSelected,
            ]}
            onPress={() => setSelectedTab("friends")}
          >
            <Text
              style={[
                styles.toggleText,
                selectedTab === "friends" && styles.toggleTextSelected,
              ]}
            >
              Friends
            </Text>
          </Pressable>
        </View>

        {(loading || (locationPermission === null)) && Platform.OS !== "web" && (
          <View style={styles.loading}>
            <Text>{locationPermission === null ? "Getting your location..." : "Loading..."}</Text>
          </View>
        )}

        {!loading && data.length === 0 && Platform.OS !== "web" && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {selectedTab === "animals" 
                ? "No recent animal captures found" 
                : "No friends with locations found"
              }
            </Text>
          </View>
        )}

        {locationPermission === "denied" && Platform.OS !== "web" && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Location permission denied. Please enable location access to see your position on the map.
            </Text>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // no background behind map
  },
  map: { flex: 1 },
  toggleContainer: {
    position: "absolute",
    top: 50, // below camera / notch
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "transparent", // see map through
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.7)", // subtle translucent
  },
  toggleSelected: {
    backgroundColor: "rgba(150, 150, 150, 0.4)",
    borderColor: "rgba(150, 150, 150, 0.4)",
  },
  toggleText: {
    color: "#333",
    fontWeight: "500",
  },
  toggleTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  callout: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderColor: "#ccc",
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
  },
  calloutText: {
    fontWeight: "500",
    textAlign: "center",
    flexWrap: "nowrap",
    fontSize: 16,
  },
  calloutSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  loading: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
  },
  animalMarker: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  animalEmoji: {
    fontSize: 32,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#D4A373",
  },
  ratingBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  ratingText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  personMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  personInitial: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  personProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  emptyState: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    marginHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
