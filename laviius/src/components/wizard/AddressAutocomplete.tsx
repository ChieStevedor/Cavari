"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { AddressValue } from "@/types/shipment";
import { TextField } from "@/components/ui/TextField";
import { loadGoogleMapsScript, parsePlace } from "@/lib/shipment/googleMaps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface AddressAutocompleteProps {
  label: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  error?: string;
  name: string;
}

/**
 * Wraps a plain text input with Google Places Autocomplete when an API key
 * is configured. Without a key (e.g. local development) it degrades to a
 * manual address line — the City / Region / Postal fields below always work
 * either way, so the form is never blocked on Maps being reachable.
 */
export function AddressAutocomplete({ label, value, onChange, error, name }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestionsReady, setSuggestionsReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !inputRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          fields: ["formatted_address", "address_components", "geometry", "place_id"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) onChange(parsePlace(place));
        });
        setSuggestionsReady(true);
      })
      .catch(() => {
        // No network access to Maps, or an invalid key — manual entry still works.
      });

    return () => {
      cancelled = true;
    };
  }, [onChange]);

  return (
    <div className="flex flex-col gap-4">
      <TextField
        ref={inputRef}
        label={label}
        name={`${name}.formatted`}
        value={value.formatted}
        onChange={(e) => onChange({ ...value, formatted: e.target.value, line1: e.target.value })}
        placeholder="Start typing a street address…"
        leadingIcon={<MapPin className="h-4 w-4" />}
        error={error}
        hint={suggestionsReady ? "Suggestions powered by Google Places" : undefined}
        autoComplete="off"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          label="City"
          name={`${name}.city`}
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          required
        />
        <TextField
          label="Province / State"
          name={`${name}.region`}
          value={value.region}
          onChange={(e) => onChange({ ...value, region: e.target.value })}
          required
        />
        <TextField
          label="Postal Code"
          name={`${name}.postalCode`}
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          required
        />
      </div>
    </div>
  );
}
