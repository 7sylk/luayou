import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StatPill from "../components/StatPill";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../lib/api";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    userAPI.stats().then((res) => setStats(res.data)).catch(() => {});
    userAPI.friends().then((res) => setFriends(res.data || [])).catch(() => {});
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Profile</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>{user?.username}</Title>
          <Body style={{ marginTop: spacing.sm }}>{user?.bio || "No bio yet."}</Body>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          <StatPill label="XP" value={user?.xp ?? 0} />
          <StatPill label="Level" value={user?.level ?? 1} />
          <StatPill label="Streak" value={user?.streak ?? 0} />
          <StatPill label="Lessons" value={stats?.lessons_completed ?? 0} />
        </View>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Account</Text>
          <Body style={{ marginTop: spacing.xs }}>Change profile info and account settings.</Body>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <PrimaryButton label="Settings" onPress={() => navigation.navigate("Settings")} style={{ flex: 1 }} />
            <PrimaryButton label="Public profile" subtle onPress={() => navigation.navigate("PublicProfile", { username: user?.username })} style={{ flex: 1 }} />
          </View>
        </SectionCard>

        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Friends</Text>
            <Text style={{ color: colors.faint }}>{friends.length} total</Text>
          </View>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {friends.length ? (
              friends.slice(0, 5).map((friend) => (
                <Pressable
                  key={friend.id}
                  onPress={() => navigation.navigate("PublicProfile", { username: friend.username })}
                  style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.md }}
                >
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{friend.username}</Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>
                    Level {friend.level} · {friend.xp} XP
                  </Text>
                </Pressable>
              ))
            ) : (
              <Body>No friends yet. Add people from the leaderboard or their profile.</Body>
            )}
          </View>
          <PrimaryButton
            label="Open friends"
            subtle
            onPress={() => navigation.navigate("MainTabs", { screen: "Friends" })}
            style={{ marginTop: spacing.md }}
          />
        </SectionCard>

        {user?.role === "admin" && (
          <SectionCard>
            <Pressable onPress={() => navigation.navigate("Developer")}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>Developer panel</Text>
              <Body style={{ marginTop: spacing.xs }}>Manage admin tools and account controls.</Body>
            </Pressable>
          </SectionCard>
        )}

        <SectionCard>
          <Pressable onPress={logout}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Log out</Text>
          </Pressable>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
