import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { lessonsAPI, dailyAPI, userAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Lightning, Target, BookOpen, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    userAPI.stats().then((r) => setStats(r.data)).catch(() => {});
    lessonsAPI.list().then((r) => setLessons(r.data)).catch(() => {});
    dailyAPI.get().then((r) => setDaily(r.data)).catch(() => {});
  }, []);

  const xp = stats?.xp || user?.xp || 0;
  const level = stats?.level || user?.level || 1;
  const streak = stats?.streak || user?.streak || 0;
  const nextLevelXp = stats?.xp_for_next_level || (level * level * 100);
  const prevLevelXp = ((level - 1) * (level - 1)) * 100;
  const progressPct = nextLevelXp > prevLevelXp ? Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100) : 0;
  const completedCount = stats?.lessons_completed || 0;
  const recentLessons = lessons.slice(0, 5);

  const handleCompleteDaily = async () => {
    if (daily?.completed) return;
    setLoadingDaily(true);
    try {
      const res = await dailyAPI.complete();
      toast.success(`+${res.data.xp_earned} XP earned!`);
      setDaily({ ...daily, completed: true });
      await refreshUser();
      const s = await userAPI.stats();
      setStats(s.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to complete");
    }
    setLoadingDaily(false);
  };

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

        {/* Stats Grid */}
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

        {/* XP Progress */}
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
          {/* Daily Challenge */}
          <div className="border border-white/10 animate-fade-in stagger-3" data-testid="daily-challenge-card">
            <div className="border-b border-white/10 px-5 py-3 flex items-center gap-2">
              <Target size={16} weight="bold" className="text-white/60" />
              <span className="font-mono text-xs uppercase tracking-wider text-white/60">Daily Challenge</span>
            </div>
            {daily ? (
              <div className="p-5">
                <h3 className="font-mono font-bold text-lg mb-2">{daily.title}</h3>
                <p className="text-sm text-white/50 font-light mb-4">{daily.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white/40">+{daily.xp_reward} XP</span>
                  {daily.completed ? (
                    <span className="font-mono text-xs text-white/40 uppercase" data-testid="daily-completed-badge">Completed</span>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                      onClick={handleCompleteDaily}
                      disabled={loadingDaily}
                      data-testid="complete-daily-btn"
                    >
                      {loadingDaily ? "..." : "Complete"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 text-white/30 font-mono text-sm">Loading...</div>
            )}
          </div>

          {/* Recent Lessons */}
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
              {recentLessons.map((lesson) => (
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
