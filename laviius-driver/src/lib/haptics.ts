import * as Haptics from "expo-haptics";

/** Centralizes haptic patterns so the vocabulary stays consistent:
 * a light tap for selection, medium for a committed action, success/warning
 * for outcome feedback (e.g. checklist failure, POD generated). */
export const haptics = {
  select: () => Haptics.selectionAsync(),
  action: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
