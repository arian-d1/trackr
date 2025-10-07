import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

type PersonProfile = {
  username: string;
  displayName: string;
  totalCaptures: number;
  animalCounts: { [key: string]: number };
  lastSeen: string;
};

type Capture = {
  _id: string;
  animal: string;
  photo: string;
  rating: number;
  capturedAt: string;
  latitude: number;
  longitude: number;
};

export default function PersonProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const username = params.username as string;
  const from = params.from as string;
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequestFrom, setHasPendingRequestFrom] = useState(false);
  const [hasSentRequestTo, setHasSentRequestTo] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  useEffect(() => {
    if (username) {
      loadPersonProfile();
      loadFriendData();
    }
  }, [username, user]);

  const loadPersonProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user info first
      const userResponse = await api.get(`/api/users/profile/${username}/public`);
      const userData = userResponse.data;
      
      // Load person's captures and calculate stats
      const capturesResponse = await api.get(`/api/captures/${username}`);
      const capturesData = capturesResponse.data;
      
      // Calculate animal counts
      const animalCounts: { [key: string]: number } = {};
      capturesData.forEach((capture: Capture) => {
        animalCounts[capture.animal] = (animalCounts[capture.animal] || 0) + 1;
      });
      
      const personProfile: PersonProfile = {
        username: userData.username,
        displayName: userData.username, // Use username as display name
        totalCaptures: capturesData.length,
        animalCounts,
        lastSeen: userData.lastLocation?.at || new Date().toISOString()
      };
      
      setProfile(personProfile);
      setCaptures(capturesData.slice(0, 25)); // Max 25 captures
      
      // Set profile picture and privacy settings
      setProfilePicture(userData.profilePicture || null);
      setIsPublic(userData.settings?.privacy?.visibility === 'public');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to load profile";
      setError(errorMessage);
      console.error("Failed to load person profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load friend data and check friendship status
  const loadFriendData = async () => {
    if (!user || !username) return;
    
    try {
      // Load current user's friends
      const friendsResponse = await api.get(`/api/friends/${encodeURIComponent(user.username)}`);
      const friendsList = friendsResponse.data.map((f: any) => {
        const a = f.friend_id_1;
        const b = f.friend_id_2;
        const other = a.username === user.username ? b : a;
        return { 
          id: f._id, 
          username: other.username,
          name: other.username
        };
      });
      setFriends(friendsList);
      
      // Check if this user is already a friend
      const isAlreadyFriend = friendsList.some(friend => friend.username === username);
      setIsFriend(isAlreadyFriend);
      
      // Load pending requests
      const pendingResponse = await api.get("/api/friends/requests/pending");
      setPendingRequests(pendingResponse.data);
      
      // Check if this user has sent a request to current user
      const hasRequestFrom = pendingResponse.data.some((req: any) => 
        req.friend_id_1?.username === username
      );
      setHasPendingRequestFrom(hasRequestFrom);
      
      // Load sent requests
      const sentResponse = await api.get("/api/friends/requests/sent");
      setSentRequests(sentResponse.data);
      
      // Check if current user has sent a request to this user
      const hasRequestTo = sentResponse.data.some((req: any) => 
        req.friend_id_2?.username === username
      );
      setHasSentRequestTo(hasRequestTo);
      
    } catch (error) {
      console.error("Error loading friend data:", error);
    }
  };

  // Send friend request
  const sendFriendRequest = async () => {
    if (!user || !username) return;
    
    // Prevent adding yourself as a friend
    if (username === user.username) {
      Alert.alert("Error", "You cannot add yourself as a friend!");
      return;
    }

    try {
      await api.post("/api/friends/request", { toUsername: username });
      await loadFriendData(); // Refresh friend data
      Alert.alert("Success", `Friend request sent to ${username}!`);
    } catch (error: any) {
      console.error("Send friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to send friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async () => {
    if (!user || !username) return;
    
    try {
      const request = pendingRequests.find(req => req.friend_id_1?.username === username);
      if (request) {
        await api.post("/api/friends/accept", { requestId: request._id });
        await loadFriendData(); // Refresh friend data
        Alert.alert("Success", `You are now friends with ${username}!`);
      }
    } catch (error: any) {
      console.error("Accept friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to accept friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  // Cancel sent friend request
  const cancelFriendRequest = async () => {
    if (!user || !username) return;
    
    try {
      const request = sentRequests.find(req => req.friend_id_2?.username === username);
      if (request) {
        await api.delete(`/api/friends/requests/${request._id}`);
        await loadFriendData(); // Refresh friend data
        Alert.alert("Success", "Friend request cancelled!");
      }
    } catch (error: any) {
      console.error("Cancel friend request error:", error);
      const errorMessage = error.response?.data?.error || "Failed to cancel friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  // Remove friend
  const removeFriend = async () => {
    if (!user || !username) return;
    
    try {
      await api.delete("/api/friends/remove", { data: { username } });
      await loadFriendData(); // Refresh friend data
      Alert.alert("Success", `${username} has been removed from your friends list.`);
    } catch (error: any) {
      console.error("Remove friend error:", error);
      const errorMessage = error.response?.data?.error || "Failed to remove friend";
      Alert.alert("Error", errorMessage);
    }
  };

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

  const getRatingColor = (rating: number): string => {
    if (rating >= 80) return "#4CAF50";
    if (rating >= 60) return "#FF9800";
    if (rating >= 40) return "#FFC107";
    return "#F44336";
  };

  const renderCapture = ({ item }: { item: Capture }) => (
    <TouchableOpacity
      style={styles.captureItem}
      onPress={() => {
        router.push({
          pathname: "/animal-detail",
          params: {
            animal: item.animal,
            rating: item.rating.toString(),
            foundBy: profile?.displayName || profile?.username || "",
            foundByUsername: profile?.username || "",
            capturedAt: item.capturedAt,
            photo: item.photo,
            latitude: item.latitude.toString(),
            longitude: item.longitude.toString(),
            from: "person-profile"
          }
        });
      }}
    >
      <View style={styles.captureImageContainer}>
        {item.photo ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
            style={styles.captureImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.capturePlaceholder}>
            <Text style={styles.captureEmoji}>
              {getAnimalEmoji(item.animal)}
            </Text>
          </View>
        )}
        <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      <View style={styles.captureInfo}>
        <Text style={styles.captureAnimal}>{item.animal}</Text>
        <Text style={styles.captureDate}>
          {new Date(item.capturedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAnimalCount = (animal: string, count: number) => {
    const canViewPhotos = isPublic || isFriend;
    
    return (
      <TouchableOpacity 
        key={animal} 
        style={[styles.animalCountItem, !canViewPhotos && styles.animalCountItemDisabled]}
        onPress={() => {
          if (canViewPhotos) {
            // Navigate to a filtered view of captures for this animal type
            router.push({
              pathname: "/animal-gallery",
              params: { 
                username: profile.username, 
                animalType: animal,
                from: "person-profile"
              }
            });
          }
        }}
        disabled={!canViewPhotos}
      >
        <Text style={styles.animalEmoji}>{getAnimalEmoji(animal)}</Text>
        <View style={styles.animalCountInfo}>
          <Text style={styles.animalName}>{animal}</Text>
          <Text style={styles.animalCount}>{count} found</Text>
        </View>
        {canViewPhotos && <IconSymbol name="chevron.right" size={16} color="#666" />}
      </TouchableOpacity>
    );
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Profile not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadPersonProfile}
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
          onPress={() => {
            // Always use router.back() to return to the previous screen
            // This preserves the search state and navigation stack
            router.back();
          }}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.username || "Profile"}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profilePicture && (isPublic || isFriend) ? (
              <Image 
                source={{ uri: profilePicture }} 
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.displayNameRow}>
              <Text style={styles.displayName}>{profile.username}</Text>
              {!isPublic && (
                <View style={styles.privateIndicator}>
                  <IconSymbol name="lock.fill" size={14} color="#666" />
                </View>
              )}
            </View>
            <Text style={styles.totalCaptures}>
              {profile.totalCaptures} animals found
            </Text>
            {!isPublic && !isFriend && (
              <Text style={styles.privateNotice}>
                This profile is private
              </Text>
            )}
          </View>
        </View>

        {/* Friend Management */}
        {user && username !== user.username && (
          <View style={styles.section}>
            <View style={styles.friendActions}>
              {/* Friends List Button */}
              <TouchableOpacity
                style={styles.friendsListButton}
                onPress={() => {
                  // Navigate to the user's friends list page
                  router.push({
                    pathname: "/user-friends",
                    params: { username: profile.username }
                  });
                }}
              >
                <IconSymbol name="person.2" size={20} color="#D4A373" />
                <Text style={styles.friendsListButtonText}>Friends ({friends.length})</Text>
              </TouchableOpacity>

              {/* Friend Action Button */}
              <View style={styles.friendActionContainer}>
                {isFriend ? (
                  <TouchableOpacity
                    style={styles.unfriendButton}
                    onPress={removeFriend}
                  >
                    <Text style={styles.unfriendButtonText}>Unfriend</Text>
                  </TouchableOpacity>
                ) : hasPendingRequestFrom ? (
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={acceptFriendRequest}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                ) : hasSentRequestTo ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelFriendRequest}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={sendFriendRequest}
                  >
                    <Text style={styles.addButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Animal Counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Collection</Text>
          <View style={styles.animalCountsContainer}>
            {Object.entries(profile.animalCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([animal, count]) => renderAnimalCount(animal, count))}
          </View>
        </View>

        {/* Recent Captures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Captures</Text>
          {!isPublic && !isFriend ? (
            <View style={styles.privateNotice}>
              <Text style={styles.privateNoticeText}>
                This user's photos are private. Add them as a friend to see their captures!
              </Text>
            </View>
          ) : captures.length > 0 ? (
            <FlatList
              data={captures}
              renderItem={renderCapture}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.capturesGrid}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No captures yet</Text>
            </View>
          )}
        </View>

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
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  privateIndicator: {
    marginLeft: 8,
    padding: 2,
  },
  username: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  totalCaptures: {
    fontSize: 14,
    color: "#D4A373",
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  animalCountsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  animalCountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingHorizontal: 4,
  },
  animalCountItemDisabled: {
    opacity: 0.6,
  },
  animalEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  animalCountInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  animalCount: {
    fontSize: 14,
    color: "#666",
  },
  capturesGrid: {
    paddingBottom: 10,
  },
  captureItem: {
    flex: 1,
    margin: 4,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  captureImageContainer: {
    position: "relative",
    height: 120,
  },
  captureImage: {
    width: "100%",
    height: "100%",
  },
  capturePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E9EDC9",
    justifyContent: "center",
    alignItems: "center",
  },
  captureEmoji: {
    fontSize: 32,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  captureInfo: {
    padding: 12,
  },
  captureAnimal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  captureDate: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
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
  friendActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  friendsListButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  friendsListButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D4A373",
    marginLeft: 8,
  },
  friendActionContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  addButton: {
    backgroundColor: "#D4A373",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  acceptButton: {
    backgroundColor: "#28A745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  unfriendButton: {
    backgroundColor: "#6C757D",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  unfriendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  privateNotice: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  privateNoticeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
});
