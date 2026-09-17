"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "./Input";
import { Label } from "./Label";
import { GoogleMapView } from "./GoogleMapView";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

export type LocationValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

function LocationPickerInner({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");

  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const selectedRef = useRef<string | null>(value.address || null);
  const reverseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (places && !sessionTokenRef.current) {
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    }
  }, [places]);

  // Autocompletado mientras se escribe (Places API New).
  useEffect(() => {
    const term = query.trim();
    const timeout = setTimeout(async () => {
      if (!places || term.length < 3 || term === selectedRef.current) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: term,
            sessionToken: sessionTokenRef.current ?? undefined,
            includedRegionCodes: ["ar"],
            language: "es",
          });
        setSuggestions(suggestions);
      } catch (err) {
        console.error("Error al buscar direcciones:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, places]);

  useEffect(
    () => () => {
      if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    },
    [],
  );

  const selectSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["formattedAddress", "location", "displayName"],
      });
      const lat = place.location?.lat();
      const lng = place.location?.lng();
      if (lat == null || lng == null) return;

      const label = place.formattedAddress ?? prediction.text?.text ?? "";
      selectedRef.current = label;
      setQuery(label);
      setSuggestions([]);
      setOpen(false);
      if (places) {
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      }
      onChange({ address: label, latitude: lat, longitude: lng });
    } catch (err) {
      console.error("Error al obtener el lugar:", err);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoding) return;
    try {
      const geocoder = new geocoding.Geocoder();
      const { results } = await geocoder.geocode({ location: { lat, lng } });
      const address = results?.[0]?.formatted_address;
      if (address) {
        selectedRef.current = address;
        setQuery(address);
        onChange({ address, latitude: lat, longitude: lng });
      }
    } catch (err) {
      console.error("Error al obtener la dirección:", err);
    }
  };

  const handleMapPick = (lat: number, lng: number) => {
    onChange({ address: value.address, latitude: lat, longitude: lng });
    if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    reverseTimeoutRef.current = setTimeout(() => reverseGeocode(lat, lng), 400);
  };

  const clear = () => {
    selectedRef.current = null;
    setQuery("");
    setSuggestions([]);
    onChange({ address: "", latitude: null, longitude: null });
  };

  const hasCoords = value.latitude != null && value.longitude != null;
  const center = hasCoords
    ? { lat: value.latitude as number, lng: value.longitude as number }
    : DEFAULT_CENTER;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Label hint="Escribí la dirección y elegí una sugerencia. También podés marcar el punto en el mapa.">
          Dirección
        </Label>
        <Input
          className="mt-2"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Ej: Av. Santa Fe 1234, CABA"
          autoComplete="off"
        />

        {open && (loading || suggestions.length > 0) && (
          <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-hairline bg-paper shadow-sm-2">
            {loading && suggestions.length === 0 ? (
              <p className="px-4 py-3 text-body-sm text-slate-gray">
                Buscando…
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-hairline overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  const prediction = suggestion.placePrediction;
                  if (!prediction) return null;
                  return (
                    <li key={`${prediction.placeId}-${index}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-pebble"
                      >
                        <p className="text-body-sm font-medium text-ink-navy">
                          {prediction.mainText?.text}
                        </p>
                        {prediction.secondaryText?.text && (
                          <p className="text-caption text-slate-gray">
                            {prediction.secondaryText.text}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="relative h-64 overflow-hidden rounded-xl border border-hairline">
        <GoogleMapView
          latitude={center.lat}
          longitude={center.lng}
          showMarker={hasCoords}
          interactive
          draggable
          onPick={handleMapPick}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-caption text-slate-gray">
          {hasCoords
            ? `Coordenadas: ${value.latitude?.toFixed(5)}, ${value.longitude?.toFixed(5)}`
            : "Marcá el punto en el mapa o elegí una sugerencia."}
        </span>
        {hasCoords && (
          <button
            type="button"
            onClick={clear}
            className="text-caption font-medium text-signal-blue hover:underline"
          >
            Quitar ubicación
          </button>
        )}
      </div>
    </div>
  );
}

export function LocationPicker(props: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  if (!API_KEY) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-600">
        Falta configurar la variable{" "}
        <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={["places", "geocoding", "marker"]}
    >
      <LocationPickerInner {...props} />
    </APIProvider>
  );
}
