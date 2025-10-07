import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const { user } = useAuth();

  // Check if a user is already a friend
  const isAlreadyFriend = (username: string): boolean => {
    return friends.some(friend => friend.username === username);
  };

  // Check if someone has sent a friend request to the current user
  const hasPendingRequestFrom = (username: string): boolean => {
    return pendingRequests.some(request => request.friend_id_1?.username === username);
  };

  // Check if current user has sent a friend request to someone
  const hasSentRequestTo = (username: string): boolean => {
    return sentRequests.some(request => request.friend_id_2?.username === username);
  };

  // Fetch pending requests count and data
  const fetchPendingRequestsCount = async () => {
    try {
      if (!user) return;
      const response = await api.get("/api/friends/requests/pending");
      setPendingRequestsCount(response.data.length);
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
      setPendingRequestsCount(0);
      setPendingRequests([]);
    }
  };

  // Fetch sent requests
  const fetchSentRequests = async () => {
    try {
      if (!user) return;
      const response = await api.get("/api/friends/requests/sent");
      setSentRequests(response.data);
    } catch (error) {
      console.error("Error fetching sent requests:", error);
      setSentRequests([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const res = await api.get(`/api/friends/${encodeURIComponent(user.username)}`);
        const mapped = res.data.map((f: any) => {
          const a = f.friend_id_1;
          const b = f.friend_id_2;
          const other = a.username === user.username ? b : a;
          return { 
            id: f._id, 
            name: other.username, // Use username as display name
            username: other.username, // Store username for navigation
            profilePicture: other.profilePicture, // Include profile picture
            animalsFound: 0 
          };
        });
        setFriends(mapped);
        // Also fetch pending requests count and sent requests
        await fetchPendingRequestsCount();
        await fetchSentRequests();
      } catch (e) {
        setFriends([]);
        setPendingRequestsCount(0);
        setSentRequests([]);
      }
    })();
  }, [user?.username]);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
      // Filter out current user from search results
      const filteredResults = response.data.filter((searchUser: any) => 
        searchUser.username !== user?.username
      );
      
      // Fetch capture count for each user
      const resultsWithCounts = await Promise.all(
        filteredResults.map(async (searchUser: any) => {
          try {
            const capturesResponse = await api.get(`/api/captures/${searchUser.username}`);
            return {
              ...searchUser,
              totalCaptures: capturesResponse.data.length
            };
          } catch (error) {
            console.error(`Error fetching captures for ${searchUser.username}:`, error);
            return {
              ...searchUser,
              totalCaptures: 0
            };
          }
        })
      );
      
      setSearchResults(resultsWithCounts);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (username: string) => {
    // Prevent adding yourself as a friend
    if (user && username === user.username) {
      Alert.alert("Error", "You cannot add yourself as a friend!");
      return;
    }

    try {
      await api.post("/api/friends/request", { toUsername: username });
      // Refresh sent requests and pending requests count
      await fetchSentRequests();
      await fetchPendingRequestsCount();
      Alert.alert("Success", `Friend request sent to ${username}!`);
    } catch (error: any) {
      console.error("Friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to send friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  // Remove friend
  const removeFriend = async (username: string) => {
    try {
      await api.delete("/api/friends/remove", { 
        data: { username } 
      });
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.username !== username));
      // Refresh pending requests count
      await fetchPendingRequestsCount();
      Alert.alert("Success", `Removed ${username} from friends!`);
    } catch (error: any) {
      console.error("Remove friend error:", error);
      const errorMessage = error.response?.data?.error || "Failed to remove friend";
      Alert.alert("Error", errorMessage);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      await api.post("/api/friends/accept", { requestId });
      // Refresh friends list and pending requests
      await fetchPendingRequestsCount();
      // Reload friends list
      const res = await api.get(`/api/friends/${encodeURIComponent(user?.username || '')}`);
      const mapped = res.data.map((f: any) => {
        const a = f.friend_id_1;
        const b = f.friend_id_2;
        return a.username === user?.username ? b : a;
      });
      setFriends(mapped);
      Alert.alert("Success", "Friend request accepted!");
    } catch (error: any) {
      console.error("Accept friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to accept friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  // Cancel sent friend request
  const cancelFriendRequest = async (requestId: string) => {
    try {
      await api.delete(`/api/friends/requests/${requestId}`);
      // Refresh sent requests
      await fetchSentRequests();
      Alert.alert("Success", "Friend request cancelled!");
    } catch (error: any) {
      console.error("Cancel friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to cancel friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <TouchableOpacity
          onPress={() => router.push("/friend-requests")}
          style={styles.requestsButton}
        >
          <IconSymbol name="person.badge.plus" size={24} color="#1A1A1A" />
          {pendingRequestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends or add new ones..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.trim()) {
              searchUsers(text);
            } else {
              setShowSearchResults(false);
              setSearchResults([]);
            }
          }}
        />
      </View>

      {/* Search Results */}
      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>Search Results</Text>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((user) => (
                <View key={user._id}>
                  <View style={styles.searchResultItem}>
                    <TouchableOpacity 
                      style={styles.searchResultContent}
                      onPress={() => {
                        // Navigate to user's profile
                        router.push({
                          pathname: "/person-profile",
                          params: { username: user.username, from: "friends" }
                        });
                      }}
                    >
                      <View style={styles.friendAvatar}>
                        {user.profilePicture && user.settings?.privacy?.visibility === 'public' ? (
                          <Image 
                            source={{ uri: user.profilePicture }} 
                            style={styles.friendProfileImage}
                          />
                        ) : (
                          <Text style={styles.friendInitial}>
                            {user.username.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.friendInfo}>
                        <View style={styles.friendNameRow}>
                          <Text style={styles.friendName}>
                            {user.username}
                          </Text>
                          {user.settings?.privacy?.visibility === 'private' && (
                            <View style={styles.privateIndicator}>
                              <IconSymbol name="lock.fill" size={12} color="#666" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.friendStats}>
                          {user.totalCaptures !== undefined ? `${user.totalCaptures} animals found` : 'Loading...'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isAlreadyFriend(user.username) ? (
                      <TouchableOpacity 
                        style={styles.unfriendButton} 
                        onPress={() => removeFriend(user.username)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.unfriendButtonText}>Unfriend</Text>
                      </TouchableOpacity>
                    ) : hasPendingRequestFrom(user.username) ? (
                      <TouchableOpacity 
                        style={styles.acceptButton} 
                        onPress={() => {
                          // Find the pending request and accept it
                          const request = pendingRequests.find(req => req.friend_id_1?.username === user.username);
                          if (request) {
                            acceptFriendRequest(request._id);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    ) : hasSentRequestTo(user.username) ? (
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => {
                          // Find the sent request and cancel it
                          const request = sentRequests.find(req => req.friend_id_2?.username === user.username);
                          if (request) {
                            cancelFriendRequest(request._id);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel Request</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addButton} 
                        onPress={() => sendFriendRequest(user.username)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.divider} />
                </View>
              ))}
              {searchResults.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Friends List */}
      {!showSearchResults && (
        <ScrollView style={styles.scrollView}>
          {filteredFriends.map((friend) => (
            <View key={friend.id}>
              <TouchableOpacity 
                style={styles.friendItem}
                onPress={() => {
                  // Navigate to friend's profile
                  router.push({
                    pathname: "/person-profile",
                    params: { username: friend.username, from: "friends" }
                  });
                }}
              >
                <View style={styles.friendAvatar}>
                  {friend.profilePicture ? (
                    <Image 
                      source={{ uri: friend.profilePicture }} 
                      style={styles.friendProfileImage}
                    />
                  ) : (
                    <Text style={styles.friendInitial}>
                      {friend.name.charAt(0)}
                    </Text>
                  )}
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendStats}>
                    {friend.animalsFound.toLocaleString()} animals found
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.unfriendButton} 
                  onPress={async (e) => {
                    e.stopPropagation(); // Prevent navigation when unfriending
                    await removeFriend(friend.username);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unfriendButtonText}>Unfriend</Text>
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
      )}

      {/* Add Friend Button removed - search handles discovery and requests */}
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
  friendProfileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  friendNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  privateIndicator: {
    marginLeft: 6,
    padding: 2,
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
    flexDirection: "row",
    backgroundColor: "#DC3545",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44, // Ensure minimum touch target size
    minWidth: 60,
  },
  unfriendButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44, // Ensure minimum touch target size
    minWidth: 60,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
  acceptButton: {
    flexDirection: "row",
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44, // Ensure minimum touch target size
    minWidth: 60,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
  cancelButton: {
    flexDirection: "row",
    backgroundColor: "#DC3545",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44, // Ensure minimum touch target size
    minWidth: 60,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: "#FEFAE0",
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#E9EDC9",
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  searchResultContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  requestsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#DC3545",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
