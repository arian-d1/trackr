import { StyleSheet, Text, View } from "react-native";

export default function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Text>Inventory Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
