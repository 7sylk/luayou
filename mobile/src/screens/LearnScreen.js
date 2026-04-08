import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import StatPill from "../components/StatPill";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { lessonsAPI, userAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LearnScreen({ navigation }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    lessonsAPI.list().then((res) => setLessons(res.data || [])).catch(() => {});
    userAPI.stats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Learn</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Lua path</Title>
          <Body style={{ marginTop: spacing.sm }}>
            Move through the course one lesson at a time and unlock the next step as you go.
          </Body>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <StatPill label="XP" value={user?.xp ?? 0} />
          <StatPill label="Level" value={user?.level ?? 1} />
          <StatPill label="Lessons" value={stats?.lessons_completed ?? 0} />
        </View>

        {units.map((unit, unitIndex) => (
          <SectionCard key={`unit-${unitIndex}`}>
            <Eyebrow>Unit {unitIndex + 1}</Eyebrow>
            <Title style={{ fontSize: 22, marginTop: spacing.sm }}>Core Lua skills</Title>
            <Body style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
              Complete each lesson to unlock the next one.
            </Body>
            <View style={{ gap: spacing.md }}>
              {unit.map((lesson, lessonIndex) => {
                const offset = lessonIndex % 2 === 0 ? 0 : 56;
                const locked = lesson.locked;
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => !locked && navigation.navigate("Lesson", { lessonId: lesson.id })}
                    style={{
                      marginLeft: offset,
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      borderWidth: 1,
                      borderColor: lesson.mastered ? "#8b6b24" : lesson.completed ? "#2a2a2a" : locked ? "#151515" : "#2a2a2a",
                      backgroundColor: lesson.mastered ? "#c7a34b" : lesson.completed ? "#f5f5f5" : locked ? "#0a0a0a" : "#111111",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: lesson.mastered || lesson.completed ? colors.accentText : locked ? colors.faint : colors.text, fontSize: 12 }}>
                      {lesson.order_index}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>
        ))}
      </ScrollView>
    </Screen>
  );
}
