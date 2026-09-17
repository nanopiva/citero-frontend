# Citero — Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)

Aplicación web de Citero: la landing pública y el panel donde cada negocio gestiona su
agenda, servicios, equipo y clientes.

Demo: [citero.app](https://citero.app) · Backend: [citero-backend](https://github.com/nanopiva/citero-backend)

## Funcionalidades

- Landing pública con el flujo de reserva y páginas legales.
- Registro, login, recuperación y reseteo de contraseña.
- Panel del negocio: agenda, turnos, servicios, equipo, configuración y perfil.
- Invitación de profesionales y registro con vinculación automática al equipo.
- Reserva pública por negocio y gestión de turno con verificación por OTP.
- Vistas según rol (dueño / staff) y onboarding para crear el primer negocio.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · motion · axios ·
Phosphor Icons · Google Maps.

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

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Corre el build de producción |
| `npm run lint` | Linter |

## Autenticación

El access token se mantiene en memoria y el refresh token viaja en una cookie HttpOnly. Un
interceptor de axios renueva la sesión de forma transparente cuando el token expira.

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

Pensado para [Vercel](https://vercel.com). Configurá `NEXT_PUBLIC_API_URL` apuntando al
backend y desplegá el repositorio.
