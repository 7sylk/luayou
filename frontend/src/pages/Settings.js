import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/AuthContext";
import { userAPI, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    if (user?.avatar && user.avatar !== "default") {
      setAvatarSrc(user.avatar);
    } else {
      setAvatarSrc(null);
    }
  }, [user]);

  useEffect(() => {
    userAPI.friendRequests().then((res) => setRequests(res.data)).catch(() => {});
  }, []);

  const reloadRequests = async () => {
    try {
      const res = await userAPI.friendRequests();
      setRequests(res.data);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateSettings({ username, bio });
      await refreshUser();
      toast.success("Settings updated");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 500_000) {
      toast.error("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      setUploadingAvatar(true);
      try {
        const response = await userAPI.updateAvatar({ avatar: loadEvent.target?.result });
        setAvatarSrc(response.data?.avatar || null);
        await refreshUser();
        toast.success("Avatar updated");
      } catch (error) {
        toast.error(formatApiError(error.response?.data?.detail));
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      if (action === "accept") {
        await userAPI.acceptFriendRequest(requestId);
      } else {
        await userAPI.declineFriendRequest(requestId);
      }
      await reloadRequests();
      toast.success(action === "accept" ? "Friend added" : "Request declined");
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-12 pt-20">
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/35">Settings</p>
          <h1 className="font-mono text-3xl font-bold tracking-tight">Account settings</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-6 flex items-start gap-4">
              <button
                className="h-16 w-16 overflow-hidden border border-white/10 bg-white/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white font-mono text-2xl font-bold text-black">
                    {user?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </button>
              <div>
                <p className="font-mono text-sm text-white">Profile photo</p>
                <p className="mt-1 text-sm text-white/45">Click to change. PNG, JPG, GIF, or WebP under 500KB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-white/35">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={24}
                  className="rounded-none border-white/10 bg-black text-white"
                />
                <p className="mt-2 text-xs text-white/40">
                  3-24 characters, no spaces, letters first. Username changes are rate-limited.
                </p>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-white/35">
                  Bio
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="min-h-[120px] rounded-none border-white/10 bg-black text-white"
                />
                <p className="mt-2 text-xs text-white/40">{bio.length}/160 characters</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-none bg-white text-black hover:bg-white/90"
                onClick={handleSave}
                disabled={saving || uploadingAvatar}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button asChild variant="ghost" className="rounded-none text-white/55 hover:bg-white/5 hover:text-white">
                <Link to="/profile">Back to profile</Link>
              </Button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <h2 className="font-mono text-lg font-bold tracking-tight">Incoming requests</h2>
              <div className="mt-4 space-y-3">
                {requests.incoming?.length ? requests.incoming.map((item) => (
                  <div key={item.id} className="border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono text-sm text-white">{item.user.username}</p>
                        <p className="mt-1 text-xs text-white/45">{item.user.bio || "No bio yet."}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="rounded-none bg-white text-black hover:bg-white/90" onClick={() => handleRequestAction(item.id, "accept")}>
                          Accept
                        </Button>
                        <Button variant="outline" className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5" onClick={() => handleRequestAction(item.id, "decline")}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-white/40">No incoming requests right now.</p>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <h2 className="font-mono text-lg font-bold tracking-tight">Outgoing requests</h2>
              <div className="mt-4 space-y-3">
                {requests.outgoing?.length ? requests.outgoing.map((item) => (
                  <div key={item.id} className="border border-white/10 p-4">
                    <p className="font-mono text-sm text-white">{item.user.username}</p>
                    <p className="mt-1 text-xs text-white/45">Pending</p>
                  </div>
                )) : (
                  <p className="text-sm text-white/40">No pending outgoing requests.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
