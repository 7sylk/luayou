import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { SignOut, Lightning } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/lessons", label: "Lessons" },
  { path: "/leaderboard", label: "Leaderboard" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-sm" data-testid="app-header">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            className="font-mono font-bold text-lg tracking-tight"
            onClick={() => navigate("/dashboard")}
            data-testid="header-logo"
          >
            lua<span className="text-muted-foreground">you</span>
          </button>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`rounded-none font-mono text-xs uppercase tracking-wider ${
                  location.pathname === item.path
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => navigate(item.path)}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                className="flex items-center gap-2 font-mono text-xs text-white/50 hover:text-white transition-colors"
                onClick={() => navigate("/profile")}
                data-testid="header-profile-btn"
              >
                <Lightning size={14} weight="fill" />
                <span>{user.xp} XP</span>
                <span className="text-white/20">|</span>
                <span>Lv.{user.level}</span>
              </button>
              <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-mono text-xs font-bold cursor-pointer" onClick={() => navigate("/profile")} data-testid="header-avatar">
                {user.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-white/30 hover:text-white hover:bg-white/5 p-1 h-auto"
                onClick={handleLogout}
                data-testid="header-logout-btn"
              >
                <SignOut size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
