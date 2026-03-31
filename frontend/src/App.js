import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Lessons from "@/pages/Lessons";
import LessonDetail from "@/pages/LessonDetail";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Progress from "@/pages/Progress";
import Developer from "@/pages/Developer";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-muted-foreground text-sm">
          loading<span className="cursor-blink">_</span>
        </span>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-muted-foreground text-sm">
          loading<span className="cursor-blink">_</span>
        </span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
      <Route path="/lessons/:id" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(0 0% 8%)",
              border: "1px solid hsl(0 0% 14%)",
              color: "hsl(0 0% 95%)",
              borderRadius: "0",
              fontFamily: "'IBM Plex Sans', sans-serif",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;