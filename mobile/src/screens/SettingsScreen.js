import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { formatApiError, userAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Avatar({ user, avatarSrc }) {
  if (avatarSrc) {
    return (
      <Image
        source={{ uri: avatarSrc }}
        style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: colors.border }}
      />
    );
  }

  return (
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text style={{ color: colors.accentText, fontWeight: "700", fontSize: 24 }}>
        {user?.username?.charAt(0)?.toUpperCase() || "?"}
      </Text>
    </View>
  );
}

function RequestCard({ item, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm }}>
      <View>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{item.user.username}</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>{item.user.bio || "No bio yet."}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {actionLabel ? (
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            style={{ flex: 1, paddingVertical: spacing.sm }}
          />
        ) : null}
        {secondaryLabel ? (
          <PrimaryButton
            label={secondaryLabel}
            onPress={onSecondary}
            subtle
            style={{ flex: 1, paddingVertical: spacing.sm }}
          />
        ) : null}
      </View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setAvatarSrc(user?.avatar && user.avatar !== "default" ? user.avatar : null);
  }, [user]);

  const loadRequests = async () => {
    try {
      const res = await userAPI.friendRequests();
      setRequests(res.data || { incoming: [], outgoing: [] });
    } catch {
      setRequests({ incoming: [], outgoing: [] });
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const changed = useMemo(
    () => username !== (user?.username || "") || bio !== (user?.bio || ""),
    [bio, user, username]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateSettings({ username, bio });
      await refreshUser();
      Alert.alert("Saved", "Your settings have been updated.");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";

    setUploadingAvatar(true);
    try {
      const response = await userAPI.updateAvatar({
        avatar: `data:${mimeType};base64,${asset.base64}`
      });
      setAvatarSrc(response.data?.avatar || null);
      await refreshUser();
      Alert.alert("Avatar updated", "Your profile photo has been updated.");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleIncomingAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await userAPI.acceptFriendRequest(requestId);
      } else {
        await userAPI.declineFriendRequest(requestId);
      }
      await Promise.all([loadRequests(), refreshUser()]);
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Settings</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Account settings</Title>
        </View>

        <SectionCard>
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <Pressable onPress={handleAvatarPick} disabled={uploadingAvatar}>
              <Avatar user={user} avatarSrc={avatarSrc} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>Profile photo</Text>
              <Body style={{ marginTop: spacing.xs }}>
                Tap to change your avatar. PNG, JPG, GIF, or WebP under 500KB.
              </Body>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <View style={{ gap: spacing.md }}>
            <View>
              <Text style={labelStyle}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                maxLength={24}
                autoCapitalize="none"
                style={inputStyle}
              />
              <Text style={hintStyle}>3-24 characters, no spaces, letters first.</Text>
            </View>

            <View>
              <Text style={labelStyle}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                maxLength={160}
                multiline
                textAlignVertical="top"
                style={[inputStyle, { minHeight: 120 }]}
              />
              <Text style={hintStyle}>{bio.length}/160 characters</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <PrimaryButton
              label={saving ? "Saving" : "Save changes"}
              onPress={handleSave}
              disabled={saving || uploadingAvatar || !changed}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Profile"
              subtle
              onPress={() => navigation.navigate("MainTabs", { screen: "Profile" })}
              style={{ flex: 1 }}
            />
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Incoming requests</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {requests.incoming?.length ? (
              requests.incoming.map((item) => (
                <RequestCard
                  key={item.id}
                  item={item}
                  actionLabel="Accept"
                  onAction={() => handleIncomingAction(item.id, "accept")}
                  secondaryLabel="Decline"
                  onSecondary={() => handleIncomingAction(item.id, "decline")}
                />
              ))
            ) : (
              <Body>No incoming requests right now.</Body>
            )}
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Outgoing requests</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {requests.outgoing?.length ? (
              requests.outgoing.map((item) => (
                <RequestCard
                  key={item.id}
                  item={item}
                  actionLabel="Open profile"
                  onAction={() => navigation.navigate("PublicProfile", { username: item.user.username })}
                />
              ))
            ) : (
              <Body>No pending outgoing requests.</Body>
            )}
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const labelStyle = {
  color: colors.muted,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  fontSize: 11
};

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  color: colors.text,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md
};

const hintStyle = {
  color: colors.faint,
  marginTop: spacing.xs,
  fontSize: 12
};
