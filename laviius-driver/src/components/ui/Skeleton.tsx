import { useEffect, useRef } from "react";
import { Animated, View, type ViewProps } from "react-native";

export function Skeleton({ className, ...rest }: ViewProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={["bg-bg-elevated-2 rounded-md", className ?? ""].join(" ")}
      {...rest}
    />
  );
}

export function ActionCenterSkeleton() {
  return (
    <View className="rounded-2xl bg-bg-elevated p-5 gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-touch-lg w-full rounded-lg mt-2" />
    </View>
  );
}

export function JobCardSkeleton() {
  return (
    <View className="rounded-xl bg-bg-elevated p-4 gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
    </View>
  );
}
