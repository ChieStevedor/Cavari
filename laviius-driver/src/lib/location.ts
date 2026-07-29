import * as Location from "expo-location";

/**
 * Battery-efficient location tracking. Foreground accuracy is high only
 * while a route is active; background tracking uses a coarser distance
 * filter. Never poll continuously when the driver has no active shipment.
 */

export async function requestLocationPermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return false;
  return true;
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export function watchPositionDuringRoute(
  onUpdate: (point: { lat: number; lng: number }) => void
) {
  let subscription: Location.LocationSubscription | null = null;

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 15_000,
      distanceInterval: 50, // meters — avoids draining battery with dense updates
    },
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude })
  ).then((sub) => {
    subscription = sub;
  });

  return () => subscription?.remove();
}

/** Straight-line distance in meters, used for the "left route significantly"
 * dispatcher-notify check (a real routing SDK would replace this with
 * on-route deviation distance). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const ROUTE_DEVIATION_ALERT_METERS = 800;

export function hasDeviatedSignificantly(
  currentPos: { lat: number; lng: number },
  routePoint: { lat: number; lng: number }
): boolean {
  return distanceMeters(currentPos, routePoint) > ROUTE_DEVIATION_ALERT_METERS;
}
