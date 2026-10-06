import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Origen de la API para connect-src (derivado de NEXT_PUBLIC_API_URL en build time).
let apiOrigin = "";
try {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) apiOrigin = new URL(apiUrl).origin;
} catch {
  apiOrigin = "";
}

const scriptSrc = [
  "'self'",
  // Next App Router emite scripts inline de hidratación/RSC; sin nonce hay que permitirlos.
  "'unsafe-inline'",
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
];
if (isDev) {
  // Webpack en dev usa eval.
  scriptSrc.push("'unsafe-eval'");
}

const connectSrc = [
  "'self'",
  "https://maps.googleapis.com",
  "https://*.googleapis.com",
];
if (apiOrigin) connectSrc.push(apiOrigin);
if (isDev) connectSrc.push("ws:", "wss:");

// Nota: no se usa CSP con nonce porque exigiría renderizado dinámico en TODAS las páginas
// (Next inyecta el nonce durante el SSR); las páginas de esta app se prerenderizan de forma
// estática. Se mantiene 'unsafe-inline' en script-src por los scripts inline de hidratación
// de Next, y se compensa con 'script-src-attr none' (bloquea handlers inline tipo onclick=,
// que React no usa) y con el resto de las directivas restrictivas.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  // Sin handlers inline (onclick=...): React usa event listeners, no atributos.
  "script-src-attr 'none'",
  // Tailwind (inlineCss) y Google Maps inyectan estilos inline.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleapis.com https://*.gstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src ${connectSrc.join(" ")}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];
if (!isDev) {
  contentSecurityPolicy.push("upgrade-insecure-requests");
}

const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
  "clipboard-write=(self)",
].join(", ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy.join("; ") },
  { key: "Permissions-Policy", value: permissionsPolicy },
];

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
