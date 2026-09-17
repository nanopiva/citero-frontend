"use client";

import { useEffect } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

function MapController({
  latitude,
  longitude,
  zoom,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: latitude, lng: longitude });
    if (map.getZoom() !== zoom) map.setZoom(zoom);
  }, [map, latitude, longitude, zoom]);
  return null;
}

export function GoogleMapView({
  latitude,
  longitude,
  showMarker = true,
  interactive = true,
  draggable = false,
  zoom = 15,
  onPick,
}: {
  latitude: number;
  longitude: number;
  showMarker?: boolean;
  interactive?: boolean;
  draggable?: boolean;
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
}) {
  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={{ lat: latitude, lng: longitude }}
      defaultZoom={zoom}
      gestureHandling={interactive ? "greedy" : "none"}
      disableDefaultUI={!interactive}
      clickableIcons={false}
      onClick={(e) => {
        if (onPick && e.detail.latLng) {
          onPick(e.detail.latLng.lat, e.detail.latLng.lng);
        }
      }}
      style={{ width: "100%", height: "100%" }}
    >
      {showMarker && (
        <AdvancedMarker
          position={{ lat: latitude, lng: longitude }}
          draggable={draggable}
          onDragEnd={(e) => {
            if (onPick && e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
          }}
        />
      )}
      <MapController latitude={latitude} longitude={longitude} zoom={zoom} />
    </Map>
  );
}
