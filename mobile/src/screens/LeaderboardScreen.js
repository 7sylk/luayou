import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StateBlock from "../components/StateBlock";
import UserAvatar from "../components/UserAvatar";
import { Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { formatApiError, leaderboardAPI } from "../lib/api";

export default function LeaderboardScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaderboardAPI.get();
      setEntries(res.data || []);
      setError("");
    } catch (err) {
      setEntries([]);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [loadLeaderboard])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Rankings</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Leaderboard</Title>
        </View>

        <SectionCard style={{ padding: 0 }}>
          {loading ? (
            <View style={{ padding: spacing.lg }}>
              <StateBlock title="Loading leaderboard" description="Getting the latest rankings." compact />
            </View>
          ) : error ? (
            <View style={{ padding: spacing.lg }}>
              <StateBlock title="Leaderboard unavailable" description={error} compact />
            </View>
          ) : entries.length ? (
            entries.map((entry, index) => (
              <Pressable
                key={entry.id || `${entry.username}-${index}`}
                onPress={() => navigation.navigate("PublicProfile", { username: entry.username })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: spacing.lg,
                  borderBottomWidth: index === entries.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Text style={{ color: colors.faint, width: 28 }}>#{entry.rank}</Text>
                  <UserAvatar user={entry} size={40} />
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>{entry.username}</Text>
                    <Text style={{ color: colors.muted, marginTop: 4 }}>
                      Level {entry.level} | {entry.xp} XP
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={{ padding: spacing.lg }}>
              <StateBlock title="No rankings yet" description="The leaderboard will appear once users start earning XP." compact />
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
