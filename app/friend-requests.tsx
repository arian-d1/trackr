import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

type FriendRequest = {
  _id: string;
  friend_id_1: {
    _id: string;
    username: string;
    displayName?: string;
  };
  status: string;
  createdAt: string;
};

export default function FriendRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent'>('pending');
  const { user } = useAuth();

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingResponse, sentResponse] = await Promise.all([
        api.get("/api/friends/requests/pending"),
        api.get("/api/friends/requests/sent")
      ]);
      setPendingRequests(pendingResponse.data);
      setSentRequests(sentResponse.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to load friend requests";
      setError(errorMessage);
      console.error("Failed to load friend requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string, username: string) => {
    try {
      await api.post("/api/friends/accept", { requestId });
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      Alert.alert("Success", `You are now friends with ${username}!`);
    } catch (error: any) {
      console.error("Accept request error:", error);
      Alert.alert("Error", "Failed to accept friend request");
    }
  };

  const denyRequest = async (requestId: string, username: string) => {
    try {
      await api.post("/api/friends/deny", { requestId });
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      Alert.alert("Request Denied", `Friend request from ${username} has been denied`);
    } catch (error: any) {
      console.error("Deny request error:", error);
      Alert.alert("Error", "Failed to deny friend request");
    }
  };

  const cancelRequest = async (requestId: string, username: string) => {
    try {
      await api.delete(`/api/friends/requests/${requestId}`);
      setSentRequests(prev => prev.filter(req => req._id !== requestId));
      Alert.alert("Request Cancelled", `Friend request to ${username} has been cancelled`);
    } catch (error: any) {
      console.error("Cancel request error:", error);
      Alert.alert("Error", "Failed to cancel friend request");
    }
  };

  const renderPendingRequest = (request: FriendRequest) => {
    const requester = request.friend_id_1;
    const displayName = requester.displayName || requester.username;
    
    return (
      <View key={request._id} style={styles.requestItem}>
        <TouchableOpacity 
          style={styles.requestContent}
          onPress={() => {
            // Navigate to requester's profile
            router.push({
              pathname: "/person-profile",
              params: { username: requester.username, from: "friend-requests" }
            });
          }}
        >
          <View style={styles.friendAvatar}>
            {requester.profilePicture ? (
              <Image 
                source={{ uri: requester.profilePicture }} 
                style={styles.friendProfileImage}
              />
            ) : (
              <Text style={styles.friendInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{displayName}</Text>
            <Text style={styles.requestUsername}>@{requester.username}</Text>
            <Text style={styles.requestDate}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => acceptRequest(request._id, displayName)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => denyRequest(request._id, displayName)}
          >
            <Text style={styles.denyButtonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequest = (request: FriendRequest) => {
    const recipient = request.friend_id_2;
    const displayName = recipient.displayName || recipient.username;
    
    return (
      <View key={request._id} style={styles.requestItem}>
        <TouchableOpacity 
          style={styles.requestContent}
          onPress={() => {
            // Navigate to recipient's profile
            router.push({
              pathname: "/person-profile",
              params: { username: recipient.username, from: "friend-requests" }
            });
          }}
        >
          <View style={styles.friendAvatar}>
            {recipient.profilePicture ? (
              <Image 
                source={{ uri: recipient.profilePicture }} 
                style={styles.friendProfileImage}
              />
            ) : (
              <Text style={styles.friendInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{displayName}</Text>
            <Text style={styles.requestUsername}>@{recipient.username}</Text>
            <Text style={styles.requestDate}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => cancelRequest(request._id, displayName)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <Text style={styles.headerTitle}>Friend Requests</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading friend requests...</Text>
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
          <Text style={styles.headerTitle}>Friend Requests</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFriendRequests}
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
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'pending' ? (
          pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="person.badge.plus" size={64} color="#CCD5AE" />
              <Text style={styles.emptyText}>No pending friend requests</Text>
              <Text style={styles.emptySubtext}>
                When someone sends you a friend request, it will appear here
              </Text>
            </View>
          ) : (
            pendingRequests.map(renderPendingRequest)
          )
        ) : (
          sentRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="paperplane" size={64} color="#CCD5AE" />
              <Text style={styles.emptyText}>No sent friend requests</Text>
              <Text style={styles.emptySubtext}>
                Friend requests you send will appear here
              </Text>
            </View>
          ) : (
            sentRequests.map(renderSentRequest)
          )
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
  requestItem: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 17,
    color: "#1A1A1A",
    fontWeight: "600",
    marginBottom: 4,
  },
  requestUsername: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#D4A373",
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  denyButton: {
    backgroundColor: "#E9EDC9",
  },
  denyButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E9EDC9",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#D4A373",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
