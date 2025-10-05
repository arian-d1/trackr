import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mockData as myAnimals } from "../../assets/mockData";
import { friendsMockData } from "../../assets/mockFriendData"; // new file

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
  const [selectedTab, setSelectedTab] = useState<"animals" | "friends">(
    "animals",
  );
  const [loading, setLoading] = useState(false);

  const data = selectedTab === "animals" ? myAnimals : friendsMockData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Map (background) */}
        {Platform.OS !== "web" && MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 49.2827,
              longitude: -123.1207,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {data.map((item, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                }}
                anchor={{ x: 0.5, y: 0.7 }}
              >
                {selectedTab === "animals" ? (
                  <Image
                    source={item.image}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={item.profilePic}
                    style={styles.profilePic}
                    resizeMode="cover"
                  />
                )}

                <Callout tooltip>
                  <View style={styles.callout}>
                    {selectedTab === "friends" && item.foundBy ? (
                      <Text style={styles.calloutText}>
                        {item.foundBy} recently found a {item.animal}
                      </Text>
                    ) : (
                      <Text style={styles.calloutText}>{item.animal}</Text>
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

        {loading && Platform.OS !== "web" && (
          <View style={styles.loading}>
            <Text>Loading...</Text>
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
});
