import * as Haptics from "expo-haptics";
import { forwardRef } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "default" | "large";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: "bg-brand", text: "text-white" },
  secondary: { bg: "bg-bg-elevated-2", text: "text-text-primary", border: "border border-border" },
  danger: { bg: "bg-danger", text: "text-white" },
  ghost: { bg: "bg-transparent", text: "text-brand" },
};

/** Every primary action in this app renders through here — guarantees the
 * 52-60pt touch target and haptic feedback the driving-context spec requires. */
export const Button = forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ label, variant = "primary", size = "default", loading, icon, fullWidth, disabled, onPress, ...rest }, ref) => {
    const v = VARIANT_STYLES[variant];
    const height = size === "large" ? "h-touch-lg" : "h-touch";
    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.(e);
        }}
        className={[
          height,
          fullWidth ? "w-full" : "",
          "flex-row items-center justify-center rounded-lg px-6 active:opacity-80",
          v.bg,
          v.border ?? "",
          isDisabled ? "opacity-40" : "",
        ].join(" ")}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? "#4F7CFF" : "#FFFFFF"} />
        ) : (
          <>
            {icon}
            <Text className={["text-[17px] font-semibold", v.text, icon ? "ml-2" : ""].join(" ")}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    );
  }
);
Button.displayName = "Button";
