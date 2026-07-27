// Minimal ambient shape for the slice of the Google Maps JS API (Places
// library) this file uses. The `@types/google.maps` package isn't part of
// this project's dependencies, so we declare just what we touch.
interface GoogleAutocompletePrediction {
  formatted_address?: string;
  address_components?: { long_name: string; short_name: string; types: string[] }[];
  geometry?: { location?: { lat: () => number; lng: () => number } };
  place_id?: string;
}

interface GoogleAutocomplete {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => GoogleAutocompletePrediction;
}

interface GoogleMapsNamespace {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: Record<string, unknown>,
      ) => GoogleAutocomplete;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __laviiusGoogleMapsCallback?: () => void;
  }
}

export type { GoogleAutocomplete, GoogleAutocompletePrediction };

let loadPromise: Promise<void> | null = null;

/** Loads the Google Maps JS API (Places library) exactly once. */
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window.__laviiusGoogleMapsCallback = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__laviiusGoogleMapsCallback`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function parsePlace(place: GoogleAutocompletePrediction) {
  const components = place.address_components ?? [];
  const get = (type: string, useShort = false) => {
    const match = components.find((c) => c.types.includes(type));
    return match ? (useShort ? match.short_name : match.long_name) : "";
  };

  const streetNumber = get("street_number");
  const route = get("route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ");
  const city = get("locality") || get("postal_town") || get("sublocality");
  const region = get("administrative_area_level_1", true);
  const postalCode = get("postal_code");
  const country = get("country", true);
  const location = place.geometry?.location;

  return {
    formatted: place.formatted_address ?? line1,
    line1: line1 || place.formatted_address || "",
    city,
    region,
    postalCode,
    country,
    placeId: place.place_id,
    lat: location?.lat(),
    lng: location?.lng(),
  };
}
