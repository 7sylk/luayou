import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { formatApiError, userAPI } from "../lib/api";

function PersonCard({ user, primaryLabel, onPrimary, secondaryLabel, onSecondary, onOpen }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md }}>
      <Pressable onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text style={{ color: colors.accentText, fontWeight: "700" }}>
            {user.username?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{user.username}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            Level {user.level} · {user.xp} XP
          </Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {primaryLabel ? <PrimaryButton label={primaryLabel} onPress={onPrimary} style={{ flex: 1 }} /> : null}
        {secondaryLabel ? (
          <PrimaryButton label={secondaryLabel} onPress={onSecondary} subtle style={{ flex: 1 }} />
        ) : null}
      </View>
    </View>
  );
}

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        userAPI.friends(),
        userAPI.friendRequests()
      ]);
      setFriends(friendsRes.data || []);
      setRequests(requestsRes.data || { incoming: [], outgoing: [] });
    } catch {
      setFriends([]);
      setRequests({ incoming: [], outgoing: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = async () => {
    if (!username.trim()) return;
    setSubmitting(true);
    try {
      await userAPI.sendFriendRequest(username.trim());
      setUsername("");
      await load();
      Alert.alert("Request sent", "Your friend request has been sent.");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncoming = async (requestId, action) => {
    try {
      if (action === "accept") {
        await userAPI.acceptFriendRequest(requestId);
      } else {
        await userAPI.declineFriendRequest(requestId);
      }
      await load();
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    }
  };

  const removeFriend = async (friendUsername) => {
    try {
      await userAPI.removeFriend(friendUsername);
      await load();
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Social</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Friends</Title>
        </View>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Add a friend</Text>
          <Body style={{ marginTop: spacing.sm }}>Search by username and send a friend request.</Body>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md
              }}
            />
            <PrimaryButton
              label={submitting ? "Sending" : "Add"}
              onPress={sendRequest}
              disabled={submitting || !username.trim()}
            />
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Incoming requests</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {requests.incoming?.length ? (
              requests.incoming.map((item) => (
                <PersonCard
                  key={item.id}
                  user={item.user}
                  primaryLabel="Accept"
                  onPrimary={() => handleIncoming(item.id, "accept")}
                  secondaryLabel="Decline"
                  onSecondary={() => handleIncoming(item.id, "decline")}
                  onOpen={() => navigation.navigate("PublicProfile", { username: item.user.username })}
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
                <PersonCard
                  key={item.id}
                  user={item.user}
                  primaryLabel="Open"
                  onPrimary={() => navigation.navigate("PublicProfile", { username: item.user.username })}
                  onOpen={() => navigation.navigate("PublicProfile", { username: item.user.username })}
                />
              ))
            ) : (
              <Body>No outgoing requests right now.</Body>
            )}
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Your friends</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {friends.length ? (
              friends.map((friend) => (
                <PersonCard
                  key={friend.id}
                  user={friend}
                  primaryLabel="Profile"
                  onPrimary={() => navigation.navigate("PublicProfile", { username: friend.username })}
                  secondaryLabel="Remove"
                  onSecondary={() => removeFriend(friend.username)}
                  onOpen={() => navigation.navigate("PublicProfile", { username: friend.username })}
                />
              ))
            ) : (
              <Body>No friends yet.</Body>
            )}
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
