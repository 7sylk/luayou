import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { Terminal, Code, Trophy, Lightning, Brain, Target } from "@phosphor-icons/react";

const FEATURES = [
  { icon: Code, title: "Interactive Editor", desc: "Write and run Lua code directly in your browser" },
  { icon: Lightning, title: "XP & Levels", desc: "Earn XP, level up, and unlock new content" },
  { icon: Brain, title: "AI Tutor", desc: "Get intelligent hints and explanations powered by GPT" },
  { icon: Trophy, title: "Leaderboard", desc: "Compete globally and climb the rankings" },
  { icon: Target, title: "Daily Challenges", desc: "Fresh coding challenges every day" },
  { icon: Terminal, title: "15+ Lessons", desc: "Structured curriculum from beginner to advanced" },
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-lg tracking-tight" data-testid="logo">
            lua<span className="text-muted-foreground">you</span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="font-mono text-xs uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 rounded-none"
              onClick={openLogin}
              data-testid="nav-login-btn"
            >
              Log in
            </Button>
            <Button
              className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none px-5"
              onClick={openRegister}
              data-testid="nav-signup-btn"
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-6">
            Gamified Lua Programming
          </p>
          <h1 className="font-mono font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1.05] mb-6">
            Learn Lua.<br />
            <span className="text-white/40">Level up.</span>
          </h1>
          <p className="text-base text-white/60 max-w-lg leading-relaxed mb-10 font-light">
            Master Lua programming through interactive lessons, coding challenges,
            and AI-powered tutoring. Earn XP, unlock levels, and compete on the leaderboard.
          </p>
          <div className="flex gap-3">
            <Button
              className="bg-white text-black hover:bg-neutral-200 font-mono text-sm uppercase tracking-wider rounded-none px-8 h-11"
              onClick={openRegister}
              data-testid="hero-get-started-btn"
            >
              Get started
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 font-mono text-sm uppercase tracking-wider rounded-none px-8 h-11"
              onClick={openLogin}
              data-testid="hero-login-btn"
            >
              Log in
            </Button>
          </div>
        </div>
      </section>

      {/* Terminal Preview */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto border border-white/10">
          <div className="border-b border-white/10 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-white/20" />
            <div className="w-2 h-2 bg-white/20" />
            <div className="w-2 h-2 bg-white/20" />
            <span className="ml-3 font-mono text-xs text-white/30">main.lua</span>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed">
            <div><span className="text-white/40">--</span> <span className="text-white/50">Welcome to LuaYou</span></div>
            <div className="mt-2">
              <span className="text-white/60 font-bold">local</span>{" "}
              <span className="text-white">student</span>{" "}
              <span className="text-white/40">=</span>{" "}
              <span className="text-white/80">"you"</span>
            </div>
            <div>
              <span className="text-white/60 font-bold">local</span>{" "}
              <span className="text-white">level</span>{" "}
              <span className="text-white/40">=</span>{" "}
              <span className="text-white">1</span>
            </div>
            <div className="mt-2">
              <span className="text-white/60 font-bold">print</span>
              <span className="text-white/40">(</span>
              <span className="text-white/80">"Hello, "</span>{" "}
              <span className="text-white/40">..</span>{" "}
              <span className="text-white">student</span>{" "}
              <span className="text-white/40">..</span>{" "}
              <span className="text-white/80">"!"</span>
              <span className="text-white/40">)</span>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 text-white/30">
              &gt; Hello, you!
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono font-bold text-2xl sm:text-3xl tracking-tight mb-12">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-background p-8 flex flex-col gap-4"
                data-testid={`feature-card-${i}`}
              >
                <f.icon size={24} weight="regular" className="text-white/60" />
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider">
                  {f.title}
                </h3>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-mono text-xs text-white/30">
            luayou -- learn lua the fun way
          </span>
          <span className="font-mono text-xs text-white/20">2026</span>
        </div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </div>
  );
}
