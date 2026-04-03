import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { developerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  SignOut,
  Lightning,
  List,
  X,
  CaretDown,
  Gear,
  UserCircle,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/lessons", label: "Lessons" },
  { path: "/leaderboard", label: "Leaderboard" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    developerAPI
      .check()
      .then((res) => setIsAdmin(Boolean(res.data?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const hasAvatar = user?.avatar && user.avatar !== "default";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-sm" data-testid="app-header">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            className="font-mono font-bold text-lg tracking-tight"
            onClick={() => handleNav("/dashboard")}
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
                onClick={() => handleNav(item.path)}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Button>
            ))}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none font-mono text-xs uppercase tracking-wider ${
                  location.pathname === "/developer"
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => handleNav("/developer")}
                data-testid="nav-developer"
              >
                Developer
              </Button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                className="hidden sm:flex items-center gap-2 font-mono text-xs text-white/50 hover:text-white transition-colors"
                onClick={() => handleNav("/dashboard")}
                data-testid="header-profile-btn"
              >
                <Lightning size={14} weight="fill" />
                <span>{user.xp} XP</span>
                <span className="text-white/20">|</span>
                <span>Lv.{user.level}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden sm:flex items-center gap-2 border border-white/10 px-2 py-1.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.03]"
                    data-testid="header-avatar"
                  >
                    <div className="flex w-7 h-7 overflow-hidden items-center justify-center font-mono text-xs font-bold">
                      {hasAvatar ? (
                        <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="bg-white text-black w-full h-full flex items-center justify-center">
                          {user.username?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">Account</span>
                      <span className="font-mono text-xs text-white">{user.username}</span>
                    </div>
                    <CaretDown size={12} className="text-white/35" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-none border-white/10 bg-black p-1 text-white"
                >
                  <DropdownMenuItem
                    className="rounded-none font-mono text-xs text-white/75 focus:bg-white/5 focus:text-white"
                    onClick={() => handleNav("/profile")}
                  >
                    <UserCircle size={14} />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-none font-mono text-xs text-white/75 focus:bg-white/5 focus:text-white"
                    onClick={() => handleNav("/settings")}
                  >
                    <Gear size={14} />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="rounded-none font-mono text-xs text-white/75 focus:bg-white/5 focus:text-white"
                    onClick={handleLogout}
                  >
                    <SignOut size={14} />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="sm:hidden text-white/40 hover:text-white p-1"
                onClick={() => setMobileOpen((open) => !open)}
                data-testid="header-mobile-menu"
              >
                {mobileOpen ? <X size={20} /> : <List size={20} />}
              </button>
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-14 sm:hidden">
          <div className="flex flex-col p-6 gap-1">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <div
                className="w-10 h-10 overflow-hidden border border-white/10 flex items-center justify-center font-mono text-sm font-bold cursor-pointer"
                onClick={() => handleNav("/profile")}
              >
                {hasAvatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="bg-white text-black w-full h-full flex items-center justify-center">
                    {user?.username?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-mono font-bold text-sm">{user?.username}</p>
                <p className="font-mono text-xs text-white/40">
                  {user?.xp} XP · Lv.{user?.level}
                </p>
              </div>
            </div>

            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                className={`w-full text-left font-mono text-sm px-4 py-3 border transition-colors ${
                  location.pathname === item.path
                    ? "border-white/30 text-white bg-white/5"
                    : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
                }`}
                onClick={() => handleNav(item.path)}
              >
                {item.label}
              </button>
            ))}

            {isAdmin && (
              <button
                className={`w-full text-left font-mono text-sm px-4 py-3 border transition-colors ${
                  location.pathname === "/developer"
                    ? "border-white/30 text-white bg-white/5"
                    : "border-white/10 text-white/40 hover:text-white hover:border-white/20"
                }`}
                onClick={() => handleNav("/developer")}
              >
                Developer
              </button>
            )}

            <button
              className="w-full text-left font-mono text-sm px-4 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/20"
              onClick={() => handleNav("/profile")}
            >
              Profile
            </button>

            <button
              className="w-full text-left font-mono text-sm px-4 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/20"
              onClick={() => handleNav("/settings")}
            >
              Settings
            </button>

            <button
              className="w-full text-left font-mono text-sm px-4 py-3 border border-white/10 text-white/40 hover:text-white hover:border-white/20 mt-4"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
