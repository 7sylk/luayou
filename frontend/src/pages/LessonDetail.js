import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CodeEditor from "@/components/CodeEditor";
import Quiz from "@/components/Quiz";
import AiTutor from "@/components/AiTutor";
import { lessonsAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeOutput, setCodeOutput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [completed, setCompleted] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);
  const [activeTab, setActiveTab] = useState("lesson");
  const [mobileView, setMobileView] = useState("lesson"); // lesson | editor
  const [totalLessons, setTotalLessons] = useState(1);

  const fetchLesson = useCallback(async () => {
    try {
      const res = await lessonsAPI.get(id);
      setLesson(res.data);
      setCurrentCode(res.data.challenge_starter_code || "");
      setCompleted(res.data.completed);
      setChallengePassed(false);
      setLoading(false);
    } catch {
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

  const handleComplete = async () => {
    if (!challengePassed) {
      toast.error("Pass the code challenge first.");
      return;
    }
    try {
      const res = await lessonsAPI.complete(id);
      if (res.data.xp_earned > 0) {
        toast.success(`+${res.data.xp_earned} XP! Lesson completed.`);
        if (res.data.new_badges?.length > 0) {
          toast.success(`New badge: ${res.data.new_badges.join(", ")}`);
        }
      }
      setCompleted(true);
      await refreshUser();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

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
  const prevId = lessonNum > 1 ? `lesson-${String(lessonNum - 1).padStart(2, "0")}` : null;
  const nextId = lessonNum < totalLessons ? `lesson-${String(lessonNum + 1).padStart(2, "0")}` : null;

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
            {prevId && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none font-mono text-xs text-white/30 hover:text-white"
                onClick={() => navigate(`/lessons/${prevId}`)}
                data-testid="prev-lesson-btn"
              >
                <ArrowLeft size={12} />
              </Button>
            )}
            <span className="font-mono text-xs text-white/20">{lessonNum}/{totalLessons}</span>
            {nextId && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none font-mono text-xs text-white/30 hover:text-white"
                onClick={() => navigate(`/lessons/${nextId}`)}
                data-testid="next-lesson-btn"
              >
                <ArrowRight size={12} />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: side by side. Mobile: toggled single panel */}
        <div className="lg:grid lg:grid-cols-2" style={{ height: "calc(100vh - 7rem)" }}>
          {/* Left panel — lesson content */}
          <div
            className={`border-r border-white/10 overflow-y-auto h-full ${mobileView === "editor" ? "hidden lg:block" : "block"}`}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b border-white/10 rounded-none h-auto p-0 w-full grid grid-cols-3">
                <TabsTrigger value="lesson" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white/5 data-[state=active]:text-white" data-testid="tab-lesson">
                  Lesson
                </TabsTrigger>
                <TabsTrigger value="quiz" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white/5 data-[state=active]:text-white" data-testid="tab-quiz">
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="ai" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white/5 data-[state=active]:text-white" data-testid="tab-ai-tutor">
                  AI Tutor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lesson" className="p-6 m-0">
                <div className="mb-4 flex items-center justify-between">
                  <h1 className="font-mono font-bold text-xl tracking-tight" data-testid="lesson-title">
                    {lesson.title}
                  </h1>
                  {completed && (
                    <span className="flex items-center gap-1 font-mono text-xs text-white/40 uppercase">
                      <Check size={12} /> Done
                    </span>
                  )}
                </div>

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
                      {/* Mobile: button to jump to editor */}
                      <Button
                        className="mb-3 lg:hidden bg-white/10 text-white/60 hover:bg-white/20 font-mono text-xs uppercase tracking-wider rounded-none"
                        onClick={() => setMobileView("editor")}
                      >
                        Open Editor
                      </Button>

                      {challengePassed ? (
                        <Button
                          className="block bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                          onClick={handleComplete}
                          data-testid="mark-complete-btn"
                        >
                          <Check size={12} className="mr-1 inline" />
                          Mark as complete (+{lesson.xp_reward} XP)
                        </Button>
                      ) : (
                        <div>
                          <Button
                            className="bg-white/10 text-white/30 font-mono text-xs uppercase tracking-wider rounded-none cursor-not-allowed"
                            disabled
                            data-testid="mark-complete-btn"
                          >
                            Pass the challenge to complete
                          </Button>
                          <p className="font-mono text-xs text-white/20 mt-2">
                            Run your code until output matches
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="p-6 m-0">
                <Quiz lessonId={id} />
              </TabsContent>

              <TabsContent value="ai" className="p-6 m-0">
                <AiTutor code={currentCode} errorOutput={codeError || codeOutput} lessonId={id} />
              </TabsContent>
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
              onOutputChange={(output, error) => {
                setCodeOutput(output);
                setCodeError(error || "");
              }}
              onCodeChange={setCurrentCode}
              onSuccess={() => {
                setChallengePassed(true);
                setMobileView("lesson"); // switch back so they see the complete button
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}