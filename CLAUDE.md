# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

PWA web "Mi Negocio" (antes "Billiard Stock"): gestión operativa de un negocio
(inventario, ventas, clientes/deudas, mesas, gastos, reportes). React + TypeScript
+ Vite, con Firebase Auth y Cloud Firestore como único backend. La estructura de
datos es compatible con una app Android hermana.

**Multi-mercado:** en el registro el usuario elige un **mercado**
(`billiards | bar | restaurant | store`, ver `src/shared/constants/markets.ts`).
El mercado se guarda en `users/{uid}.market` y determina, **solo en presentación**:
terminología (`MarketOption.terms.*`) y qué secciones se muestran
(`MarketOption.features`, hoy solo `tables`). Patrón idéntico al de `country`:
catálogo tipado + resolutor con fallback (`getMarketOption`) + hook `useMarket()`
(deriva de `useAuth().profile.market`). Cuentas sin `market` pasan por un gate de
onboarding (`SelectMarketPage`, montado en `ProtectedRoute`). Cambiar de mercado:
Ajustes (`SettingsPage`) → `updateProfile({ market })`. **No cambia ninguna
colección de datos** — `sales`, `games`, `tables`, etc. mantienen su forma para la
app Android.

## Comandos

```bash
npm install
npm run dev        # Vite dev server en http://localhost:4173
npm run build      # tsc -b (typecheck de todo el proyecto) + vite build
npm run preview    # sirve el build de dist/
```

- **No hay linter ni suite de tests.** Para validar tipos usa `npm run build` o `npx tsc -b`.
- Requiere `.env` en la raíz (copia `.env.example`) con las claves `VITE_FIREBASE_*`.
  Sin ellas, `src/shared/services/firebase/config.ts` inicializa Firebase con valores vacíos y todo falla en runtime.
- Deploy: Vercel (SPA, `vercel.json` reescribe todo a `/index.html`).
- Versionado: `release-please` (`.github/workflows/release.yml`) al hacer push a `main`.
  Usa **Conventional Commits** (`feat:`, `fix:`) para que genere el CHANGELOG y suba versión.
  `__APP_VERSION__` es un global inyectado por Vite desde `package.json`.

## Arquitectura — lo que hay que entender

El repo mezcla **dos patrones** que conviven, y esto es la fuente principal de confusión:

### 1. Clean Architecture por feature (mayormente aspiracional)

`src/features/<feature>/{domain,application,infrastructure,presentation}` con modelos,
interfaces de repositorio, use-cases y services. **Solo `auth` cablea de verdad este
patrón** (`AuthService` inyectado en `src/app/store/context/auth.context.tsx`).
`inventory` tiene todo el andamiaje (`InventoryService`, `InventoryProvider`,
`useInventory`) pero **no lo usa nadie** — `InventoryPage` no consume el contexto, y
`inventory.context.tsx` lee el `userId` de `localStorage` (hack marcado "por ahora"
que nada setea). Los archivos de dominio/use-cases/repositorios de `sales`, `clients`,
`tables`, `expenses`, `dashboard`, `reports` existen pero **están sin usar**.

`ARQUITECTURA.md` describe una estructura antigua (`src/hooks`, `src/lib`, `src/firebase`)
que ya no existe — no te fíes de ese documento para rutas de archivos.

### 2. Patrón pragmático (el que usan casi todas las páginas)

Los componentes de página hacen:

- **Lecturas en tiempo real:** `useLiveCollection(buildRef, deps, mapper)` de
  `src/shared/hooks` — se suscribe a `onSnapshot` de Firestore.
- **Escrituras:** funciones async sueltas de
  `src/shared/services/firebase/business.service.ts` (`addSale`, `deleteSale`,
  `addOrUpdateProduct`, `registerPayment`, `finishTableSession`, ...).
- **Tipos:** `src/shared/types/models.ts` (interfaces `Sale`, `Product`, `Client`,
  `Game`, `TableEntity`, `TableSession`, `Payment`, `Expense`, ...).
- **Lógica de negocio pura:** `src/shared/utils/financial.ts` (deuda, resumen de
  dashboard, construcción de reportes, `prepareGameSales`) y `format.ts` (moneda/fecha, locale es).

**Al editar una página de feature, sigue el patrón pragmático** salvo que estés en `auth`.

### Firestore

- Datos por usuario bajo `businesses/{uid}/{colección}`: `products`, `sales`,
  `clients`, `tables`, `table_sessions`, `games`, `expenses`, `payments`.
- Perfil en `users/{uid}`.
- Los campos vienen débilmente tipados y con legado (ej. `paid` vs `isPaid`,
  Timestamp vs millis). Los mappers de `business.service.ts` (`mapSale`, `mapProduct`,
  `mapClient`, `mapGame`, ...) normalizan esto — **usa siempre un mapper al leer,
  nunca `snapshot.data()` crudo**.
- Ventas, borrado de ventas, pagos y cierre de sesión de mesa se hacen dentro de
  `runTransaction` en `business.service.ts` porque mantienen coherentes el `stock`
  de productos y la deuda del cliente (`deuda` / `deudaOriginal` / `totalPagado`).
  **No escribas documentos de `sales`/`games`/`clients` directamente** — pasa por esas funciones.

## Estructura de carpetas (real)

- `src/app/` — composición: `App.tsx`, `routes/` (rutas + `route-guards.tsx` con
  `ProtectedRoute`/`GuestRoute`), `providers/`, `store/context/` (Auth e Inventory).
- `src/features/<feature>/presentation/pages/` — las páginas reales.
- `src/components/` — **componentes UI compartidos reales** (`common/`, `charts/`, `layout/AppShell.tsx`).
- `src/shared/` — barrels y utilidades: `components/` (solo re-exporta de `src/components/`),
  `hooks/`, `utils/`, `types/`, `services/firebase/`. Importa desde los barrels `src/shared/*`.
- `src/shared/hooks/use-auth.ts` re-exporta `useAuth` de `features/auth` por compatibilidad.

## PWA

`vite-plugin-pwa` con `registerType: "prompt"` y `skipWaiting: false` (actualización
manual, no automática). `src/components/common/ReloadPrompt.tsx` muestra el aviso de
nueva versión y chequea updates cada hora. Navegación con estrategia `NetworkFirst`.

## Gotchas

- `tsconfig.json` tiene `baseUrl: "./src"` pero **no hay path aliases** configurados
  en Vite; los imports son relativos profundos (`../../../../shared/...`).
- Hay artefactos de build versionados en git: `vite.config.js`, `vite.config.d.ts`,
  `*.tsbuildinfo`. La fuente de verdad es `vite.config.ts`.
- `tsc` corre en modo `strict`.
