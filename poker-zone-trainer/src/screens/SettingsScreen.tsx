import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../state/authStore";
import { deleteOwnAccount } from "../lib/api";
import { colors, spacing } from "../theme";

export default function SettingsScreen() {
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and all training progress. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOwnAccount();
      // signOut() also clears local store state; deleteOwnAccount already signed
      // out server-side, this just resets client state defensively.
      await signOut();
    } catch (e: any) {
      Alert.alert("Couldn't delete account", e?.message ?? "Please try again or contact support.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerLabel}>Danger zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={deleting}>
          {deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteText}>Delete account</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "700", marginBottom: spacing.sm },
  email: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.xl },
  signOutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  dangerZone: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  dangerLabel: { color: colors.danger, fontSize: 13, fontWeight: "700", marginBottom: spacing.md },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
});
