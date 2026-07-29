import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { DriverProfile } from "@/types/driver";

interface AuthState {
  driver: DriverProfile | null;
  sessionToken: string | null;
  isBiometricEnrolled: boolean;
  isUnlocked: boolean;
  signIn: (driver: DriverProfile, token: string) => void;
  signOut: () => void;
  setBiometricEnrolled: (enrolled: boolean) => void;
  unlock: () => void;
  lock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      driver: null,
      sessionToken: null,
      isBiometricEnrolled: false,
      isUnlocked: false,
      signIn: (driver, token) =>
        set({ driver, sessionToken: token, isUnlocked: true }),
      signOut: () => set({ driver: null, sessionToken: null, isUnlocked: false }),
      setBiometricEnrolled: (enrolled) => set({ isBiometricEnrolled: enrolled }),
      unlock: () => set({ isUnlocked: true }),
      lock: () => set({ isUnlocked: false }),
    }),
    {
      name: "laviius-driver-auth",
      storage: createJSONStorage(() => AsyncStorage),
      // Session token is sensitive; in production this is swapped for
      // expo-secure-store. AsyncStorage is used here for the profile cache
      // only so the app is instantly usable offline after first login.
      partialize: (state) => ({
        driver: state.driver,
        sessionToken: state.sessionToken,
        isBiometricEnrolled: state.isBiometricEnrolled,
      }),
    }
  )
);
