"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe(callback: () => void) {
  const id = window.setInterval(callback, MINUTE_MS);
  return () => window.clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / MINUTE_MS);
}

function getServerSnapshot() {
  return 0;
}

/** Minuto actual como número entero. Se actualiza una vez por minuto. */
export function useCurrentMinute(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
