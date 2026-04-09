import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { useLua } from "@/hooks/useLua";
import { lessonsAPI, dailyAPI, userAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Lightning, Target, BookOpen, ArrowRight, Play, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/Skeleton";

function DailyChallengeCard({ daily, onComplete, completing }) {
  const [code, setCode] = useState(daily.challenge_starter_code || "");
  const [expanded, setExpanded] = useState(false);
  const { runLua, output, error, success, running } = useLua();

  const handleRun = async () => {
    await runLua(code, daily.challenge_expected_output);
  };

  const handleComplete = async () => {
    if (success !== true) {
      toast.error("Make your code output match the expected result first.");
      return;
    }
    await onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  };

  if (daily.completed) {
    return (
      <div className="p-5">
        <h3 className="font-mono font-bold text-lg mb-1">{daily.title}</h3>
        <p className="text-sm text-white/50 mb-3">{daily.description}</p>
        <span className="font-mono text-xs text-white/40 uppercase flex items-center gap-1">
          <Check size={12} /> Completed · +{daily.xp_reward} XP
        </span>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h3 className="font-mono font-bold text-lg mb-1">{daily.title}</h3>
      <p className="text-sm text-white/50 mb-2">{daily.description}</p>
      <p className="font-mono text-xs text-white/30 mb-4">
        Expected: <code className="text-white/50">{daily.challenge_expected_output}</code>
      </p>

      {!expanded ? (
        <Button
          size="sm"
          className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
          onClick={() => setExpanded(true)}
        >
          Start Challenge
        </Button>
      ) : (
        <div className="border border-white/10">
          <div className="border-b border-white/10 px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-xs text-white/20">daily.lua</span>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-neutral-200 rounded-none font-mono text-xs uppercase tracking-wider h-6 px-3"
              onClick={handleRun}
              disabled={running}
            >
              <Play size={10} weight="fill" className="mr-1" />
              {running ? "..." : "Run"}
            </Button>
          </div>

          <textarea
            className="code-editor-textarea w-full p-3 bg-background font-mono text-sm"
            style={{ minHeight: "120px", resize: "vertical" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />

          {(output || error) && (
            <div className="border-t border-white/10 p-3">
              {output && (
                <div className="font-mono text-xs text-white/60 whitespace-pre">{output}</div>
              )}
              {error && (
                <div className="font-mono text-xs text-white/40 whitespace-pre">{error}</div>
              )}
            </div>
          )}

          <div className="border-t border-white/10 px-3 py-2 flex items-center justify-between">
            <span className="font-mono text-xs text-white/30">+{daily.xp_reward} XP</span>
            <Button
              size="sm"
              className={`rounded-none font-mono text-xs uppercase tracking-wider h-7 px-4 ${
                success === true && !completing
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
              onClick={handleComplete}
              disabled={success !== true || completing}
            >
              {completing ? "..." : success === true ? "Complete" : "Run first"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    Promise.all([
      userAPI.stats().then((r) => setStats(r.data)).catch(() => {}),
      lessonsAPI.list().then((r) => setLessons(r.data)).catch(() => {}),
      dailyAPI.get().then((r) => setDaily(r.data)).catch(() => {}),
    ])
      .then(() => setError(""))
      .catch((err) => setError(err?.response?.data?.detail || "Some dashboard data could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const xp = stats?.xp || user?.xp || 0;
  const level = stats?.level || user?.level || 1;
  const streak = stats?.streak || user?.streak || 0;
  const nextLevelXp = stats?.xp_for_next_level || (level * level * 100);
  const prevLevelXp = ((level - 1) * (level - 1)) * 100;
  const progressPct = nextLevelXp > prevLevelXp
    ? Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)
    : 0;
  const completedCount = stats?.lessons_completed || 0;
  const recentLessons = lessons.slice(0, 5);

  const handleCompleteDaily = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await dailyAPI.complete();
      toast.success(`+${res.data.xp_earned} XP earned!`);
      if (res.data.new_streak > 1) {
        toast.success(`${res.data.new_streak} day streak!`);
      }
      if (res.data.new_badges?.length > 0) {
        toast.success(`New badge: ${res.data.new_badges.join(", ")}`);
      }
      setDaily((d) => ({ ...d, completed: true }));
      await refreshUser();
      const s = await userAPI.stats();
      setStats(s.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to complete");
    }
    setCompleting(false);
  }, [refreshUser, completing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-10 animate-fade-in">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Dashboard</p>
          <h1 className="font-mono font-black text-3xl sm:text-4xl tracking-tighter">
            Welcome back, <span className="text-white/50">{user?.username}</span>
          </h1>
        </div>

        {error ? (
          <div className="mb-6 border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">Notice</p>
            <p className="mt-2 text-sm text-white/60">{error}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 mb-8 animate-fade-in stagger-1" data-testid="stats-grid">
          <div className="bg-background p-5">
            <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">XP</p>
            <p className="font-mono font-bold text-2xl" data-testid="xp-value">{xp}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">Level</p>
            <p className="font-mono font-bold text-2xl" data-testid="level-value">{level}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">Streak</p>
            <p className="font-mono font-bold text-2xl flex items-center gap-2" data-testid="streak-value">
              {streak} <Lightning size={18} weight="fill" className="text-white/50" />
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">Lessons</p>
            <p className="font-mono font-bold text-2xl" data-testid="lessons-completed">{completedCount}</p>
          </div>
        </div>

        <div className="border border-white/10 p-5 mb-8 animate-fade-in stagger-2" data-testid="xp-progress">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-xs text-white/40 uppercase tracking-wider">Level {level} Progress</span>
            <span className="font-mono text-xs text-white/40">{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-2 bg-white/5">
            <div className="h-full bg-white xp-bar" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-white/10 animate-fade-in stagger-3" data-testid="daily-challenge-card">
            <div className="border-b border-white/10 px-5 py-3 flex items-center gap-2">
              <Target size={16} weight="bold" className="text-white/60" />
              <span className="font-mono text-xs uppercase tracking-wider text-white/60">Daily Challenge</span>
            </div>
            {daily ? (
              <DailyChallengeCard
                key={daily.date}
                daily={daily}
                onComplete={handleCompleteDaily}
                completing={completing}
              />
            ) : (
              <div className="p-5 text-white/30 font-mono text-sm">Daily challenge unavailable right now</div>
            )}
          </div>

          <div className="border border-white/10 animate-fade-in stagger-4" data-testid="recent-lessons">
            <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} weight="bold" className="text-white/60" />
                <span className="font-mono text-xs uppercase tracking-wider text-white/60">Lessons</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-white/40 hover:text-white rounded-none h-auto p-0"
                onClick={() => navigate("/lessons")}
                data-testid="view-all-lessons-btn"
              >
                View all <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
            <div>
              {recentLessons.length ? recentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  className="w-full text-left px-5 py-3 border-b border-white/5 hover:bg-white/[0.02] flex items-center justify-between group transition-colors"
                  onClick={() => !lesson.locked && navigate(`/lessons/${lesson.id}`)}
                  disabled={lesson.locked}
                  data-testid={`lesson-item-${lesson.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs w-5 ${lesson.completed ? "text-white" : "text-white/30"}`}>
                      {lesson.completed ? "+" : lesson.locked ? "x" : "-"}
                    </span>
                    <span className={`text-sm ${lesson.locked ? "text-white/20" : "text-white/80"}`}>
                      {lesson.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-white/20">{lesson.xp_reward}xp</span>
                </button>
              )) : (
                <div className="px-5 py-4 text-sm text-white/35">Lessons are not available right now.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
