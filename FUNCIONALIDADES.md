# Funcionalidades de Billiard Stock Web

Documento vivo del alcance funcional de la plataforma. Sirve como línea base
para planear nuevas funciones y llevar un versionado de capacidades.

- **Versión actual:** `1.0.1`
- **Última actualización de este documento:** 2026-08-26
- **Stack:** React 18 + TypeScript + Vite · Firebase Auth · Cloud Firestore · PWA (vite-plugin-pwa)
- **Despliegue:** Vercel (SPA) · Versionado automático con `release-please` + Conventional Commits

> Cómo mantener este archivo: al agregar o cambiar una función, actualiza la
> sección del módulo correspondiente y añade una entrada en
> [Historial de versiones](#historial-de-versiones). Marca lo pendiente en
> [Roadmap / pendientes conocidos](#roadmap--pendientes-conocidos).

---

## Índice

- [1. Autenticación y cuenta](#1-autenticación-y-cuenta)
- [2. Navegación y shell de la app](#2-navegación-y-shell-de-la-app)
- [3. Dashboard / Panel ejecutivo](#3-dashboard--panel-ejecutivo)
- [4. Inventario / Productos](#4-inventario--productos)
- [5. Ventas](#5-ventas)
- [6. Clientes y deudas](#6-clientes-y-deudas)
- [7. Mesas y sesiones](#7-mesas-y-sesiones)
- [8. Partidas (Game Room)](#8-partidas-game-room)
- [9. Gastos](#9-gastos)
- [10. Reportes](#10-reportes)
- [11. PWA e instalación](#11-pwa-e-instalación)
- [12. Lógica de negocio compartida](#12-lógica-de-negocio-compartida)
- [13. Modelo de datos (Firestore)](#13-modelo-de-datos-firestore)
- [Roadmap / pendientes conocidos](#roadmap--pendientes-conocidos)
- [Historial de versiones](#historial-de-versiones)

---

## 1. Autenticación y cuenta

Ruta(s): `/login`, `/register`, `/forgot-password`. Backend: Firebase Auth + `users/{uid}`.

| Función | Descripción | Estado |
|---|---|---|
| Registro de negocio | Alta con nombre de negocio, **tipo de negocio (mercado)**, país, correo y contraseña (con confirmación). Crea el perfil en `users/{uid}`. | ✅ |
| Selección de mercado | En el registro se elige `billiards | bar | restaurant | store`; guardado en `users/{uid}.market`. Adapta terminología y secciones visibles. Editable en Ajustes. | ✅ |
| Onboarding de mercado | Cuentas antiguas sin `market` deben elegirlo al primer ingreso (`SelectMarketPage`, gate en `ProtectedRoute`). | ✅ |
| Inicio de sesión | Email + contraseña. Redirige al dashboard. | ✅ |
| Recuperar contraseña | Envía correo de restablecimiento de Firebase. | ✅ |
| Cerrar sesión | Desde el panel lateral / perfil. | ✅ |
| Sesión persistente | `onAuthStateChanged` mantiene la sesión; pantalla de carga mientras resuelve. | ✅ |
| Perfil en vivo | `watchUserProfile` escucha cambios de `users/{uid}` (nombre del negocio, estado activo). | ✅ |
| Guardas de ruta | `ProtectedRoute` (exige sesión) y `GuestRoute` (redirige si ya hay sesión). | ✅ |
| Mensajes de error localizados | Traducción de códigos de error de Firebase a texto en español. | ✅ |
| Arquitectura Clean | `auth` es el único módulo que cablea de verdad domain/application/infrastructure (use-cases + repositorios inyectados). | ✅ |

## 2. Navegación y shell de la app

Componente: `src/components/layout/AppShell.tsx`.

| Función | Descripción | Estado |
|---|---|---|
| Sidebar de escritorio | Navegación a las 7 secciones, marca de versión `v{__APP_VERSION__}`, datos del negocio y botón de cerrar sesión. | ✅ |
| Header móvil + drawer | Menú hamburguesa con overlay; se cierra al navegar. | ✅ |
| Bottom navigation (móvil) | Acceso rápido a las 5 secciones principales (Dashboard, Inventario, Ventas, Clientes, Mesas). | ✅ |
| Botón "Obtén la app" | Aparece cuando la PWA es instalable. | ✅ |
| Iconografía SVG inline | Sin dependencias externas de iconos. | ✅ |
| Aviso de nueva versión | `ReloadPrompt` (ver sección PWA). | ✅ |
| Redirección catch-all | Cualquier ruta desconocida → `/`. | ✅ |

## 3. Dashboard / Panel ejecutivo

Ruta: `/`. Página: `DashboardPage`. Datos en vivo de `sales`, `expenses`, `products`, `clients`.

| Función | Descripción | Estado |
|---|---|---|
| Saludo personalizado | Usa el nombre del negocio del perfil. | ✅ |
| Tarjeta "Ingresos netos" | Ingresos de ventas pagadas − gastos. | ✅ |
| Tarjeta "Gastos" | Suma total de gastos. | ✅ |
| Tarjeta "Ganancia neta" | Ganancia de ventas pagadas − gastos. | ✅ |
| Tarjeta "Deuda de clientes" | Deuda agregada (campo `deuda` o fallback por ventas pendientes). | ✅ |
| Pulso financiero (7 días) | Gráfico de barras con utilidad estimada diaria de la última semana. | ✅ |
| Top productos | Ranking de los 5 productos más vendidos (por unidades, considerando canastas). | ✅ |
| Alertas de stock | Productos con `stock <= minStock`. | ✅ |
| Accesos rápidos | Enlaces directos a Inventario, Clientes, Mesas y Gastos. | ✅ |

## 4. Inventario / Productos

Ruta: `/inventory`. Página: `InventoryPage`. Colección: `products`.

| Función | Descripción | Estado |
|---|---|---|
| Listado / catálogo | Tarjetas con stock, precios (proveedor, venta, canasta), unidades por paquete y stock mínimo. | ✅ |
| Búsqueda | Filtro por nombre en vivo. | ✅ |
| Crear producto | Nombre, precio proveedor, precio venta unidad, precio venta canasta (opcional), unidades por paquete, stock mínimo. | ✅ |
| Editar producto | Reutiliza el formulario; conserva el stock existente. | ✅ |
| Reabastecer por paquetes | Se ingresa "cantidad de paquetes a agregar"; el stock resultante = stock previo + (paquetes × unidades por paquete), mostrado en vivo. | ✅ |
| Eliminar producto | Con diálogo de confirmación. | ✅ |
| Métrica rápida en el formulario | Costo por unidad y ganancia por unidad calculados al vuelo. | ✅ |
| Modal "Detalles financieros" | Cálculos por unidad (costo, ganancia, margen %), por paquete/canasta (ganancia, margen %) y valores de inventario (valor a precio proveedor, valor a precio venta, ganancia potencial total). | ✅ |
| Alerta visual de stock bajo | Badge en rojo cuando `stock <= minStock`. | ✅ |

## 5. Ventas

Ruta: `/sales`. Página: `SalesPage`. Colección: `sales` (escritura vía `addSale` / `deleteSale` en transacción).

| Función | Descripción | Estado |
|---|---|---|
| Historial de ventas | Lista ordenada por fecha desc., con cliente, mesa/externa, fecha y estado (Pagada/Pendiente). | ✅ |
| Filtro por periodo | Diario / Semanal / Mensual / Personalizado (rango de fechas). | ✅ |
| Búsqueda | Por nombre de cliente, mesa o producto. | ✅ |
| Registrar venta | Multi-ítem: se agregan líneas producto + cantidad; total calculado. | ✅ |
| Tipo de venta | Externa o Por mesa (exige seleccionar mesa). | ✅ |
| Venta por canasta | Usa el precio de canasta del producto; descuenta `cantidad × unidades por paquete` del stock. | ✅ |
| Asociar cliente | Opcional; "Sin cliente" permitido. | ✅ |
| Estado de pago | Pagada o Pendiente al registrar. | ✅ |
| Descuento de stock atómico | La venta descuenta stock dentro de `runTransaction`. | ✅ |
| Impacto en deuda del cliente | Si es pendiente y tiene cliente: incrementa `deudaOriginal` y recalcula `deuda` (con lógica de reseteo de pagos). | ✅ |
| Ver detalle de venta | Modal de solo lectura con ítems y totales. | ✅ |
| Eliminar venta | Revierte stock y deuda del cliente en transacción; con confirmación. | ✅ |
| Cálculo de ganancia | `calculateProfitForDraftItems` (por unidad o por canasta) guardado en la venta. | ✅ |

## 6. Clientes y deudas

Rutas: `/clients`, `/clients/:clientId`. Páginas: `ClientsPage`, `ClientDebtPage`. Colecciones: `clients`, `payments`, `sales`.

| Función | Descripción | Estado |
|---|---|---|
| Listado de clientes | Tarjetas con nombre, teléfono y badge "Con deuda / Sin deuda". | ✅ |
| Búsqueda | Por nombre o teléfono. | ✅ |
| Crear / editar cliente | Nombre y teléfono. Al editar se preservan `deuda`, `deudaOriginal`, `totalPagado`. | ✅ |
| Eliminar cliente | Con confirmación. | ✅ |
| Deuda calculada | `deuda` del documento o fallback sumando ventas pendientes del cliente. | ✅ |
| Detalle de deuda | 3 tarjetas: deuda restante, total pagado, nº de ventas pendientes. | ✅ |
| Registrar pago | Monto (validado contra deuda restante), descripción y notas. Crea documento en `payments`. | ✅ |
| Aplicación de pagos a ventas | Marca ventas como pagadas de forma acumulativa; si se liquida todo, resetea contadores y marca todas las pendientes. | ✅ |
| Ventas pendientes | Lista con mesa/externa, fecha y monto. | ✅ |
| Historial de pagos | Lista ordenada por fecha desc. con descripción y monto. | ✅ |

## 7. Mesas y sesiones

Ruta: `/tables`. Página: `TablesPage`. Colecciones: `tables`, `table_sessions`, `games`.

| Función | Descripción | Estado |
|---|---|---|
| Listado de mesas | Tarjetas con imagen de mesa, precio por partida y estado. | ✅ |
| Estado de mesa | "En partida" / "Mesa disponible" (sesión abierta) / "No disponible". | ✅ |
| Crear / editar mesa | Nombre y precio por partida. | ✅ |
| Eliminar mesa | Con confirmación. | ✅ |
| Iniciar sesión | Crea `table_sessions` y setea `currentSessionId` en la mesa; navega a la sala de partida. | ✅ |
| Abrir partida | Entra a la sala de la sesión activa. | ✅ |
| Cerrar sesión (desde edición) | Limpia `currentSessionId` de la mesa manualmente. | ✅ |

## 8. Partidas (Game Room)

Ruta: `/tables/:tableId/:sessionId`. Página: `GameRoomPage`. Colección: `games`.

| Función | Descripción | Estado |
|---|---|---|
| Iniciar partida | Crea un `game` ACTIVO con el precio base de la mesa. | ✅ |
| Resumen de partida | Precio base, total de apuestas y total actual. | ✅ |
| Agregar participantes | Selección múltiple de clientes; evita duplicados. | ✅ |
| Quitar participante | De la partida activa. | ✅ |
| Agregar apuesta | Producto + cantidad; usa precio de venta unitario. | ✅ |
| Quitar apuesta | Por índice. | ✅ |
| Reiniciar ronda | Marca perdedores de la ronda, cierra el `game` actual como FINISHED y abre uno nuevo con los mismos participantes y apuestas. | ✅ |
| Historial de la mesa | Modal con las rondas FINISHED de la sesión, perdedores y total de cada una. | ✅ |
| Finalizar sesión | Cierra todas las rondas, genera las ventas (`prepareGameSales`) repartidas entre perdedores (o participantes), descuenta stock y actualiza deudas en transacción; abre una nueva sesión vacía en la mesa. | ✅ |
| Marcar rondas como pagadas | Toggle al finalizar la sesión. | ✅ |
| Reparto de deuda de partida | El total se divide entre perdedores; si no hay perdedores marcados, entre todos los participantes. | ✅ |

## 9. Gastos

Ruta: `/expenses`. Página: `ExpensesPage`. Colección: `expenses`.

| Función | Descripción | Estado |
|---|---|---|
| Historial de egresos | Lista ordenada por fecha desc. con descripción, categoría, fecha y monto. | ✅ |
| Búsqueda | Por descripción o categoría. | ✅ |
| Crear gasto | Descripción, monto (> 0) y categoría (por defecto "General"). | ✅ |
| Editar gasto | Preserva la fecha original de creación. | ✅ |
| Eliminar gasto | Con confirmación. | ✅ |

## 10. Reportes

Ruta: `/reports`. Página: `ReportsPage`. Lógica: `buildReport`.

| Función | Descripción | Estado |
|---|---|---|
| Filtro por periodo | Diario / Semanal / Mensual / Personalizado. | ✅ |
| KPIs del periodo | Ventas, Gastos, Ganancia, Deuda de clientes. | ✅ |
| Ventas por mesa | Desglose de ingresos por mesa (solo ventas pagadas). | ✅ |
| Ventas por producto | Desglose de ingresos por producto. | ✅ |
| Top productos | Ranking de 5 por unidades vendidas. | ✅ |

## 10bis. Multiusuario y RBAC (dueño / empleados)

Rutas: `/staff-login`, `/employees`, `/employees/:employeeId`. Colecciones nuevas:
`businesses/{ownerUid}/employees`, `businessCodes/{code}`, `empLogins/{lookupId}`.
Reglas en `firestore.rules` (versionadas; deploy manual con `firebase deploy --only firestore:rules`).

| Función | Descripción | Estado |
|---|---|---|
| Roles | `users/{uid}.role`: ausente ⇒ admin/dueño (compat.), `"employee"` ⇒ trabajador. `businessId` efectivo = `ownerUid` del empleado. | ✅ |
| Login de empleado | Código de negocio + nombre de usuario + contraseña. Email sintético determinista (`slug--vN--codigo@emp.minegocio.app`); el `credV` se lee de `empLogins`. Código recordado en `localStorage`. | ✅ |
| Panel de empleados | Alta, activar/desactivar, cambio de contraseña, edición de permisos. Muestra el código del negocio. Solo admin. | ✅ |
| Aprovisionamiento sin backend | Cuentas de Auth creadas con una **instancia secundaria** de Firebase (no cierra la sesión del admin). Reset de contraseña = rotación de `credV` (nueva cuenta Auth, doc-espejo viejo `isActive:false`; el `employeeId` no cambia). | ✅ |
| Permisos | Catálogo `src/shared/constants/permissions.ts`: presets (`Vendedor`, `Encargado`, `Personalizado`) + ajuste fino por permiso. `usePermissions().can()`. | ✅ |
| Enforcement UI | `<PermissionRoute>` por ruta, filtrado de `navItems` en `AppShell`, y ocultado de botones crear/editar/eliminar en cada página. | ✅ |
| Aislamiento de datos | `firestore.rules`: un empleado solo lee/escribe `businesses/{suOwnerUid}/**` y solo si `isActive != false`. Docs sensibles (`employees`, doc del negocio) solo del dueño. | ✅ |
| Métricas por empleado | Ventas y ganancia (`sale.sellerId`), cobros (`payment.registeredBy`), gastos (`expense.createdBy`), fiado pendiente y aporte neto, con rango de fecha. | ✅ |

## 11. PWA e instalación

Config: `vite.config.ts` (`VitePWA`). Componentes: `ReloadPrompt`, hook `usePWAInstall`.

| Función | Descripción | Estado |
|---|---|---|
| Instalable | Manifest completo (nombre, iconos 192/512/maskable, tema, categorías business/productivity). | ✅ |
| Prompt de instalación propio | Botones "Obtén la app" / "Obtener" en el shell y en el login cuando el navegador lo permite. | ✅ |
| Actualización manual | `registerType: "prompt"`, `skipWaiting: false`: el usuario decide cuándo actualizar. | ✅ |
| Aviso de nueva versión | `ReloadPrompt` muestra banner "Nueva versión disponible" con botón Actualizar. | ✅ |
| Chequeo periódico de updates | `r.update()` cada hora. | ✅ |
| Soporte offline | Aviso "Aplicación lista para funcionar sin conexión"; navegación con estrategia `NetworkFirst` (timeout 3 s). | ✅ |
| Limpieza de cachés viejas | `cleanupOutdatedCaches: true`. | ✅ |

## 12. Lógica de negocio compartida

`src/shared/utils/financial.ts` y `format.ts`.

| Utilidad | Descripción |
|---|---|
| `getSaleAmount` | Monto de una venta (total, suma de ítems o precio legado). |
| `calculateSupplierPricePerUnit` | Precio de proveedor por unidad según unidades por paquete. |
| `calculateProfitForDraftItems` | Ganancia de una lista de ítems (unidad o canasta). |
| `getSaleProfit` | Ganancia de una venta (juego, multi-ítem o legado). |
| `calculatePendingDebt` | Deuda pendiente de un cliente: ventas no pagadas, total pagado, restante, `isFullyPaid`. |
| `getDateRange` | Rango de fechas para filtros DAILY/WEEKLY/MONTHLY/CUSTOM. |
| `buildDashboardSummary` | Arma el resumen del dashboard (ingresos, gastos, ganancia, deuda, alertas, top, serie 7 días). |
| `buildReport` | Arma el reporte por periodo (KPIs + desgloses por mesa/producto + top). |
| `calculateGameTotal` | Precio base + apuestas de una partida. |
| `prepareGameSales` | Convierte una partida en ventas repartidas entre perdedores/participantes. |
| `computeSaleLineItem` / `calculateProductMetrics` | Cálculo de línea de venta y métricas de producto (en `business.service.ts`). |
| `formatCurrency` | Formato COP (`es-CO`, sin decimales). |
| `formatDate` / `formatShortDate` / `formatPhone` | Formato de fecha y teléfono (locale `es-CO`). |

## 13. Modelo de datos (Firestore)

Datos por usuario bajo `businesses/{uid}/{colección}`; perfil en `users/{uid}`.

| Colección | Entidad | Notas |
|---|---|---|
| `products` | `Product` | `stock`, `supplierPrice`, `salePrice`, `saleBasketPrice?`, `unitsPerPackage`, `minStock`. |
| `sales` | `Sale` | Multi-ítem (`items[]`) + campos legado (`productId`, `quantity`, `price`). `isPaid`/`paid` duplicados. Escritura solo vía transacción. |
| `clients` | `Client` | `deuda`, `deudaOriginal`, `totalPagado`. Campos en español. |
| `payments` | `Payment` | Método por defecto `CASH`; `isPartialPayment`, `notes`. |
| `expenses` | `Expense` | `date` como string de millis. |
| `tables` | `TableEntity` | `pricePerGame`, `currentSessionId?`. |
| `table_sessions` | `TableSession` | `startTime`, `endTime?`, `sales[]`, `total`. |
| `games` | `Game` | `participants[]`, `bets[]`, `loserIds[]`, `amountPerLoser`, `status` (ACTIVE/FINISHED/CANCELLED). |
| `users/{uid}` | `UserProfile` | `businessName`, `createdAt`, `isActive`, `country` (ISO-3166), `market` (tipo de negocio, opcional en perfiles antiguos). |

Todas las lecturas normalizan datos débilmente tipados con mappers
(`mapSale`, `mapProduct`, `mapClient`, `mapGame`, …). Las lecturas en tiempo
real usan `useLiveCollection` / `useLiveDocument` (`onSnapshot`).

---

## Roadmap / pendientes conocidos

Andamiaje presente en el repo pero **no cableado / sin usar** (oportunidades de
trabajo futuro):

- **Contexto de inventario** (`InventoryProvider`, `useInventory`,
  `InventoryService`): existe pero ninguna página lo consume; `inventory.context.tsx`
  lee `userId` de `localStorage` (hack "por ahora").
- **Clean Architecture en `sales`, `clients`, `tables`, `expenses`, `dashboard`,
  `reports`**: archivos de domain/use-cases/repositorios existen pero sin uso; las
  páginas usan el patrón pragmático.
- `ARQUITECTURA.md` describe una estructura antigua ya inexistente.
- Artefactos de build versionados en git (`vite.config.js`, `*.tsbuildinfo`).
- Sin linter ni suite de tests.

Ideas candidatas (no comprometidas):

- [ ] Exportar reportes (PDF / CSV).
- [ ] Métodos de pago reales en `payments` (hoy siempre `CASH`).
- [ ] Cancelar partida (`status: "CANCELLED"` existe en el modelo, sin UI).
- [ ] Edición de ventas (hoy solo ver / eliminar).
- [ ] Gestión de categorías de gasto (hoy texto libre).
- [x] Multiusuario / roles por negocio — ver sección 10bis.
- [ ] Reset de contraseña de empleado sin acumular cuentas Auth huérfanas (requiere Cloud Function).

---

## Historial de versiones

### [1.0.1] — 2026-04-16
- Correcciones del flujo de releases y definición de `__APP_VERSION__` en la config de Vite.

### [1.0.0] — base
Primera versión con el alcance funcional completo descrito arriba:
autenticación, dashboard, inventario, ventas, clientes/deudas, mesas, partidas,
gastos, reportes y PWA instalable con actualización manual.

### Cambios recientes en `develop` (aún sin publicar en una versión)
- `feat: game history and restart` — historial de rondas y reinicio de partida en la sala.
- `feat: filter in sales page` — filtro por periodo en la página de ventas.
- `feat(pwa): service worker update strategy con Workbox` — estrategia robusta de actualización del SW.

> Al cerrar la próxima versión, mueve estas entradas a su bloque `[x.y.z]`.
