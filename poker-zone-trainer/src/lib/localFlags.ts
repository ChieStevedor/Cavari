import AsyncStorage from "@react-native-async-storage/async-storage";

// The age-gate checkbox (Compliance: simple 17+ checkbox, no full age-verification
// flow) happens before signup, so there's no user row yet to store it against.
// We persist it on-device and also stamp profiles.age_confirmed once the account
// exists, so re-installs still require re-confirming.
const AGE_GATE_KEY = "poker-zone-trainer/age-gate-confirmed";

export async function getAgeGateConfirmed(): Promise<boolean> {
  const value = await AsyncStorage.getItem(AGE_GATE_KEY);
  return value === "true";
}

export async function setAgeGateConfirmed(): Promise<void> {
  await AsyncStorage.setItem(AGE_GATE_KEY, "true");
}
