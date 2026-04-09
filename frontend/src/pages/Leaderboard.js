import { useState, useEffect } from "react";
import Header from "@/components/Header";
import UserPreviewDialog from "@/components/UserPreviewDialog";
import { leaderboardAPI, userAPI, formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "@phosphor-icons/react";
import { Skeleton } from "@/components/Skeleton";
import { toast } from "sonner";

function LeaderboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-20 pb-12">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="border border-white/10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-7 w-7 rounded-none" />
            <Skeleton className="h-4 w-32" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    Promise.all([
      leaderboardAPI.get(),
      userAPI.friendRequests().catch(() => ({ data: { incoming: [], outgoing: [] } })),
    ])
      .then(([leaderboardRes, requestsRes]) => {
        setEntries(leaderboardRes.data);
        setRequests(requestsRes.data);
        setError("");
      })
      .catch((err) => {
        setEntries([]);
        setError(formatApiError(err?.response?.data?.detail));
      })
      .finally(() => setLoading(false));
  }, []);

  const reloadRequests = async () => {
    try {
      const res = await userAPI.friendRequests();
      setRequests(res.data);
    } catch {
      // ignore
    }
  };

  const openPreview = async (username) => {
    try {
      const res = await userAPI.publicProfile(username);
      setSelectedProfile(res.data);
      setPreviewOpen(true);
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    }
  };

  const incomingForSelected = requests.incoming?.find((item) => item.user.username === selectedProfile?.username);

  const runAction = async (action) => {
    if (!selectedProfile) return;
    setPending(true);
    try {
      await action();
      const [profileRes] = await Promise.all([
        userAPI.publicProfile(selectedProfile.username),
        reloadRequests(),
      ]);
      setSelectedProfile(profileRes.data);
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LeaderboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="leaderboard-page">
      <Header />
      <UserPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        profile={selectedProfile}
        pending={pending}
        onAddFriend={(username) => runAction(() => userAPI.sendFriendRequest(username))}
        onAcceptFriend={() => runAction(() => userAPI.acceptFriendRequest(incomingForSelected?.id))}
        onDeclineFriend={() => runAction(() => userAPI.declineFriendRequest(incomingForSelected?.id))}
        onRemoveFriend={(username) => runAction(() => userAPI.removeFriend(username))}
      />
      <main className="max-w-3xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-8 animate-fade-in">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Rankings</p>
          <h1 className="font-mono font-black text-3xl sm:text-4xl tracking-tighter flex items-center gap-3">
            Leaderboard <Trophy size={28} weight="bold" className="text-white/40" />
          </h1>
        </div>

        {error ? (
          <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="font-mono text-sm text-white/70">Leaderboard could not be loaded.</p>
            <p className="mt-2 text-sm text-white/35">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="border border-white/10 p-8 text-center font-mono text-sm text-white/30">
            No users yet. Be the first!
          </div>
        ) : (
          <div className="border border-white/10 animate-fade-in stagger-1" data-testid="leaderboard-table">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-white/40 w-16">Rank</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-white/40">User</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-white/40 text-right">Level</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-white/40 text-right">XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isMe = entry.username === user?.username;
                  return (
                    <TableRow
                      key={entry.rank}
                      className={`border-white/5 cursor-pointer ${isMe ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
                      data-testid={`leaderboard-row-${entry.rank}`}
                      onClick={() => openPreview(entry.username)}
                    >
                      <TableCell className="font-mono font-bold text-sm">
                        {entry.rank <= 3 ? (
                          <span className={entry.rank === 1 ? "text-white" : "text-white/60"}>
                            #{entry.rank}
                          </span>
                        ) : (
                          <span className="text-white/30">#{entry.rank}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold overflow-hidden ${
                            isMe ? "bg-white text-black" : "bg-white/10 text-white/60"
                          }`}>
                            {entry.avatar && entry.avatar !== "default" ? (
                              <img src={entry.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              entry.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className={`font-mono text-sm ${isMe ? "font-bold text-white" : "text-white/70"}`}>
                            {entry.username}{isMe && " (you)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/50 text-right">
                        {entry.level}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-right" data-testid={`leaderboard-xp-${entry.rank}`}>
                        {entry.xp.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
