import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, { CustomerInfo } from "react-native-purchases";

const extra = Constants.expoConfig?.extra ?? {};

/** RevenueCat entitlement identifier gating both paid modules. */
export const PAID_MODULES_ENTITLEMENT = "paid_modules";

let configured = false;

export function configureRevenueCat(appUserId: string): void {
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
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function purchasePaidModulesPackage(): Promise<CustomerInfo> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) {
    throw new Error("No RevenueCat offering configured for paid_modules.");
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
