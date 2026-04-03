import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { userAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import PublicProfileCard from "@/components/PublicProfileCard";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    userAPI.stats().then((res) => setStats(res.data)).catch(() => {});
    userAPI.friends().then((res) => setFriends(res.data)).catch(() => {});
  }, []);

  const profile = user
    ? {
        ...user,
        bio: user.bio || "",
        is_me: true,
        is_friend: false,
        incoming_request: false,
        outgoing_request: false,
      }
    : null;

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-12 pt-20">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/35">Profile</p>
            <h1 className="font-mono text-3xl font-bold tracking-tight">Your profile</h1>
          </div>
          <Button asChild variant="outline" className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5">
            <Link to="/settings">Open settings</Link>
          </Button>
        </div>

        {profile && (
          <PublicProfileCard profile={{ ...profile, ...stats }} />
        )}

        <section className="mt-6 border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-mono text-lg font-bold tracking-tight">Friends</h2>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/35">{friends.length} total</span>
          </div>
          {friends.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {friends.map((friend) => (
                <Link
                  key={friend.id}
                  to={`/${friend.username}`}
                  className="border border-white/10 p-4 transition-colors hover:border-white/20 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden border border-white/10 bg-white/5">
                      {friend.avatar && friend.avatar !== "default" ? (
                        <img src={friend.avatar} alt={`${friend.username} avatar`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white font-mono font-bold text-black">
                          {friend.username?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-white">{friend.username}</p>
                      <p className="text-xs text-white/45">Level {friend.level} · {friend.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">No friends yet. You can add people from the leaderboard or their public profile.</p>
          )}
        </section>
      </main>
    </div>
  );
}
