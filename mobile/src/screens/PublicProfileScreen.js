import { useCallback, useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StatPill from "../components/StatPill";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { formatApiError, userAPI } from "../lib/api";

function findIncomingRequestId(requests, username) {
  return requests.incoming?.find((item) => item.user.username === username)?.id || null;
}

export default function PublicProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        userAPI.publicProfile(username),
        userAPI.friendRequests()
      ]);
      setProfile(profileRes.data);
      setRequests(requestsRes.data || { incoming: [], outgoing: [] });
    } catch (error) {
      if (error?.response?.status === 404) {
        navigation.goBack();
        return;
      }
      setProfile(null);
    }
  }, [navigation, username]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action) => {
    if (!profile) return;

    const incomingRequestId = findIncomingRequestId(requests, profile.username);
    setPending(true);
    try {
      if (action === "add") {
        await userAPI.sendFriendRequest(profile.username);
      } else if (action === "accept" && incomingRequestId) {
        await userAPI.acceptFriendRequest(incomingRequestId);
      } else if (action === "decline" && incomingRequestId) {
        await userAPI.declineFriendRequest(incomingRequestId);
      } else if (action === "remove") {
        await userAPI.removeFriend(profile.username);
      }
      await load();
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setPending(false);
    }
  };

  if (!profile) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted }}>Loading profile...</Text>
      </Screen>
    );
  }

  const primaryActions = (() => {
    if (profile.is_me) {
      return [<PrimaryButton key="settings" label="Settings" onPress={() => navigation.navigate("Settings")} />];
    }
    if (profile.is_friend) {
      return [
        <PrimaryButton key="remove" label="Remove friend" subtle onPress={() => runAction("remove")} disabled={pending} />
      ];
    }
    if (profile.incoming_request) {
      return [
        <PrimaryButton key="accept" label="Accept" onPress={() => runAction("accept")} disabled={pending} />,
        <PrimaryButton key="decline" label="Decline" subtle onPress={() => runAction("decline")} disabled={pending} />
      ];
    }
    if (profile.outgoing_request) {
      return [
        <PrimaryButton key="cancel" label="Cancel request" subtle onPress={() => runAction("remove")} disabled={pending} />
      ];
    }
    return [<PrimaryButton key="add" label="Add friend" onPress={() => runAction("add")} disabled={pending} />];
  })();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <SectionCard>
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            {profile.avatar && profile.avatar !== "default" ? (
              <Image
                source={{ uri: profile.avatar }}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: colors.border }}
              />
            ) : (
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
                  {profile.username?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Eyebrow>Profile</Eyebrow>
              <Title style={{ marginTop: spacing.xs }}>{profile.username}</Title>
              <Body style={{ marginTop: spacing.sm }}>{profile.bio || "No bio yet."}</Body>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.lg }}>
            {primaryActions.map((action) => action)}
          </View>
        </SectionCard>

        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          <StatPill label="XP" value={profile.xp ?? 0} />
          <StatPill label="Level" value={profile.level ?? 1} />
          <StatPill label="Streak" value={profile.streak ?? 0} />
          <StatPill label="Lessons" value={profile.lessons_completed ?? 0} />
        </View>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Progress</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Body>{profile.badges?.length || 0} badges earned</Body>
            <Body>{profile.perfect_quizzes || 0} perfect quizzes</Body>
            <Body>{profile.daily_completed || 0} daily challenges completed</Body>
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
