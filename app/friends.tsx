import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const friends = [
    { id: 1, name: "Warren Chemerika", animalsFound: 4 },
    { id: 2, name: "Yan Xue", animalsFound: 3 },
    { id: 3, name: "Sevy", animalsFound: 2 },
  ];

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Friends List */}
      <ScrollView style={styles.scrollView}>
        {filteredFriends.map((friend) => (
          <View key={friend.id}>
            <TouchableOpacity style={styles.friendItem}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendInitial}>
                  {friend.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendStats}>
                  {friend.animalsFound.toLocaleString()} animals found
                </Text>
              </View>
              <TouchableOpacity style={styles.unfriendButton}>
                <Text style={styles.unfriendText}>Unfriend</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.divider} />
          </View>
        ))}

        {filteredFriends.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="person.2" size={64} color="#CCD5AE" />
            <Text style={styles.emptyText}>No friends found</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Friend Button */}
      <View
        style={[
          styles.addButtonContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity style={styles.addButton}>
          <IconSymbol name="plus" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Friend</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9EDC9",
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  friendInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    color: "#1A1A1A",
    fontWeight: "600",
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    color: "#666",
  },
  unfriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unfriendText: {
    fontSize: 14,
    color: "#D4A373",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9EDC9",
    marginLeft: 91,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: "#FEFAE0",
    borderTopWidth: 1,
    borderTopColor: "#E9EDC9",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#D4A373",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
});
