import { UsersRound } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function DriversPage() {
  return (
    <ComingSoon
      icon={UsersRound}
      title="Driver directory is coming soon"
      description="Shift status, ratings, and vehicle assignments for every driver across your carrier network."
    />
  );
}
