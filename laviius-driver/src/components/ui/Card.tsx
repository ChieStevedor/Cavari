import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated, className, ...rest }: CardProps) {
  return (
    <View
      className={[
        "rounded-xl border border-border-subtle p-4",
        elevated ? "bg-bg-elevated-2" : "bg-bg-elevated",
        className ?? "",
      ].join(" ")}
      {...rest}
    />
  );
}
