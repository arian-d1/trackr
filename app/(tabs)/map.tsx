import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { mockData } from "../../assets/mockData"; // Use mock data for now

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
  image?: any; // For local mock images
  imageUrl?: string; // For API images
};

export default function TabTwoScreen() {
  const [animals, setAnimals] = useState<Animal[]>(mockData); // Start with mock data
  const [loading, setLoading] = useState(false);

  // Uncomment this block when your API is ready
  /*
  useEffect(() => {
    async function fetchAnimals() {
      setLoading(true);
      try {
        const response = await fetch("https://your-api.com/users/123/animals");
        const data = await response.json();
        setAnimals(data);
      } catch (err) {
        console.error("Failed to fetch animals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnimals();
  }, []);
  */

  return (
    <ThemedView style={styles.container}>
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
          {animals.map((item, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              anchor={{ x: 0.5, y: 0.8 }} // Closer to icon
            >
              {item.image ? (
                <Image
                  source={item.image}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              ) : item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              ) : null}

              {/* Classic callout with arrow */}
              <Callout>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutText}>{item.animal}</Text>
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

      {loading && Platform.OS !== "web" && (
        <View style={styles.loading}>
          <Text>Loading animals...</Text>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  calloutBox: {
    backgroundColor: "white",
    minWidth: 100,
    maxWidth: 500,
    // Wider box to fit full text
  },
  calloutText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
