import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PublicProfileCard from "@/components/PublicProfileCard";

export default function UserPreviewDialog({
  open,
  onOpenChange,
  profile,
  pending,
  onAddFriend,
  onAcceptFriend,
  onDeclineFriend,
  onRemoveFriend,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-none border-white/10 bg-black p-0 text-white">
        <DialogHeader className="sr-only">
          <DialogTitle>User preview</DialogTitle>
          <DialogDescription>Preview a LuaYou user profile.</DialogDescription>
        </DialogHeader>
        <PublicProfileCard
          profile={profile}
          compact
          pending={pending}
          onAddFriend={onAddFriend}
          onAcceptFriend={onAcceptFriend}
          onDeclineFriend={onDeclineFriend}
          onRemoveFriend={onRemoveFriend}
        />
      </DialogContent>
    </Dialog>
  );
}
