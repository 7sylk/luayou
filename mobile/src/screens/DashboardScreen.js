import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StatPill from "../components/StatPill";
import PrimaryButton from "../components/PrimaryButton";
import LuaRuntime from "../components/LuaRuntime";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { dailyAPI, formatApiError, lessonsAPI, userAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function DailyChallengeCard({ daily, onComplete, completing, runtimeRef }) {
  const [code, setCode] = useState(daily.challenge_starter_code || "");
  const [expanded, setExpanded] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runtimeRef.current.run(code, daily.challenge_expected_output);
      setOutput(result.output || "");
      setError(result.error || "");
      setSuccess(result.success);
    } catch (runError) {
      setOutput("");
      setError(runError.message || "Lua runtime is not ready yet.");
      setSuccess(false);
    } finally {
      setRunning(false);
    }
  };

  const handleComplete = async () => {
    if (success !== true) {
      Alert.alert("Run the challenge", "Make your code output match the expected result first.");
      return;
    }
    await onComplete();
  };

  if (daily.completed) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{daily.title}</Text>
        <Body>{daily.description}</Body>
        <Text style={{ color: colors.muted }}>Completed · +{daily.xp_reward} XP</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{daily.title}</Text>
        <Body style={{ marginTop: spacing.xs }}>{daily.description}</Body>
        <Body style={{ marginTop: spacing.xs, color: colors.faint }}>
          Expected: {daily.challenge_expected_output}
        </Body>
      </View>

      {!expanded ? (
        <PrimaryButton label="Start challenge" onPress={() => setExpanded(true)} />
      ) : (
        <>
          <TextInput
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            value={code}
            onChangeText={setCode}
            placeholder="-- Write your Lua code here..."
            placeholderTextColor={colors.faint}
            textAlignVertical="top"
            style={{
              minHeight: 160,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text,
              padding: spacing.md,
              fontFamily: "monospace",
              lineHeight: 22
            }}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <PrimaryButton label={running ? "Running" : "Run"} onPress={handleRun} disabled={running} style={{ flex: 1 }} />
            <PrimaryButton
              label={completing ? "Completing" : success === true ? "Complete" : "Run first"}
              subtle={success !== true}
              onPress={handleComplete}
              disabled={success !== true || completing}
              style={{ flex: 1 }}
            />
          </View>
          {(output || error) ? (
            <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, padding: spacing.md }}>
              {output ? <Text style={{ color: colors.text, fontFamily: "monospace" }}>{output}</Text> : null}
              {error ? <Text style={{ color: colors.muted, fontFamily: "monospace", marginTop: output ? spacing.sm : 0 }}>{error}</Text> : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const runtimeRef = useRef(null);

  useEffect(() => {
    Promise.all([
      userAPI.stats().then((res) => setStats(res.data)).catch(() => {}),
      lessonsAPI.list().then((res) => setLessons(res.data || [])).catch(() => {}),
      dailyAPI.get().then((res) => setDaily(res.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const handleCompleteDaily = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await dailyAPI.complete();
      setDaily((current) => ({ ...current, completed: true }));
      await refreshUser();
      const statsRes = await userAPI.stats();
      setStats(statsRes.data);
      Alert.alert("Daily complete", `+${res.data.xp_earned} XP earned.`);
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setCompleting(false);
    }
  }, [completing, refreshUser]);

  if (loading) {
    return (
      <Screen style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted }}>Loading dashboard...</Text>
      </Screen>
    );
  }

  const xp = stats?.xp || user?.xp || 0;
  const level = stats?.level || user?.level || 1;
  const streak = stats?.streak || user?.streak || 0;
  const completedCount = stats?.lessons_completed || 0;
  const nextLevelXp = stats?.xp_for_next_level || level * level * 100;
  const previousLevelXp = (level - 1) * (level - 1) * 100;
  const progressPct = nextLevelXp > previousLevelXp
    ? Math.min(100, ((xp - previousLevelXp) / (nextLevelXp - previousLevelXp)) * 100)
    : 0;

  return (
    <Screen>
      <LuaRuntime ref={runtimeRef} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Dashboard</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Welcome back, {user?.username}</Title>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          <StatPill label="XP" value={xp} />
          <StatPill label="Level" value={level} />
          <StatPill label="Streak" value={streak} />
          <StatPill label="Lessons" value={completedCount} />
        </View>

        <SectionCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Level {level} progress</Text>
            <Text style={{ color: colors.faint }}>{xp} / {nextLevelXp} XP</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, marginTop: spacing.md }}>
            <View style={{ height: "100%", width: `${progressPct}%`, backgroundColor: colors.text }} />
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Daily challenge</Text>
          <View style={{ marginTop: spacing.md }}>
            {daily ? <DailyChallengeCard daily={daily} onComplete={handleCompleteDaily} completing={completing} runtimeRef={runtimeRef} /> : <Body>No challenge today.</Body>}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>Lessons</Text>
            <PrimaryButton label="Learn" subtle onPress={() => navigation.navigate("Learn")} />
          </View>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {lessons.slice(0, 5).map((lesson) => (
              <PrimaryButton
                key={lesson.id}
                label={`${lesson.order_index}. ${lesson.title}`}
                subtle
                onPress={() => !lesson.locked && navigation.navigate("Lesson", { lessonId: lesson.id })}
                disabled={lesson.locked}
                style={{ alignItems: "flex-start" }}
              />
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}
