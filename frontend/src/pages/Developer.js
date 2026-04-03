import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { developerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function calculateLevelFromXp(xp) {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function UserRow({ user, onSave, onDelete }) {
  const [form, setForm] = useState({
    username: user.username || "",
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    streak: user.streak ?? 0,
    lessons_completed: user.lessons_completed ?? 0,
    daily_completed: user.daily_completed ?? 0,
    perfect_quizzes: user.perfect_quizzes ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const changed = useMemo(
    () =>
      form.username !== (user.username || "") ||
      form.xp !== (user.xp ?? 0) ||
      form.level !== (user.level ?? 1) ||
      form.streak !== (user.streak ?? 0) ||
      form.lessons_completed !== (user.lessons_completed ?? 0) ||
      form.daily_completed !== (user.daily_completed ?? 0) ||
      form.perfect_quizzes !== (user.perfect_quizzes ?? 0),
    [form, user]
  );

  const setNumber = (key, value) => {
    const parsed = Number(value);
    const nextValue = Number.isFinite(parsed) ? parsed : 0;
    setForm((f) => {
      if (key === "xp") {
        return {
          ...f,
          xp: nextValue,
          level: calculateLevelFromXp(nextValue),
        };
      }
      return { ...f, [key]: nextValue };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(user.id, form);
      toast.success(`Updated ${user.username}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update user");
    }
    setSaving(false);
  };

  const remove = async () => {
    const confirmationText = user.id;
    const typed = window.prompt(
      `Type this user ID to confirm delete:\n${confirmationText}`
    );
    if (typed !== confirmationText) {
      if (typed !== null) {
        toast.error("Delete cancelled: ID did not match");
      }
      return;
    }
    setDeleting(true);
    try {
      await onDelete(user.id);
      toast.success("User deleted");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete user");
    }
    setDeleting(false);
  };

  return (
    <div className="border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono font-bold text-sm">{user.email}</p>
          <p className="font-mono text-xs text-white/40">User ID: {user.id}</p>
        </div>
        <Button
          variant="ghost"
          className="rounded-none text-white/40 hover:text-white hover:bg-white/5 font-mono text-xs"
          onClick={remove}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Username</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="username"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">XP</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.xp}
            onChange={(e) => setNumber("xp", e.target.value)}
            placeholder="xp"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Level</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.level}
            onChange={(e) => setNumber("level", e.target.value)}
            placeholder="level"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Streak (days)</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.streak}
            onChange={(e) => setNumber("streak", e.target.value)}
            placeholder="streak"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Lessons Completed</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.lessons_completed}
            onChange={(e) => setNumber("lessons_completed", e.target.value)}
            placeholder="lessons completed"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Daily Completed</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.daily_completed}
            onChange={(e) => setNumber("daily_completed", e.target.value)}
            placeholder="daily completed"
          />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">Perfect Quizzes</p>
          <input
            className="w-full bg-background border border-white/10 px-2 py-2 font-mono text-xs"
            type="number"
            value={form.perfect_quizzes}
            onChange={(e) => setNumber("perfect_quizzes", e.target.value)}
            placeholder="perfect quizzes"
          />
        </div>
        <Button
          className="self-end bg-white text-black hover:bg-neutral-200 rounded-none font-mono text-xs uppercase tracking-wider"
          onClick={save}
          disabled={!changed || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function Developer() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [checkRes, usersRes] = await Promise.all([developerAPI.check(), developerAPI.listUsers()]);
      setIsAdmin(Boolean(checkRes.data?.is_admin));
      setUsers(usersRes.data || []);
    } catch (e) {
      if (e.response?.status === 403) {
        setIsAdmin(false);
      } else {
        toast.error("Failed to load developer data");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (id, payload) => {
    const res = await developerAPI.updateUser(id, payload);
    setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
  };

  const handleDelete = async (id) => {
    await developerAPI.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const id = (u.id || "").toLowerCase();
      return email.includes(q) || username.includes(q) || id.includes(q);
    });
  }, [users, search]);

  return (
    <div className="min-h-screen bg-background" data-testid="developer-page">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Admin</p>
          <h1 className="font-mono font-black text-3xl tracking-tighter">Developer Panel</h1>
          <p className="text-sm text-white/50 mt-2">Manage user data. Access is restricted to admin credentials.</p>
        </div>

        {loading ? (
          <div className="font-mono text-sm text-white/30">loading<span className="cursor-blink">_</span></div>
        ) : !isAdmin ? (
          <div className="border border-white/10 p-5 font-mono text-sm text-white/50">
            You do not have access to this page.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-white/40 mb-2">Search Users</p>
              <input
                className="w-full bg-background border border-white/10 px-3 py-2 font-mono text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, username, or user ID (UUID)"
              />
              <p className="font-mono text-xs text-white/30 mt-2">
                {filteredUsers.length} of {users.length} users
              </p>
            </div>
            {filteredUsers.map((u) => (
              <UserRow key={u.id} user={u} onSave={handleSave} onDelete={handleDelete} />
            ))}
            {filteredUsers.length === 0 && (
              <div className="border border-white/10 p-5 font-mono text-sm text-white/40">No users found.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
