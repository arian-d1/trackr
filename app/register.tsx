import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "./util/axios";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { token, setAuth } = useAuth();

  useEffect(() => {
    if (token) {
      router.replace("/(tabs)");
    }
  }, []);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/users/register", { username, password, email, displayName });
      setAuth(res.data.token, res.data.user || { username, displayName });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Registration failed", e.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password (optional)" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Email (optional)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Display name (optional)" value={displayName} onChangeText={setDisplayName} />
        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Account"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.link}>Have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FEFAE0" },
  card: { width: "88%", backgroundColor: "#fff", padding: 20, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#E9EDC9", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  button: { backgroundColor: "#D4A373", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { marginTop: 12, color: "#6b7280", textAlign: "center" },
});


