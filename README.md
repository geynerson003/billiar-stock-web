# Billiard Stock Web

Version web de Billiard Stock construida con React + Firebase.

## Stack

- React + TypeScript + Vite
- Firebase Auth
- Cloud Firestore
- Sin backend adicional: Firebase sigue siendo el backend principal

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`

## Configuración Firebase

1. Copia `.env.example` a `.env`.
2. Si ya tienes una app web registrada en Firebase, reemplaza los valores por la configuración oficial web.
3. La estructura de datos es compatible con el proyecto Android:
   - `users/{uid}`
   - `businesses/{uid}`
   - subcolecciones `products`, `sales`, `clients`, `tables`, `table_sessions`, `games`, `expenses`, `payments`

## Módulos incluidos

- Autenticación
- Dashboard
- Inventario
- Ventas
- Clientes y pagos de deuda
- Mesas y partidas
- Gastos
- Reportes
