import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PRIVATE_ROUTES = [
  "/dashboard",
  "/agenda",
  "/configuracion",
  "/servicios",
  "/staff",
  "/mis-turnos",
  "/onboarding",
  "/perfil",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_ROUTES,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
