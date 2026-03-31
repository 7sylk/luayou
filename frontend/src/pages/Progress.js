import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { userAPI } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";
import { Check, Lock, Lightning, Fire, Target, Trophy } from "@phosphor-icons/react";

function ProgressSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-12">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-10 w-48 mb-10" />
      <Skeleton className="h-32 mb-6" />
      <div className="grid grid-cols-3 gap-px bg-white/10 mb-8">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-background" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function DifficultyBar({ label, completed, total, color }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs uppercase tracking-wider text-white/40">{label}</span>
        <span className="font-mono text-xs text-white/40">{completed}/{total}</span>
      </div>
      <div className="h-1.5 bg-white/5">
        <div
          className="h-full bg-white transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];
const DIFFICULTY_COLORS = {
  beginner: "text-white/40",
  intermediate: "text-white/60",
  advanced: "text-white",
};

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.progress()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32 font-mono text-sm text-white/30">
          Failed to load progress.
        </div>
      </div>
    );
  }

  const completionPct = data.completion_pct;
  const isComplete = data.completed_lessons === data.total_lessons;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-10 animate-fade-in">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Overview</p>
          <h1 className="font-mono font-black text-3xl sm:text-4xl tracking-tighter">Progress</h1>
        </div>

        {/* Overall completion */}
        <div className="border border-white/10 p-6 mb-6 animate-fade-in">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">
                Curriculum completion
              </p>
              <p className="font-mono font-black text-5xl tracking-tighter">
                {completionPct}<span className="text-white/30 text-2xl">%</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-white/30 mb-1">
                {data.completed_lessons} / {data.total_lessons} lessons
              </p>
              {isComplete && (
                <span className="font-mono text-xs text-white/60 uppercase flex items-center gap-1 justify-end">
                  <Trophy size={12} /> Course complete!
                </span>
              )}
            </div>
          </div>
          <div className="h-2 bg-white/5">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Difficulty breakdown */}
          <div className="mt-6 space-y-3">
            {DIFFICULTY_ORDER.map((diff) => {
              const d = data.by_difficulty[diff];
              return (
                <DifficultyBar
                  key={diff}
                  label={diff}
                  completed={d.completed}
                  total={d.total}
                />
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 mb-8 animate-fade-in stagger-1">
          <div className="bg-background p-5">
            <div className="flex items-center gap-2 mb-1">
              <Lightning size={12} className="text-white/30" />
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider">XP earned</p>
            </div>
            <p className="font-mono font-bold text-2xl">{data.current_xp.toLocaleString()}</p>
          </div>
          <div className="bg-background p-5">
            <div className="flex items-center gap-2 mb-1">
              <Fire size={12} className="text-white/30" />
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider">Streak</p>
            </div>
            <p className="font-mono font-bold text-2xl">{data.streak} days</p>
          </div>
          <div className="bg-background p-5">
            <div className="flex items-center gap-2 mb-1">
              <Target size={12} className="text-white/30" />
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider">Daily done</p>
            </div>
            <p className="font-mono font-bold text-2xl">{data.daily_completed}</p>
          </div>
          <div className="bg-background p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={12} className="text-white/30" />
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider">Perfect quizzes</p>
            </div>
            <p className="font-mono font-bold text-2xl">{data.perfect_quizzes}</p>
          </div>
        </div>

        {/* Lesson map */}
        <div className="animate-fade-in stagger-2">
          <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-white/40 mb-4">
            Lesson map
          </h2>
          <div className="space-y-1">
            {data.lesson_map.map((lesson, i) => {
              const isLocked = !lesson.completed && i > 0 && !data.lesson_map[i - 1]?.completed;
              return (
                <button
                  key={lesson.id}
                  onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
                  disabled={isLocked}
                  className={`w-full text-left border p-4 flex items-center gap-4 transition-colors ${
                    lesson.completed
                      ? "border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
                      : isLocked
                      ? "border-white/5 opacity-30 cursor-not-allowed"
                      : "border-white/10 hover:bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  {/* Status icon */}
                  <div className={`w-7 h-7 flex items-center justify-center border flex-shrink-0 ${
                    lesson.completed
                      ? "border-white bg-white text-black"
                      : isLocked
                      ? "border-white/10"
                      : "border-white/20"
                  }`}>
                    {lesson.completed ? (
                      <Check size={12} weight="bold" />
                    ) : isLocked ? (
                      <Lock size={12} />
                    ) : (
                      <span className="font-mono text-xs text-white/40">{lesson.order_index}</span>
                    )}
                  </div>

                  {/* Title + difficulty */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-sm font-bold truncate ${
                      lesson.completed ? "text-white" : isLocked ? "text-white/30" : "text-white/80"
                    }`}>
                      {lesson.title}
                    </p>
                    <p className={`font-mono text-xs mt-0.5 ${DIFFICULTY_COLORS[lesson.difficulty]}`}>
                      {lesson.difficulty}
                    </p>
                  </div>

                  {/* XP */}
                  <span className="font-mono text-xs text-white/20 flex-shrink-0">
                    +{lesson.xp_reward} XP
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Course complete banner */}
        {isComplete && (
          <div className="mt-8 border border-white/20 p-6 text-center animate-fade-in">
            <Trophy size={32} className="mx-auto mb-3 text-white/60" />
            <h2 className="font-mono font-bold text-xl mb-2">Course complete!</h2>
            <p className="text-sm text-white/50 mb-4">
              You've completed all {data.total_lessons} Lua lessons. You're now a Lua developer.
            </p>
            <p className="font-mono text-xs text-white/30">
              Total XP earned: {data.current_xp.toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}