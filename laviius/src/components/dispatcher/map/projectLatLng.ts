// Metro Vancouver bounding box used to project lat/lng onto the schematic
// map's 0-100% coordinate space. This is a stylized operations map, not a
// literal street map — see LiveMap.tsx for why (no map SDK key in this repo
// yet; swap in Mapbox/Google Maps against these same lat/lng fields later).
const BOUNDS = { minLat: 48.98, maxLat: 49.36, minLng: -123.28, maxLng: -122.55 };

export function projectLatLng(lat: number, lng: number): { xPct: number; yPct: number } {
  const xPct = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const yPct = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { xPct: Math.min(97, Math.max(3, xPct)), yPct: Math.min(96, Math.max(4, yPct)) };
}

export function bucketKey(xPct: number, yPct: number, bucketSize = 5): string {
  return `${Math.round(xPct / bucketSize)}:${Math.round(yPct / bucketSize)}`;
}
