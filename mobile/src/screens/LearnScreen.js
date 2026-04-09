import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StatPill from "../components/StatPill";
import StateBlock from "../components/StateBlock";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { lessonsAPI, userAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const UNIT_LABELS = [
  "Core Lua",
  "Flow and Functions",
  "Data and Tables",
  "Deeper Lua",
  "Projects and Practice",
];

function LessonBubble({ lesson, offset, onPress }) {
  const locked = lesson.locked;
  const backgroundColor = lesson.mastered
    ? colors.gold
    : lesson.completed
      ? colors.accent
      : locked
        ? colors.background
        : colors.surfaceElevated;
  const borderColor = lesson.mastered
    ? colors.goldBorder
    : lesson.completed
      ? colors.border
      : locked
        ? colors.border
        : "#2a2a2a";
  const textColor = lesson.mastered || lesson.completed ? colors.accentText : locked ? colors.faint : colors.text;

  return (
    <View style={{ marginLeft: offset, gap: spacing.xs, alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        disabled={locked}
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 1,
          borderColor,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          opacity: locked ? 0.7 : 1
        }}
      >
        <Text style={{ color: textColor, fontWeight: "700", fontSize: 18 }}>{lesson.order_index}</Text>
      </Pressable>
      <Text style={{ color: locked ? colors.faint : colors.muted, fontSize: 11, maxWidth: 92, textAlign: "center" }} numberOfLines={2}>
        {lesson.title}
      </Text>
    </View>
  );
}

export default function LearnScreen({ navigation }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLearnData = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, statsRes] = await Promise.all([
        lessonsAPI.list(),
        userAPI.stats()
      ]);
      setLessons(lessonsRes.data || []);
      setStats(statsRes.data);
    } catch {
      setLessons([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLearnData();
    }, [loadLearnData])
  );

  const units = useMemo(() => {
    const uniqueLessons = Array.from(
      lessons
        .reduce((map, lesson) => {
          const existing = map.get(lesson.order_index);
          if (!existing || String(lesson.id).length < String(existing.id).length) {
            map.set(lesson.order_index, lesson);
          }
          return map;
        }, new Map())
        .values()
    ).sort((a, b) => a.order_index - b.order_index);

    const size = 10;
    const grouped = [];
    for (let index = 0; index < uniqueLessons.length; index += size) {
      grouped.push(uniqueLessons.slice(index, index + size));
    }
    return grouped;
  }, [lessons]);

  const completedCount = stats?.lessons_completed ?? 0;
  const masteredCount = stats?.mastered_lesson_ids?.length ?? 0;
  const unlockedCount = lessons.filter((lesson) => !lesson.locked).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <SectionCard style={{ padding: spacing.xl }}>
          <Eyebrow>Learn</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Lua path</Title>
          <Body style={{ marginTop: spacing.sm }}>
            Finish each lesson to unlock the next one, then come back for mastery when you want to lock it in.
          </Body>
        </SectionCard>

        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          <StatPill label="XP" value={user?.xp ?? 0} />
          <StatPill label="Level" value={user?.level ?? 1} />
          <StatPill label="Done" value={completedCount} />
          <StatPill label="Mastered" value={masteredCount} />
        </View>

        <SectionCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md, alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Eyebrow>Course progress</Eyebrow>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 18, marginTop: spacing.sm }}>
                {completedCount} completed | {unlockedCount} unlocked
              </Text>
              <Body style={{ marginTop: spacing.xs }}>
                Your current path opens one lesson at a time so progression stays clean and focused.
              </Body>
            </View>
          </View>
        </SectionCard>

        {loading ? (
          <StateBlock title="Loading lessons" description="Pulling down your latest course progress." />
        ) : units.length ? (
          units.map((unit, unitIndex) => (
            <SectionCard key={`unit-${unitIndex}`} style={{ paddingTop: spacing.xl }}>
              <Eyebrow>Unit {unitIndex + 1}</Eyebrow>
              <Title style={{ fontSize: 24, marginTop: spacing.sm }}>
                {UNIT_LABELS[unitIndex] || `Unit ${unitIndex + 1}`}
              </Title>
              <Body style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
                {unit.filter((lesson) => lesson.completed).length} of {unit.length} lessons completed
              </Body>
              <View style={{ gap: spacing.lg }}>
                {unit.map((lesson, lessonIndex) => {
                  const offsetPattern = [0, 54, 12, 64, 18, 72, 28, 58, 8, 48];
                  return (
                    <LessonBubble
                      key={lesson.id}
                      lesson={lesson}
                      offset={offsetPattern[lessonIndex % offsetPattern.length]}
                      onPress={() => navigation.navigate("Lesson", { lessonId: lesson.id })}
                    />
                  );
                })}
              </View>
            </SectionCard>
          ))
        ) : (
          <StateBlock title="No lessons yet" description="Your course data did not load. Try again in a moment." />
        )}
      </ScrollView>
    </Screen>
  );
}
