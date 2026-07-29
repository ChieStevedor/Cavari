import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDriverProfileQuery } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { color } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";
import type { DriverDocument } from "@/types/driver";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className="text-text-primary text-[20px] font-bold">{value}</Text>
      <Text className="text-text-tertiary text-[12px] mt-0.5 text-center">{label}</Text>
    </View>
  );
}

const DOC_STATUS_COLOR: Record<DriverDocument["status"], string> = {
  valid: color.go,
  expiring_soon: color.attention,
  expired: color.danger,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const driver = useAuthStore((s) => s.driver);
  const signOut = useAuthStore((s) => s.signOut);
  useDriverProfileQuery();

  if (!driver) return null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="items-center mb-6">
          <View className="h-20 w-20 rounded-full bg-bg-elevated-2 items-center justify-center mb-3">
            <Ionicons name="person" size={36} color={color.textSecondary} />
          </View>
          <Text className="text-text-primary text-[22px] font-bold">{driver.name}</Text>
          <Text className="text-text-secondary text-[14px] mt-0.5">
            {driver.carrierName} · {driver.employeeId}
          </Text>
        </View>

        <Card className="flex-row mb-4">
          <StatTile label="On-Time %" value={`${driver.performance.onTimePercent}%`} />
          <View className="w-px bg-border-subtle" />
          <StatTile label="Completed Jobs" value={String(driver.performance.completedJobs)} />
          <View className="w-px bg-border-subtle" />
          <StatTile label="Rating" value={`★ ${driver.performance.customerRatingAvg}`} />
        </Card>

        <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">Vehicle</Text>
        <Card className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-text-primary text-[15px] font-semibold">{driver.vehicle?.label ?? "Unassigned"}</Text>
            <Text className="text-text-secondary text-[13px]">
              {driver.vehicle ? `${driver.vehicle.type} · ${driver.vehicle.licensePlate}` : ""}
            </Text>
          </View>
          <Ionicons name="car-outline" size={22} color={color.textSecondary} />
        </Card>

        <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">Certifications</Text>
        <Card className="mb-5">
          {driver.certifications.map((cert, idx) => (
            <View
              key={cert.id}
              className={["flex-row items-center justify-between py-2.5", idx > 0 ? "border-t border-border-subtle" : ""].join(" ")}
            >
              <View className="flex-row items-center flex-1">
                {cert.isWhiteGlove ? <Ionicons name="sparkles" size={15} color={color.premium} style={{ marginRight: 8 }} /> : null}
                <Text className="text-text-primary text-[14px] flex-1">{cert.name}</Text>
              </View>
              {cert.expiresAt ? (
                <Text className="text-text-tertiary text-[12px]">Exp. {new Date(cert.expiresAt).getFullYear()}</Text>
              ) : null}
            </View>
          ))}
        </Card>

        <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">Documents</Text>
        <Card className="mb-5">
          {driver.documents.map((doc, idx) => (
            <View
              key={doc.id}
              className={["flex-row items-center justify-between py-2.5", idx > 0 ? "border-t border-border-subtle" : ""].join(" ")}
            >
              <Text className="text-text-primary text-[14px] flex-1">{doc.name}</Text>
              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: DOC_STATUS_COLOR[doc.status] }} />
                <Text className="text-text-tertiary text-[12px] capitalize">{doc.status.replace("_", " ")}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Button label="Sign Out" variant="secondary" onPress={signOut} fullWidth />
      </ScrollView>
    </View>
  );
}
