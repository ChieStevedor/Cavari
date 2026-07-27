import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings are coming soon"
      description="Notification preferences, saved views management, and team access controls will live here."
    />
  );
}
