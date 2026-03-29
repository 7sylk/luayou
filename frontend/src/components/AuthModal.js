import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatApiError } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AuthModal({ open, onOpenChange, defaultTab = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(defaultTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onOpenChange(false);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Login failed");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(regEmail, regPassword, regUsername);
      onOpenChange(false);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 rounded-none sm:max-w-md p-0 gap-0" data-testid="auth-modal">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-mono font-bold text-lg tracking-tight">
            lua<span className="text-muted-foreground">you</span>
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(""); }} className="p-6 pt-4">
          <TabsList className="bg-transparent border border-white/10 rounded-none h-auto p-0 w-full grid grid-cols-2">
            <TabsTrigger
              value="login"
              className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
              data-testid="auth-tab-login"
            >
              Log in
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
              data-testid="auth-tab-register"
            >
              Sign up
            </TabsTrigger>
          </TabsList>

          {error && (
            <p className="mt-4 text-sm text-red-400 font-mono" data-testid="auth-error">{error}</p>
          )}

          <TabsContent value="login" className="mt-4 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="font-mono text-xs uppercase tracking-wider text-white/60">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1 rounded-none bg-secondary border-white/10 focus:border-white font-mono text-sm"
                  placeholder="you@example.com"
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="font-mono text-xs uppercase tracking-wider text-white/60">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 rounded-none bg-secondary border-white/10 focus:border-white font-mono text-sm"
                  placeholder="password"
                  required
                  data-testid="login-password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none h-10"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? "..." : "Log in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4 space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="reg-username" className="font-mono text-xs uppercase tracking-wider text-white/60">Username</Label>
                <Input
                  id="reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="mt-1 rounded-none bg-secondary border-white/10 focus:border-white font-mono text-sm"
                  placeholder="username"
                  required
                  data-testid="register-username-input"
                />
              </div>
              <div>
                <Label htmlFor="reg-email" className="font-mono text-xs uppercase tracking-wider text-white/60">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="mt-1 rounded-none bg-secondary border-white/10 focus:border-white font-mono text-sm"
                  placeholder="you@example.com"
                  required
                  data-testid="register-email-input"
                />
              </div>
              <div>
                <Label htmlFor="reg-password" className="font-mono text-xs uppercase tracking-wider text-white/60">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="mt-1 rounded-none bg-secondary border-white/10 focus:border-white font-mono text-sm"
                  placeholder="min 6 characters"
                  required
                  data-testid="register-password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none h-10"
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? "..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
