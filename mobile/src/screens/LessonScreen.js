import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import LuaRuntime from "../components/LuaRuntime";
import StateBlock from "../components/StateBlock";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { codeAPI, formatApiError, lessonsAPI, quizAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function QuizPanel({ lessonId, onQuizXp, onCompleted }) {
  const { refreshUser } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQuiz(null);
    setResults(null);
    setAnswers([]);
    quizAPI
      .get(lessonId)
      .then((res) => {
        setQuiz(res.data);
        setAnswers(new Array(res.data.questions.length).fill(-1));
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const submit = async () => {
    if (!quiz || answers.includes(-1)) {
      Alert.alert("Finish the quiz", "Answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await quizAPI.submit({
        quiz_id: quiz.id,
        lesson_id: lessonId,
        answers
      });
      setResults(res.data);
      onCompleted?.(res.data);
      if (res.data.xp_earned > 0) {
        onQuizXp?.(res.data.xp_earned);
      }
      await refreshUser();
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <Body>Loading quiz...</Body>
      </SectionCard>
    );
  }

  if (!quiz) {
    return (
      <SectionCard>
        <Body>No quiz available for this lesson.</Body>
      </SectionCard>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {results ? (
        <SectionCard>
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            Score: {results.score}/{results.total}
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>+{results.xp_earned} XP</Text>
        </SectionCard>
      ) : null}

      {quiz.questions.map((question, qIndex) => {
        const result = results?.results?.[qIndex];
        return (
          <SectionCard key={`${lessonId}-${qIndex}`}>
            <Text style={{ color: colors.text, fontWeight: "600", lineHeight: 22 }}>
              {qIndex + 1}. {question.question}
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {question.options.map((option, optionIndex) => {
                const selected = answers[qIndex] === optionIndex;
                const isCorrect = result && optionIndex === result.correct_answer;
                const isWrongSelection = result && optionIndex === result.your_answer && !result.is_correct;

                return (
                  <PrimaryButton
                    key={`${qIndex}-${optionIndex}`}
                    label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                    subtle={!selected && !isCorrect}
                    onPress={() => {
                      if (results) return;
                      setAnswers((current) => {
                        const next = [...current];
                        next[qIndex] = optionIndex;
                        return next;
                      });
                    }}
                    disabled={Boolean(results)}
                    style={{
                      backgroundColor: isCorrect
                        ? colors.surfaceElevated
                        : isWrongSelection
                          ? colors.surface
                          : selected
                            ? colors.surfaceElevated
                            : colors.surface,
                      borderColor: isCorrect
                        ? colors.text
                        : isWrongSelection
                          ? colors.faint
                          : selected
                            ? colors.muted
                            : colors.border,
                      alignItems: "flex-start"
                    }}
                  />
                );
              })}
            </View>
            {result ? <Body style={{ marginTop: spacing.md }}>{result.explanation}</Body> : null}
          </SectionCard>
        );
      })}

      {!results ? (
        <PrimaryButton
          label={submitting ? "Submitting" : "Submit answers"}
          onPress={submit}
          disabled={submitting}
        />
      ) : (
        <PrimaryButton
          label="Try again"
          subtle
          onPress={() => {
            setResults(null);
            setAnswers(new Array(quiz.questions.length).fill(-1));
          }}
        />
      )}
    </View>
  );
}

export default function LessonScreen({ route, navigation }) {
  const { lessonId } = route.params;
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCode, setCurrentCode] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("lesson");
  const [totalLessons, setTotalLessons] = useState(1);
  const [mastered, setMastered] = useState(false);
  const [masteryMode, setMasteryMode] = useState(false);
  const [running, setRunning] = useState(false);
  const runtimeRef = useRef(null);

  const storageKey = useMemo(() => `luayou_code_${lessonId}`, [lessonId]);

  const fetchLesson = useCallback(async () => {
    try {
      const res = await lessonsAPI.get(lessonId);
      const saved = await AsyncStorage.getItem(storageKey);
      setLesson(res.data);
      setCurrentCode(saved || res.data.challenge_starter_code || "");
      setCompleted(Boolean(res.data.completed));
      setMastered(Boolean(res.data.mastered));
      setJustCompleted(false);
      setValidationMessage("");
      setCodeOutput("");
      setCodeError("");
      setActiveTab("lesson");
      setLoading(false);
    } catch (error) {
      const redirectLessonId = error.response?.data?.detail?.redirect_lesson_id;
      if (redirectLessonId) {
        navigation.replace("Lesson", { lessonId: redirectLessonId });
        return;
      }
      navigation.goBack();
    }
  }, [lessonId, navigation, storageKey]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  useEffect(() => {
    lessonsAPI
      .list()
      .then((res) => setTotalLessons(Math.max(1, res.data?.length || 1)))
      .catch(() => {});
  }, []);

  const lessonNum = lesson?.order_index || 1;
  const nextId = lessonNum < totalLessons ? `lesson-${String(lessonNum + 1).padStart(2, "0")}` : null;
  const isLastLesson = lessonNum >= totalLessons;
  const showQuiz = masteryMode && completed;

  const handleCodeChange = async (value) => {
    setCurrentCode(value);
    await AsyncStorage.setItem(storageKey, value);
  };

  const handleRun = async () => {
    if (!lesson) return;
    setRunning(true);
    let localResult;
    try {
      localResult = await runtimeRef.current.run(currentCode, lesson.challenge_expected_output ?? null);
    } catch (error) {
      setRunning(false);
      setCodeOutput("");
      setCodeError(error.message || "Lua runtime is not ready yet.");
      return;
    }
    let finalResult = {
      ...localResult,
      validation_message: null,
      lesson_completed: false,
      xp_earned: 0,
      new_level: null,
      new_badges: []
    };

    try {
      const response = await codeAPI.run({
        code: currentCode,
        lesson_id: lesson.id,
        output: localResult.output,
        success: localResult.success,
        error: localResult.error
      });
      finalResult = { ...finalResult, ...response.data };
    } catch (error) {
      finalResult = {
        ...finalResult,
        success: false,
        error: formatApiError(error)
      };
    }

    setCodeOutput(finalResult.output || "");
    setCodeError(finalResult.error || "");
    setValidationMessage(finalResult.validation_message || "");

    if (finalResult.success === true && finalResult.lesson_completed) {
      setCompleted(true);
      setJustCompleted(true);
      setValidationMessage("");
      await refreshUser();
      Alert.alert(
        "Lesson complete",
        finalResult.xp_earned > 0
          ? `+${finalResult.xp_earned} XP earned.`
          : "Lesson already completed."
      );
    }
    setRunning(false);
  };

  const clearCode = async () => {
    const reset = lesson?.challenge_starter_code || "";
    setCurrentCode(reset);
    setCodeOutput("");
    setCodeError("");
    setValidationMessage("");
    await AsyncStorage.removeItem(storageKey);
  };

  if (loading || !lesson) {
    return (
      <Screen style={{ padding: spacing.lg, justifyContent: "center" }}>
        <StateBlock title="Loading lesson" description="Getting your lesson content, progress, and challenge ready." />
      </Screen>
    );
  }

  return (
    <Screen>
      <LuaRuntime ref={runtimeRef} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>{lesson.difficulty}</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>{lesson.title}</Title>
          <Body style={{ marginTop: spacing.sm }}>Lesson {lessonNum}</Body>
          {mastered ? (
            <Text style={{ color: "#d9bb70", marginTop: spacing.sm, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 11 }}>
              Mastered
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <PrimaryButton label="Lesson" subtle={activeTab !== "lesson"} onPress={() => setActiveTab("lesson")} style={{ flex: showQuiz ? 1 : 0 }} />
          {showQuiz ? (
            <PrimaryButton label="Mastery" subtle={activeTab !== "quiz"} onPress={() => setActiveTab("quiz")} style={{ flex: 1 }} />
          ) : null}
        </View>

        {activeTab === "lesson" ? (
          <>
            <SectionCard>
              {justCompleted ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>Lesson complete</Text>
                  {!isLastLesson ? (
                    <PrimaryButton label="Next lesson" onPress={() => navigation.replace("Lesson", { lessonId: nextId })} />
                  ) : null}
                  <PrimaryButton label="All lessons" subtle onPress={() => navigation.goBack()} />
                  <PrimaryButton
                    label={mastered ? "Review mastery" : "Start mastery"}
                    onPress={() => {
                      setMasteryMode(true);
                      setActiveTab("quiz");
                    }}
                    subtle
                    style={{
                      borderColor: "#8b6b24",
                      backgroundColor: mastered ? "#c7a34b22" : colors.surface,
                    }}
                  />
                </View>
              ) : null}

              {!justCompleted ? (
                <>
                  <SectionCard style={{ padding: 0, borderWidth: 0, backgroundColor: "transparent" }}>
                    <Body style={{ color: colors.text }}>{lesson.content}</Body>
                  </SectionCard>

                  <SectionCard style={{ padding: 0, borderWidth: 0, backgroundColor: "transparent", marginTop: spacing.lg }}>
                    <Eyebrow>Code Example</Eyebrow>
                    <Text style={{ color: colors.text, marginTop: spacing.md, fontFamily: "monospace", lineHeight: 22 }}>
                      {lesson.code_examples}
                    </Text>
                  </SectionCard>

                  <View style={{ marginTop: spacing.lg }}>
                    <Eyebrow>Challenge</Eyebrow>
                    <Body style={{ marginTop: spacing.sm }}>{lesson.challenge_description}</Body>
                    <Body style={{ marginTop: spacing.sm, color: colors.faint }}>
                      Expected output: {lesson.challenge_expected_output}
                    </Body>

                    <TextInput
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      value={currentCode}
                      onChangeText={handleCodeChange}
                      placeholder="-- Write your Lua code here..."
                      placeholderTextColor={colors.faint}
                      textAlignVertical="top"
                      style={{
                        minHeight: 220,
                        marginTop: spacing.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        color: colors.text,
                        padding: spacing.md,
                        fontFamily: "monospace",
                        lineHeight: 22
                      }}
                    />

                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                      <PrimaryButton
                        label={running ? "Running" : "Run"}
                        onPress={handleRun}
                        disabled={running}
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton label="Clear" subtle onPress={clearCode} style={{ flex: 1 }} />
                    </View>

                    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                      <Text style={{ color: colors.faint, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 }}>
                        Output
                      </Text>
                      <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, padding: spacing.md, minHeight: 88 }}>
                        {codeOutput ? <Text style={{ color: colors.text, fontFamily: "monospace" }}>{codeOutput}</Text> : null}
                        {codeError ? (
                          <Text style={{ color: colors.muted, fontFamily: "monospace", marginTop: codeOutput ? spacing.sm : 0 }}>
                            {codeError}
                          </Text>
                        ) : null}
                        {!codeOutput && !codeError ? (
                          <Text style={{ color: colors.faint }}>Run your code to see output here.</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                      <Text style={{ color: colors.faint, fontSize: 12 }}>Complete challenge to pass</Text>
                      <Text style={{ color: colors.faint, fontSize: 12 }}>Output and solution structure both need to pass.</Text>
                      {validationMessage ? <Text style={{ color: colors.muted, fontSize: 12 }}>{validationMessage}</Text> : null}
                    </View>

                    {completed && !masteryMode ? (
                      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                        <PrimaryButton
                          label={mastered ? "Review mastery" : "Start mastery"}
                          onPress={() => {
                            setMasteryMode(true);
                            setActiveTab("quiz");
                          }}
                          subtle
                          style={{
                            borderColor: "#8b6b24",
                            backgroundColor: mastered ? "#c7a34b22" : colors.surface,
                          }}
                        />
                        <Text style={{ color: colors.faint, fontSize: 12 }}>
                          Come back after finishing the lesson to take its mastery quiz.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}
            </SectionCard>
          </>
        ) : (
          <QuizPanel
            lessonId={lesson.id}
            onCompleted={() => setMastered(true)}
            onQuizXp={(xp) => {
              setMastered(true);
              Alert.alert("Mastery complete", `+${xp} XP from quiz!`);
            }}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
