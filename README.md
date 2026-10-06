# Citero — Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)

Aplicación web de Citero: la landing pública con el flujo de reserva y el panel donde cada
negocio gestiona su agenda, servicios, equipo y clientes.

Demo: [citero.app](https://citero.app) · Backend: [citero-backend](https://github.com/nanopiva/citero-backend)

## Funcionalidades

**Público**
- Landing y páginas legales; reserva guiada por negocio (servicio → profesional → fecha y hora → confirmación).
- Modos de reserva: invitado (modo público) o con verificación por email (OTP) en negocios autenticados.
- Gestión de turno por link firmado: ver detalle y cancelar (como cliente logueado o con email + OTP).

**Cuentas**
- Registro con verificación por email, login, recuperación y reseteo de contraseña.
- Onboarding para crear el primer negocio; perfil con pestañas Cuenta / Seguridad (contraseña + MFA) / Equipo.
- MFA opcional: segundo paso en el login y activación/desactivación con códigos de recuperación.

**Panel**
- Dashboard con métricas y checklist de primeros pasos.
- Agenda por día (filtrable por profesional y estado) y acciones del dueño sobre el turno (completar, ausencia, cancelar).
- Servicios, equipo (con invitación de profesionales), configuración del negocio, horarios y clientes (bloquear/desbloquear).
- Espacios de trabajo: un usuario puede ser dueño de un negocio y staff de otro.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · motion · axios ·
Phosphor Icons · Google Maps · Vercel Analytics.

## Requisitos

- Node.js 20+
- El [backend](https://github.com/nanopiva/citero-backend) corriendo

## Cómo correr

```bash
npm install
cp .env.example .env.local   # completá las variables
npm run dev
```

La app queda en http://localhost:3000.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base de la API (ej. `http://localhost:8080/api`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API key de Google Maps (restringida por dominio) |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Opcional, para mapas avanzados |

Las variables `NEXT_PUBLIC_*` quedan expuestas en el navegador y se aplican en el build.
En producción van en las Environment Variables de Vercel (el `.env.local` no se versiona).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Corre el build de producción |
| `npm run lint` | Linter |
| `npm run typecheck` | Chequeo de tipos (tsc) |
| `npm run audit` | Auditoría de dependencias (high+) |

## Autenticación

El access token se mantiene en memoria y el refresh token viaja en una cookie HttpOnly. Un
interceptor de axios renueva la sesión de forma transparente (single-flight) cuando el
token expira; ante un refresh fallido, limpia la sesión y redirige a `/login`. El negocio
activo se envía en el header `X-Business-ID`.

## Rutas

| Tipo | Rutas |
| --- | --- |
| Públicas | `/`, `/login`, `/registro`, `/recuperar-contrasena`, `/resetear-contrasena`, `/negocio/[slug]`, `/negocio/[slug]/reservar/confirmacion`, `/turnos/gestionar`, `/terminos`, `/privacidad` |
| Con sesión | `/onboarding`, `/dashboard`, `/agenda`, `/mis-turnos`, `/servicios`, `/staff`, `/configuracion`, `/perfil` |

Los guards por rol (`RoleGuard`) se aplican **en el cliente**: `/servicios`, `/staff` y
`/configuracion` son solo para OWNER; `/agenda` para OWNER o STAFF. La seguridad real vive
en el backend.

## Estructura

```
src/
├── app/          # Rutas (App Router): (public) y (auth)
├── components/   # UI, layout, dashboard, booking y landing
├── context/      # Sesión y negocio activo
├── hooks/
├── lib/          # Cliente axios y utilidades
└── types/
```

## Deploy

Pensado para [Vercel](https://vercel.com), conectado a este repositorio de GitHub.
Configurá `NEXT_PUBLIC_API_URL` apuntando al backend (`https://citero-api.fly.dev/api`) y
desplegá. Los headers de seguridad (HSTS, `X-Frame-Options`, CSP, entre otros) se definen
en `next.config.ts`.

**Analytics:** incluye [Vercel Web Analytics](https://vercel.com/docs/analytics)
(`<Analytics />` en `src/app/layout.tsx`). Para activarlo, habilitalo en el dashboard del
proyecto (Project → Analytics). Es gratuito en el plan Hobby y no recolecta datos en local.
