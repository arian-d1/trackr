import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// Removed PanGestureHandler import - using PanResponder instead
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./util/axios";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, clearAuth, setAuth } = useAuth();
  const [captureCount, setCaptureCount] = useState<number>(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);



  useEffect(() => {
    (async () => {
      try {
        if (!user?.username) return;
        const res = await api.get(`/api/captures/${encodeURIComponent(user.username)}`);
        setCaptureCount(Array.isArray(res.data) ? res.data.length : 0);
        await loadUserSettings();
      } catch {
        setCaptureCount(0);
      }
    })();
  }, [user?.username]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/api/users/profile/${user.username}`);
      const userData = response.data;
      setProfilePicture(userData.profilePicture || null);
      setIsPublic((userData.settings?.privacy?.visibility || 'public') === 'public');
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        console.log("Image asset:", {
          uri: asset.uri,
          base64: asset.base64 ? asset.base64.substring(0, 100) + '...' : 'No base64',
          type: asset.type,
          fileName: asset.fileName,
          mimeType: asset.mimeType
        });

        // Check if we have base64 data
        if (!asset.base64) {
          Alert.alert("Error", "Failed to process image. Please try again.");
          return;
        }

        // Create proper data URI format
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${asset.base64}`;
        
        console.log("Created data URI:", dataUri.substring(0, 100) + '...');
        
        // Upload the image
        await uploadProfilePicture(dataUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePicture = async (base64Image: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Uploading profile picture...");
      const response = await api.post('/api/users/profile-picture', {
        profilePicture: base64Image
      });
      
      console.log("Profile picture uploaded successfully:", response.data);
      setProfilePicture(response.data.profilePicture);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        networkError: error.code === 'NETWORK_ERROR'
      });
      
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        Alert.alert("Network Error", "Cannot connect to server. Please check your internet connection and try again.");
      } else {
        Alert.alert("Error", error.response?.data?.error || "Failed to upload profile picture");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyToggle = async (value: boolean) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await api.put('/api/users/settings', {
        privacy: {
          visibility: value ? 'public' : 'private'
        }
      });
      
      setIsPublic(value);
      Alert.alert("Success", `Profile is now ${value ? 'public' : 'private'}`);
    } catch (error: any) {
      console.error("Error updating privacy settings:", error);
      const errorMessage = error.response?.data?.error || "Failed to update privacy settings";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initial = useMemo(() => (user?.displayName || user?.username || "?").charAt(0).toUpperCase(), [user]);

  return (
    <View style={[profileStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={profileStyles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/")}
          style={profileStyles.backButton}
        >
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={profileStyles.settingsButton}>
          <IconSymbol name="gearshape" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Profile Info */}
        <View style={profileStyles.profileSection}>
          <TouchableOpacity 
            style={profileStyles.profileImageContainer}
            onPress={handleImagePicker}
            disabled={loading}
          >
            {profilePicture ? (
              <Image 
                source={{ uri: profilePicture }} 
                style={profileStyles.profileImage}
              />
            ) : (
              <Text style={profileStyles.profileInitial}>{initial}</Text>
            )}
            <View style={profileStyles.cameraIcon}>
              <IconSymbol name="camera.fill" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={profileStyles.profileName}>{user?.displayName || user?.username}</Text>
          <Text style={profileStyles.statsText}>{captureCount} Animals Found</Text>
        </View>

        {/* Divider */}
        <View style={profileStyles.divider} />

        {/* Navigation Options */}
        <TouchableOpacity
          style={profileStyles.menuItem}
          onPress={() => router.push("/friends")}
        >
          <IconSymbol name="person.2.fill" size={24} color="#1A1A1A" />
          <Text style={profileStyles.menuText}>Friends</Text>
        </TouchableOpacity>

        <View style={profileStyles.divider} />

        <TouchableOpacity
          style={profileStyles.menuItem}
          onPress={() => router.push("/gallery")}
        >
          <IconSymbol name="photo.on.rectangle" size={24} color="#1A1A1A" />
          <Text style={profileStyles.menuText}>Your Gallery</Text>
        </TouchableOpacity>

        <View style={profileStyles.divider} />

        {/* Settings Section */}
        <View style={profileStyles.settingsSection}>
          <Text style={profileStyles.settingsTitle}>Settings</Text>
          
          {/* Privacy Setting */}
          <View style={profileStyles.settingItem}>
            <View style={profileStyles.settingInfo}>
              <IconSymbol name="eye" size={24} color="#1A1A1A" />
              <View style={profileStyles.settingText}>
                <Text style={profileStyles.settingLabel}>Public Profile</Text>
                <Text style={profileStyles.settingDescription}>
                  {isPublic ? 'Your profile is visible to everyone' : 'Your profile is private'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPublic}
              onValueChange={handlePrivacyToggle}
              disabled={loading}
              trackColor={{ false: '#E9EDC9', true: '#D4A373' }}
              thumbColor={isPublic ? '#FFFFFF' : '#CCD5AE'}
            />
          </View>
        </View>

        <View style={profileStyles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={[profileStyles.menuItem, { justifyContent: "center" }]}
          onPress={async () => {
            try {
              // Call backend logout endpoint
              await api.post('/api/users/logout');
            } catch (error) {
              console.error('Logout API error:', error);
              // Continue with client-side logout even if API fails
            }
            
            try {
              // Clear client-side auth
              await clearAuth();
            } catch (error) {
              console.error('Clear auth error:', error);
            }
            
            // Navigate to login
            router.replace("/login");
          }}
        >
          <Text style={[profileStyles.menuText, { color: "#D9534F" }]}>Logout</Text>
        </TouchableOpacity>


        {/* Footer */}
        <Text style={profileStyles.footer}>
          Trackr 2025. All Rights Reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const profileStyles = StyleSheet.create({
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
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  profileName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 5,
  },
  statsText: {
    fontSize: 16,
    color: "#D4A373",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9EDC9",
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 15,
  },
  menuText: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#D4A373",
    marginTop: 40,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
  },
});
