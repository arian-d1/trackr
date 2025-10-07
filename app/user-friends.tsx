import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

type Friend = {
  id: string;
  username: string;
  name: string;
  animalsFound: number;
  profilePicture?: string;
};

export default function UserFriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username as string;
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      loadUserFriends();
    }
  }, [username]);

  const loadUserFriends = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/friends/${encodeURIComponent(username)}`);
      const friendsList = response.data.map((f: any) => {
        const a = f.friend_id_1;
        const b = f.friend_id_2;
        const other = a.username === username ? b : a;
        return { 
          id: f._id, 
          username: other.username,
          name: other.username,
          animalsFound: 0, // We could fetch this if needed
          profilePicture: other.profilePicture
        };
      });
      setFriends(friendsList);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to load friends";
      setError(errorMessage);
      console.error("Failed to load user friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => {
        // Navigate to friend's profile
        router.push({
          pathname: "/person-profile",
          params: { username: item.username, from: "user-friends" }
        });
      }}
    >
      <View style={styles.friendAvatar}>
        {item.profilePicture ? (
          <Image 
            source={{ uri: item.profilePicture }} 
            style={styles.friendProfileImage}
          />
        ) : (
          <Text style={styles.friendInitial}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStats}>
          {item.animalsFound} animals found
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#CCD5AE" />
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
            <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username}'s Friends</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading friends...</Text>
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
          <Text style={styles.headerTitle}>{username}'s Friends</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserFriends}
          >
            <Text style={styles.retryText}>Retry</Text>
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
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username}'s Friends</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.2" size={64} color="#CCD5AE" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>
              {username} hasn't added any friends yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        )}
        <View style={{ height: 40 }} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  friendInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  friendProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9EDC9",
    marginLeft: 86,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
