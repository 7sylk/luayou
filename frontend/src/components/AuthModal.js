import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

export default function AuthModal({ open, onOpenChange, defaultTab }) {
  const { setSession } = useAuth();
  const [mode, setMode] = useState(defaultTab || "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifyEntry, setShowVerifyEntry] = useState(false);

  useEffect(() => {
    setMode(defaultTab || "login");
    setShowVerifyEntry(defaultTab === "verify");
  }, [defaultTab]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      setSession(res.data.token, res.data.user);
      close();
    } catch (e) {
      const detail = e.response?.data?.detail || "Login failed";
      if (
        e.response?.status === 403 &&
        typeof detail === "string" &&
        detail.toLowerCase().includes("email not verified")
      ) {
        toast.error(detail);
        setShowVerifyEntry(true);
        setMode("verify");
      } else {
        toast.error(detail);
      }
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/register`, { email, password, username });
      toast.success("Account created. Check your email for a verification code.");
      setShowVerifyEntry(true);
      setMode("verify");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/verify-email`, { email, code: verificationCode });
      toast.success("Email verified. You can now sign in.");
      setMode("login");
      setShowVerifyEntry(false);
      setVerificationCode("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Verification failed");
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/resend-verification`, { email });
      toast.success("Verification code sent if email exists.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to resend verification");
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      toast.success("Reset code sent if email exists.");
      setMode("reset");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to send reset code");
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, {
        token: resetToken,
        password: newPassword,
      });
      toast.success("Password reset! Please log in.");
      setMode("login");
      setPassword("");
      setResetToken("");
      setNewPassword("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Reset failed");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "register") handleRegister();
      else if (mode === "verify") handleVerify();
      else if (mode === "forgot") handleForgot();
      else if (mode === "reset") handleReset();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="bg-background border border-white/10 w-full max-w-sm" data-testid="auth-modal">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-white/40">
            {mode === "login" && "Sign in"}
            {mode === "register" && "Create account"}
            {mode === "verify" && "Verify email"}
            {mode === "forgot" && "Forgot password"}
            {mode === "reset" && "Reset password"}
          </span>
          <button
            onClick={close}
            className="font-mono text-xs text-white/30 hover:text-white"
            data-testid="auth-modal-close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4" onKeyDown={handleKeyDown}>
          {mode === "login" && (
            <>
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="email"
                type="email"
                name="login-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
              />
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="password"
                type="password"
                name="login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
              />
              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                onClick={handleLogin}
                disabled={loading}
                data-testid="login-btn"
              >
                {loading ? "..." : "Sign in"}
              </Button>
              <div className="flex justify-between">
                <button
                  className="font-mono text-xs text-white/30 hover:text-white"
                  onClick={() => setMode("register")}
                  data-testid="switch-to-register"
                >
                  Create account
                </button>
                <button
                  className="font-mono text-xs text-white/30 hover:text-white"
                  onClick={() => setMode("forgot")}
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
              {showVerifyEntry && (
                <button
                  className="font-mono text-xs text-white/30 hover:text-white"
                  onClick={() => setMode("verify")}
                >
                  Enter verification code
                </button>
              )}
            </>
          )}

          {mode === "register" && (
            <>
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="username"
                type="text"
                name="register-username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="username-input"
              />
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="email"
                type="email"
                name="register-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
              />
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="password"
                type="password"
                name="register-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
              />
              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                onClick={handleRegister}
                disabled={loading}
                data-testid="register-btn"
              >
                {loading ? "..." : "Create account"}
              </Button>
              <button
                className="font-mono text-xs text-white/30 hover:text-white"
                onClick={() => setMode("login")}
                data-testid="switch-to-login"
              >
                Already have an account?
              </button>
            </>
          )}

          {mode === "verify" && (
            <>
              <p className="font-mono text-xs text-white/40">
                Enter the 6-digit code sent to your email.
              </p>
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="email"
                type="email"
                name="verify-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="verification code"
                type="text"
                name="verification-code"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? "..." : "Verify email"}
              </Button>
              <div className="space-y-3 pt-2">
                <button
                  className="block w-full text-left font-mono text-xs text-white/30 hover:text-white"
                  onClick={handleResendVerification}
                >
                  Resend verification code
                </button>
                <button
                  className="block w-full text-left font-mono text-xs text-white/30 hover:text-white"
                  onClick={() => setMode("login")}
                >
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <>
              <p className="font-mono text-xs text-white/40">
                Enter your email and we'll send a reset code.
              </p>
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="email"
                type="email"
                name="forgot-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                onClick={handleForgot}
                disabled={loading}
              >
                {loading ? "..." : "Send reset code"}
              </Button>
              <button
                className="font-mono text-xs text-white/30 hover:text-white"
                onClick={() => setMode("login")}
              >
                Back to sign in
              </button>
            </>
          )}

          {mode === "reset" && (
            <>
              <p className="font-mono text-xs text-white/40">
                Enter your reset code and choose a new password.
              </p>
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="reset code"
                type="text"
                name="reset-code"
                autoComplete="one-time-code"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
              <input
                className="w-full bg-white/5 border border-white/10 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-white/30"
                placeholder="new password"
                type="password"
                name="reset-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                className="w-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "..." : "Reset password"}
              </Button>
              <button
                className="font-mono text-xs text-white/30 hover:text-white"
                onClick={() => setMode("login")}
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
