import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[profileStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={profileStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
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
          <View style={profileStyles.profileImageContainer}>
            <Text style={profileStyles.profileInitial}>A</Text>
          </View>
          <Text style={profileStyles.profileName}>Arian Dotyar</Text>
          <Text style={profileStyles.statsText}>7 Animals Found</Text>
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
});
