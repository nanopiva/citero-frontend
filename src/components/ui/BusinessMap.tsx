"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { GoogleMapView } from "./GoogleMapView";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function BusinessMap({
  latitude,
  longitude,
  className = "h-56 w-full",
}: {
  latitude: number;
  longitude: number;
  className?: string;
}) {
  if (!API_KEY) return null;
  return (
    <APIProvider apiKey={API_KEY}>
      <div className={className}>
        <GoogleMapView
          latitude={latitude}
          longitude={longitude}
          interactive={false}
        />
      </div>
    </APIProvider>
  );
}
