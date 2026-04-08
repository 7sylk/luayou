import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import CodeEditor from "@/components/CodeEditor";
import Quiz from "@/components/Quiz";
import { lessonsAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Check, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeOutput, setCodeOutput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("lesson");
  const [mobileView, setMobileView] = useState("lesson"); // lesson | editor
  const [totalLessons, setTotalLessons] = useState(1);
  const [mastered, setMastered] = useState(false);
  const masteryMode = searchParams.get("mode") === "mastery";

  const fetchLesson = useCallback(async () => {
    try {
      const res = await lessonsAPI.get(id);
      setLesson(res.data);
      setCurrentCode(res.data.challenge_starter_code || "");
      setCompleted(res.data.completed);
      setMastered(Boolean(res.data.mastered));
      setChallengePassed(false);
      setJustCompleted(false);
      setValidationMessage("");
      setActiveTab("lesson");
      setLoading(false);
    } catch (error) {
      const redirectLessonId = error.response?.data?.detail?.redirect_lesson_id;
      if (redirectLessonId) {
        navigate(`/lessons/${redirectLessonId}`, { replace: true });
        return;
      }
      navigate("/lessons");
    }
  }, [id, navigate]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);
  useEffect(() => {
    lessonsAPI
      .list()
      .then((res) => setTotalLessons(Math.max(1, res.data?.length || 1)))
      .catch(() => {});
  }, []);

  if (loading || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32 font-mono text-sm text-white/30">
          loading<span className="cursor-blink">_</span>
        </div>
      </div>
    );
  }

  const lessonNum = lesson.order_index;
  const nextId = lessonNum < totalLessons ? `lesson-${String(lessonNum + 1).padStart(2, "0")}` : null;
  const isLastLesson = lessonNum >= totalLessons;
  const showQuiz = masteryMode && completed;

  return (
    <div className="min-h-screen bg-background" data-testid="lesson-detail-page">
      <Header />
      <main className="pt-14">
        {/* Top bar */}
        <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none font-mono text-xs text-white/40 hover:text-white"
              onClick={() => navigate("/lessons")}
              data-testid="back-to-lessons-btn"
            >
              <ArrowLeft size={14} className="mr-1" /> Lessons
            </Button>
            <span className="text-white/10">|</span>
            <span className="font-mono text-xs text-white/40 uppercase tracking-wider hidden sm:inline">
              {lesson.difficulty}
            </span>
          </div>

          {/* Mobile view toggle */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              className={`font-mono text-xs px-3 py-1 border ${mobileView === "lesson" ? "border-white/30 text-white" : "border-white/10 text-white/30"}`}
              onClick={() => setMobileView("lesson")}
            >
              Lesson
            </button>
            <button
              className={`font-mono text-xs px-3 py-1 border ${mobileView === "editor" ? "border-white/30 text-white" : "border-white/10 text-white/30"}`}
              onClick={() => setMobileView("editor")}
            >
              Editor
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/20">Lesson {lessonNum}</span>
          </div>
        </div>

        {/* Desktop: side by side. Mobile: toggled single panel */}
        <div className="lg:grid lg:grid-cols-2" style={{ height: "calc(100vh - 7rem)" }}>
          {/* Left panel — lesson content */}
          <div
            className={`border-r border-white/10 overflow-y-auto h-full ${mobileView === "editor" ? "hidden lg:block" : "block"}`}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`bg-transparent border-b border-white/10 rounded-none h-auto p-0 w-full grid ${showQuiz ? "grid-cols-2" : "grid-cols-1"}`}>
                <TabsTrigger value="lesson" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white/5 data-[state=active]:text-white" data-testid="tab-lesson">
                  Lesson
                </TabsTrigger>
                {showQuiz && (
                  <TabsTrigger value="quiz" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white/5 data-[state=active]:text-white" data-testid="tab-quiz">
                    Mastery
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="lesson" className="p-6 m-0">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="font-mono font-bold text-xl tracking-tight" data-testid="lesson-title">
                      {lesson.title}
                    </h1>
                    {mastered ? (
                      <span className="flex items-center gap-1 border border-[#8b6b24]/50 bg-[#c7a34b]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#d9bb70]">
                        <Sparkle size={11} weight="fill" /> Mastered
                      </span>
                    ) : completed ? (
                      <span className="flex items-center gap-1 font-mono text-xs text-white/40 uppercase">
                        <Check size={12} /> Done
                      </span>
                    ) : null}
                  </div>
                </div>

                {justCompleted ? (
                  <div className="border border-white/20 p-5">
                    <p className="font-mono text-xs text-white/60 mb-4 flex items-center gap-2">
                      <Check size={12} /> Lesson complete!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {!isLastLesson ? (
                        <Button
                          className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                          onClick={() => navigate(`/lessons/${nextId}`)}
                        >
                          Next lesson <ArrowRight size={12} className="ml-1" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        className="font-mono text-xs text-white/40 hover:text-white rounded-none"
                        onClick={() => navigate("/lessons")}
                      >
                        All lessons
                      </Button>
                      <Button
                        className={`rounded-none font-mono text-xs uppercase tracking-wider ${
                          mastered
                            ? "border border-[#8b6b24]/50 bg-[#c7a34b]/10 text-[#d9bb70] hover:bg-[#c7a34b]/15"
                            : "border border-[#8b6b24]/40 bg-transparent text-[#c7a34b] hover:border-[#c7a34b] hover:bg-[#c7a34b]/10"
                        }`}
                        onClick={() => {
                          setSearchParams({ mode: "mastery" });
                          setActiveTab("quiz");
                        }}
                      >
                        {mastered ? "Review mastery" : "Start mastery"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line mb-6" data-testid="lesson-content">
                      {lesson.content}
                    </div>

                    <div className="mb-6">
                      <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white/40 mb-3">Code Examples</h3>
                      <pre className="bg-secondary p-4 border border-white/10 font-mono text-sm text-white/80 leading-relaxed overflow-x-auto" data-testid="code-examples">
                        {lesson.code_examples}
                      </pre>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white/40 mb-3">Challenge</h3>
                      <p className="text-sm text-white/60 mb-4" data-testid="challenge-description">
                        {lesson.challenge_description}
                      </p>
                      <p className="font-mono text-xs text-white/30 mb-6">
                        Expected output: <code className="text-white/50">{lesson.challenge_expected_output}</code>
                      </p>

                      {!completed && (
                        <div>
                          <Button
                            className="mb-3 lg:hidden bg-white/10 text-white/60 hover:bg-white/20 font-mono text-xs uppercase tracking-wider rounded-none"
                            onClick={() => setMobileView("editor")}
                          >
                            Open Editor
                          </Button>

                          <div>
                            <Button
                              className="bg-white/10 text-white/30 font-mono text-xs uppercase tracking-wider rounded-none cursor-not-allowed"
                              disabled
                              data-testid="mark-complete-btn"
                            >
                              Complete challenge to pass
                            </Button>
                            <p className="font-mono text-xs text-white/20 mt-2">
                              Output and solution structure both need to pass
                            </p>
                            {validationMessage && (
                              <p className="font-mono text-xs text-white/35 mt-2">
                                {validationMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {completed && !masteryMode && (
                        <div className="mt-6 border-t border-white/10 pt-6">
                          <Button
                            className={`rounded-none font-mono text-xs uppercase tracking-wider ${
                              mastered
                                ? "border border-[#8b6b24]/50 bg-[#c7a34b]/10 text-[#d9bb70] hover:bg-[#c7a34b]/15"
                                : "border border-[#8b6b24]/40 bg-transparent text-[#c7a34b] hover:border-[#c7a34b] hover:bg-[#c7a34b]/10"
                            }`}
                            onClick={() => {
                              setSearchParams({ mode: "mastery" });
                              setActiveTab("quiz");
                            }}
                          >
                            {mastered ? "Review mastery" : "Start mastery"}
                          </Button>
                          <p className="mt-2 font-mono text-xs text-white/25">
                            Come back after finishing the lesson to take its mastery quiz.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {showQuiz && (
                <TabsContent value="quiz" className="p-6 m-0">
                  <Quiz
                    lessonId={id}
                    onCompleted={() => {
                      setMastered(true);
                    }}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right panel — editor */}
          <div
            className={`flex flex-col overflow-hidden h-full ${mobileView === "lesson" ? "hidden lg:flex" : "flex"}`}
          >
            <CodeEditor
              lessonId={id}
              starterCode={lesson.challenge_starter_code}
              expectedOutput={lesson.challenge_expected_output}
              onOutputChange={(output, error, result) => {
                setCodeOutput(output);
                setCodeError(error || "");
                setValidationMessage(result?.validation_message || "");
              }}
              onCodeChange={setCurrentCode}
              onSuccess={async (result) => {
                setChallengePassed(true);
                setMobileView("lesson");
                if (result?.lesson_completed) {
                  setCompleted(true);
                  setJustCompleted(true);
                  setValidationMessage("");
                  if (result.xp_earned > 0) {
                    toast.success(`+${result.xp_earned} XP! Lesson completed.`);
                  } else {
                    toast.success("Lesson already completed.");
                  }
                  if (result?.new_badges?.length > 0) {
                    toast.success(`New badge: ${result.new_badges.join(", ")}`);
                  }
                  await refreshUser();
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
