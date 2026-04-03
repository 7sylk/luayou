import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PublicProfileCard from "@/components/PublicProfileCard";
import { userAPI, formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PublicProfile() {
  const { username } = useParams();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [notFound, setNotFound] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [profileRes, requestRes] = await Promise.all([
        userAPI.publicProfile(username),
        user ? userAPI.friendRequests() : Promise.resolve({ data: { incoming: [], outgoing: [] } }),
      ]);
      setProfile(profileRes.data);
      setRequests(requestRes.data);
      setNotFound(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(formatApiError(error.response?.data?.detail));
      }
    } finally {
      setLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const matchingIncomingRequest = requests.incoming?.find((item) => item.user.username === profile?.username);

  const runAction = async (action) => {
    if (!profile) return;
    setPending(true);
    try {
      await action();
      await refreshUser();
      await loadProfile();
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setPending(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-6 pb-12 pt-24">
          <p className="font-mono text-sm text-white/40">That profile does not exist.</p>
          <Button asChild variant="ghost" className="mt-4 rounded-none text-white/60 hover:bg-white/5 hover:text-white">
            <Link to="/leaderboard">Back to leaderboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (profile?.is_me) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-12 pt-20">
        {loading ? (
          <p className="font-mono text-sm text-white/40">Loading profile...</p>
        ) : (
          <PublicProfileCard
            profile={profile}
            showFullProfileLink={false}
            pending={pending}
            onAddFriend={(targetUsername) => runAction(() => userAPI.sendFriendRequest(targetUsername))}
            onAcceptFriend={() => runAction(() => userAPI.acceptFriendRequest(matchingIncomingRequest?.id))}
            onDeclineFriend={() => runAction(() => userAPI.declineFriendRequest(matchingIncomingRequest?.id))}
            onRemoveFriend={(targetUsername) => runAction(() => userAPI.removeFriend(targetUsername))}
          />
        )}
      </main>
    </div>
  );
}
