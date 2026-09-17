"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasSessionHint } from "@/lib/api";
import { getDashboardRoute } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

const subscribe = () => () => {};

const getSnapshot = () => hasSessionHint();

const getServerSnapshot = () => false;

export function AuthenticatedRedirect() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const mayHaveSession = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (initialized && user) {
      router.replace(getDashboardRoute());
    }
  }, [initialized, user, router]);

  if (user || (mayHaveSession && !initialized)) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-cloud">
        <Spinner />
      </div>
    );
  }

  return null;
}
