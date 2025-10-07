import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Redirect } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { token, ready } = useAuth();

  if (!ready) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#none",
          borderTopColor: "transparent", // optional, removes top border
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="trophy.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
