"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { ROUTES } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigimos cuando ya se intentó restaurar la sesión, para no expulsar
    // al usuario mientras la cookie de refresh todavía se está validando.
    if (initialized && !user) {
      router.replace(ROUTES.public.login);
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-cloud">
        <Image
          src="/logos/LogoCitero.webp"
          alt="Citero"
          width={1401}
          height={467}
          sizes="96px"
          className="h-8 w-auto object-contain"
        />
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
