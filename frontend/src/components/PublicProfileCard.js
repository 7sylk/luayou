import { Link } from "react-router-dom";
import { BookOpen, Fire, Lightning, UserPlus, Check, X, Gear, Users } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

function Stat({ label, value }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="font-mono text-sm text-white">{value}</p>
    </div>
  );
}

export default function PublicProfileCard({
  profile,
  compact = false,
  showFullProfileLink = true,
  pending = false,
  onAddFriend,
  onAcceptFriend,
  onDeclineFriend,
  onRemoveFriend,
}) {
  if (!profile) return null;

  const primaryAction = (() => {
    if (profile.is_me) {
      return (
        <Button asChild variant="outline" className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5">
          <Link to="/settings">
            <Gear size={14} />
            Settings
          </Link>
        </Button>
      );
    }
    if (profile.is_friend) {
      return (
        <Button
          variant="outline"
          className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5"
          onClick={() => onRemoveFriend?.(profile.username)}
          disabled={pending}
        >
          <Users size={14} />
          Remove friend
        </Button>
      );
    }
    if (profile.incoming_request) {
      return (
        <div className="flex gap-2">
          <Button
            className="rounded-none bg-white text-black hover:bg-white/90"
            onClick={() => onAcceptFriend?.()}
            disabled={pending}
          >
            <Check size={14} />
            Accept
          </Button>
          <Button
            variant="outline"
            className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5"
            onClick={() => onDeclineFriend?.()}
            disabled={pending}
          >
            <X size={14} />
            Decline
          </Button>
        </div>
      );
    }
    if (profile.outgoing_request) {
      return (
        <Button
          variant="outline"
          className="rounded-none border-white/15 bg-transparent text-white hover:bg-white/5"
          onClick={() => onRemoveFriend?.(profile.username)}
          disabled={pending}
        >
          <X size={14} />
          Cancel request
        </Button>
      );
    }
    return (
      <Button
        className="rounded-none bg-white text-black hover:bg-white/90"
        onClick={() => onAddFriend?.(profile.username)}
        disabled={pending}
      >
        <UserPlus size={14} />
        Add friend
      </Button>
    );
  })();

  return (
    <div className="border border-white/10 bg-black/40">
      <div className={`${compact ? "p-4" : "p-6"} border-b border-white/10`}>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden border border-white/10 bg-white/5">
            {profile.avatar && profile.avatar !== "default" ? (
              <img src={profile.avatar} alt={`${profile.username} avatar`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white text-xl font-mono font-bold text-black">
                {profile.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`${compact ? "text-xl" : "text-2xl"} font-mono font-bold tracking-tight text-white`}>
                {profile.username}
              </h1>
              {profile.is_me && (
                <span className="border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  You
                </span>
              )}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              {profile.bio || "No bio yet."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {primaryAction}
          {!profile.is_me && showFullProfileLink && (
            <Button asChild variant="ghost" className="rounded-none text-white/55 hover:bg-white/5 hover:text-white">
              <Link to={`/${profile.username}`}>Open full profile</Link>
            </Button>
          )}
        </div>
      </div>

      <div className={`${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} grid gap-2 p-4`}>
        <Stat label="XP" value={profile.xp.toLocaleString()} />
        <Stat label="Level" value={profile.level} />
        <Stat label="Lessons" value={profile.lessons_completed} />
        <Stat label="Streak" value={`${profile.streak}d`} />
      </div>

      {!compact && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-4">
          <div className="flex items-center gap-2 text-sm text-white/55">
            <Lightning size={14} className="text-white/35" />
            <span>{profile.badges.length} badges</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/55">
            <BookOpen size={14} className="text-white/35" />
            <span>{profile.perfect_quizzes} perfect quizzes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/55">
            <Fire size={14} className="text-white/35" />
            <span>{profile.daily_completed} daily challenges</span>
          </div>
        </div>
      )}
    </div>
  );
}
