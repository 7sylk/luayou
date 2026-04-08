import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import { Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { leaderboardAPI } from "../lib/api";

export default function LeaderboardScreen({ navigation }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    leaderboardAPI.get().then((res) => setEntries(res.data || [])).catch(() => {});
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Rankings</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Leaderboard</Title>
        </View>

        <SectionCard style={{ padding: 0 }}>
          {entries.map((entry, index) => (
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
                <Text style={{ color: colors.text, fontWeight: "600" }}>{entry.username}</Text>
              </View>
              <Text style={{ color: colors.muted }}>{entry.xp} XP</Text>
            </Pressable>
          ))}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
