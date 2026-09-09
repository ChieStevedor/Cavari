import type { ModuleId } from "../types/domain";

export type RootStackParamList = {
  AgeGate: undefined;
  Auth: undefined;
  PushPermission: undefined;
  Onboarding: undefined;
  Home: undefined;
  Session: { module: ModuleId };
  Recap: undefined;
  Paywall: { module: ModuleId };
  Settings: undefined;
};
