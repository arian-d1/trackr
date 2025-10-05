import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const data = [
  { place: "#1", person: "Arian Dotyar", found: 200 },
  { place: "#2", person: "Warren Chemerika", found: 100 },
  { place: "#3", person: "Yan Xue", found: 50 },
  { place: "#4", person: "Sevy", found: 25 },
];

export default function Leaderboard() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <View style={styles.tabsContainer}>
            <Text style={styles.tabActive}>Leaderboard</Text>
            <Text style={styles.tabInactive}>Other</Text>
          </View>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.place}
          renderItem={({ item }) => {
            const rowStyle = [
              styles.row,
              item.place === "#1" && styles.firstPlace,
              item.place === "#2" && styles.thirdPlace,
              item.place === "#3" && styles.secondPlace,
            ];
            return (
              <View style={rowStyle}>
                <Text style={styles.place}>{item.place}</Text>
                <Text style={styles.person}>{item.person}</Text>
                <Text style={styles.found}>{item.found}</Text>
              </View>
            );
          }}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerText}>Place</Text>
              <Text style={styles.headerText}>Person</Text>
              <Text style={styles.headerText}># Found</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 16,
    paddingHorizontal: 16,
  },
  tabActive: {
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "#dfe7d9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabInactive: {
    fontSize: 16,
    color: "#666",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#fdf6e4", // Exact cream background from image
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 16,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: "transparent", // No color for 4th onwards
  },
  firstPlace: {
    backgroundColor: "#d9b8a9", // Peach/tan for Arian (first place)
  },
  secondPlace: {
    backgroundColor: "#dfe7d9", // Light pistachio for second place
  },
  thirdPlace: {
    backgroundColor: "#c2cbb8", // Dark pistachio for third place
  },
  place: {
    fontSize: 16,
    width: 40,
  },
  person: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 16,
  },
  found: {
    fontSize: 16,
    width: 50,
    textAlign: "right",
  },
});
