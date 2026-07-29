import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";

interface PrimaryActionBarProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}

/** Fixed bottom CTA bar — the "one primary action per screen" pattern used
 * across every guided-workflow step. Respects safe-area so it never sits
 * under the home indicator. */
export function PrimaryActionBar({
  label,
  onPress,
  disabled,
  loading,
  secondaryLabel,
  onSecondaryPress,
}: PrimaryActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      className="px-4 pt-3 bg-bg border-t border-border-subtle gap-2"
    >
      <Button label={label} onPress={onPress} disabled={disabled} loading={loading} size="large" fullWidth />
      {secondaryLabel ? (
        <Button label={secondaryLabel} onPress={onSecondaryPress ?? (() => {})} variant="ghost" fullWidth />
      ) : null}
    </View>
  );
}
