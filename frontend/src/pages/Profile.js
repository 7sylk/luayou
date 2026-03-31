import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { userAPI } from "@/lib/api";
import { Trophy, Lightning, Star, BookOpen, Target, Fire } from "@phosphor-icons/react";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const BADGE_INFO = {
  first_lesson: { name: "First Steps", desc: "Complete your first lesson", icon: BookOpen },
  five_lessons: { name: "Scholar", desc: "Complete 5 lessons", icon: BookOpen },
  ten_lessons: { name: "Dedicated", desc: "Complete 10 lessons", icon: BookOpen },
  streak_3: { name: "Consistent", desc: "3-day streak", icon: Fire },
  streak_7: { name: "Week Warrior", desc: "7-day streak", icon: Fire },
  streak_30: { name: "Unstoppable", desc: "30-day streak", icon: Fire },
  xp_500: { name: "Rising Star", desc: "Earn 500 XP", icon: Star },
  xp_1000: { name: "XP Hunter", desc: "Earn 1,000 XP", icon: Lightning },
  xp_5000: { name: "XP Master", desc: "Earn 5,000 XP", icon: Lightning },
  daily_5: { name: "Daily Devotee", desc: "Complete 5 daily challenges", icon: Target },
  quiz_master: { name: "Quiz Master", desc: "Get 3 perfect quiz scores", icon: Trophy },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    userAPI.stats().then((r) => setStats(r.data)).catch(() => {});
    // Load current avatar
    if (user?.avatar && user.avatar !== "default") {
      setAvatarSrc(user.avatar);
    }
  }, [user]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 500_000) {
      toast.error("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setUploadingAvatar(true);
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API}/api/user/avatar`,
          { avatar: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvatarSrc(base64);
        await refreshUser();
        toast.success("Avatar updated");
      } catch (e) {
        toast.error(e.response?.data?.detail || "Upload failed");
      }
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const xp = stats?.xp ?? user?.xp ?? 0;
  const level = stats?.level ?? user?.level ?? 1;
  const streak = stats?.streak ?? user?.streak ?? 0;
  const badges = stats?.badges ?? user?.badges ?? [];
  const lessonsCompleted = stats?.lessons_completed ?? 0;
  const dailyCompleted = stats?.daily_completed ?? 0;
  const perfectQuizzes = stats?.perfect_quizzes ?? 0;
  const nextLevelXp = stats?.xp_for_next_level || (level * level * 100);
  const prevLevelXp = ((level - 1) * (level - 1)) * 100;
  const progressPct = nextLevelXp > prevLevelXp
    ? Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="profile-page">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-10 animate-fade-in">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Profile</p>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="w-14 h-14 overflow-hidden border border-white/10 hover:border-white/30 transition-colors relative"
                data-testid="user-avatar"
                title="Click to change avatar"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white text-black flex items-center justify-center font-mono font-bold text-xl">
                    {user?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-mono text-xs text-white">
                    {uploadingAvatar ? "..." : "Edit"}
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <h1 className="font-mono font-bold text-2xl tracking-tight" data-testid="profile-username">
                {user?.username}
              </h1>
              <p className="text-sm text-white/40">{user?.email}</p>
              <p className="font-mono text-xs text-white/20 mt-0.5">Click avatar to change</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="border border-white/10 p-5 mb-6 animate-fade-in stagger-1" data-testid="level-progress">
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-xs text-white/40 uppercase tracking-wider">Level {level}</span>
            <span className="font-mono text-xs text-white/40">{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-2 bg-white/5">
            <div className="h-full bg-white xp-bar" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/10 mb-8 animate-fade-in stagger-2" data-testid="profile-stats">
          {[
            { label: "Total XP", value: xp },
            { label: "Level", value: level },
            { label: "Streak", value: `${streak} days` },
            { label: "Lessons", value: lessonsCompleted },
            { label: "Daily Challenges", value: dailyCompleted },
            { label: "Perfect Quizzes", value: perfectQuizzes },
          ].map((s) => (
            <div key={s.label} className="bg-background p-4">
              <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="font-mono font-bold text-lg">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="animate-fade-in stagger-3" data-testid="badges-section">
          <h2 className="font-mono font-bold text-lg tracking-tight mb-4">Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(BADGE_INFO).map(([key, info]) => {
              const earned = badges.includes(key);
              const Icon = info.icon;
              return (
                <div
                  key={key}
                  className={`border p-4 flex items-center gap-3 ${
                    earned ? "border-white/20 bg-white/[0.02]" : "border-white/5 opacity-30"
                  }`}
                  data-testid={`badge-${key}`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center border ${
                    earned ? "border-white bg-white text-black" : "border-white/10"
                  }`}>
                    <Icon size={14} weight={earned ? "bold" : "regular"} />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold">{info.name}</p>
                    <p className="text-xs text-white/40">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}