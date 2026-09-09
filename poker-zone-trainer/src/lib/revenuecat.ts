import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { MOCK_MODE } from "./mockMode";
import { mockBackend } from "./mock/mockBackend";

const extra = Constants.expoConfig?.extra ?? {};

/** RevenueCat entitlement identifier gating both paid modules. */
export const PAID_MODULES_ENTITLEMENT = "paid_modules";

let configured = false;

// A fake CustomerInfo carrying just the one field hasActiveEntitlement reads. The
// cast is intentional — every consumer of this module only ever reads
// `.entitlements.active[key]`, never the rest of the real (large) CustomerInfo shape.
function buildMockCustomerInfo(active: boolean): CustomerInfo {
  return {
    entitlements: { active: active ? { [PAID_MODULES_ENTITLEMENT]: {} } : {} },
  } as unknown as CustomerInfo;
}

export function configureRevenueCat(appUserId: string): void {
  if (MOCK_MODE) {
    console.warn("[mock-mode] RevenueCat is mocked — 'Subscribe' just flips a local entitlement flag, no real purchase happens.");
    return;
  }

  const apiKey = Platform.select({
    ios: extra.revenueCatIosKey as string,
    android: extra.revenueCatAndroidKey as string,
    default: "",
  });

  if (!apiKey || apiKey.includes("PLACEHOLDER")) {
    console.warn("[revenuecat] API key not configured — subscription checkout is disabled.");
    return;
  }

  if (configured) return;
  Purchases.configure({ apiKey, appUserID: appUserId });
  configured = true;
}

export function hasActiveEntitlement(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[PAID_MODULES_ENTITLEMENT]);
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (MOCK_MODE) return buildMockCustomerInfo(mockBackend.hasEntitlement());
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function purchasePaidModulesPackage(): Promise<CustomerInfo> {
  if (MOCK_MODE) {
    mockBackend.setEntitlement(true);
    return buildMockCustomerInfo(true);
  }

  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) {
    throw new Error("No RevenueCat offering configured for paid_modules.");
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  if (MOCK_MODE) return buildMockCustomerInfo(mockBackend.hasEntitlement());
  return Purchases.restorePurchases();
}
