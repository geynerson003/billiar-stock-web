# 📐 ARQUITECTURA DEL PROYECTO - Billiard Stock Web

## 🎯 Visión General

El proyecto sigue una **arquitectura limpia (Clean Architecture)** dividida en 3 capas principales, operando con **Domain-Driven Design** y **Domain-Reactive Patterns**.

```
┌─────────────────────────────────────────────────────────┐
│           📱 PRESENTACIÓN (React + Vite)                │
│  (Components, Pages, Hooks, Context, UI Layer)          │
├─────────────────────────────────────────────────────────┤
│    🎯 APLICACIÓN (Application Services + Use Cases)     │
│     (Orquestación, Coordinación, Lógica de Negocio)     │
├─────────────────────────────────────────────────────────┤
│  🏢 DOMINIO (Domain Models + Business Rules)            │
│     (Entities, Value Objects, Domain Logic)             │
├─────────────────────────────────────────────────────────┤
│  💾 INFRAESTRUCTURA (Firebase, Repositories, Services)  │
│     (Persistencia, Acceso Datos, Integraciones)         │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura de Carpetas

### `src/features/` - Módulos por Dominio

```
features/
├── auth/                    # Autenticación y Autorización
│   ├── domain/
│   │   └── User             # Entity: Usuario
│   ├── application/
│   │   ├── LoginUseCase
│   │   ├── RegisterUseCase
│   │   └── AuthService
│   ├── infrastructure/
│   │   └── FirebaseAuthRepository
│   └── pages/
│       ├── LoginPage
│       ├── RegisterPage
│       └── ForgotPasswordPage
│
├── inventory/               # Gestión de Inventario
│   ├── domain/
│   │   └── Stock           # Entity: Artículo de Stock
│   ├── application/
│   │   ├── CreateStockItemUseCase
│   │   ├── UpdateStockUseCase
│   │   └── InventoryService
│   ├── infrastructure/
│   │   └── FirebaseInventoryRepository
│   └── pages/
│       └── InventoryPage
│
├── sales/                   # Gestión de Ventas
│   ├── domain/
│   │   ├── Sale             # Aggregate Root
│   │   ├── SaleItem         # Value Object
│   │   └── SalePrice        # Value Object
│   ├── application/
│   │   ├── CreateSaleUseCase
│   │   ├── GetSalesReportUseCase
│   │   └── SalesService
│   ├── infrastructure/
│   │   └── FirebaseSalesRepository
│   └── pages/
│       ├── SalesPage
│       └── ReportsPage
│
├── clients/                 # Gestión de Clientes
│   ├── domain/
│   │   └── Client          # Entity: Cliente
│   ├── application/
│   │   └── ClientService
│   ├── infrastructure/
│   │   └── FirebaseClientRepository
│   └── pages/
│       ├── ClientsPage
│       └── ClientDebtPage
│
├── tables/                  # Gestión de Mesas/Juegos
│   ├── domain/
│   │   └── GameTable       # Entity: Mesa de Juego
│   ├── application/
│   │   └── GameTableService
│   ├── infrastructure/
│   │   └── FirebaseTablesRepository
│   └── pages/
│       ├── TablesPage
│       └── GameRoomPage
│
├── expenses/                # Gestión de Gastos
│   ├── application/
│   │   └── ExpensesService
│   └── pages/
│       └── ExpensesPage
│
├── dashboard/               # Dashboard Principal
│   └── pages/
│       └── DashboardPage
│
└── reports/                 # Reportes
    └── pages/
        └── ReportsPage
```

### `src/components/` - Componentes Compartidos

```
components/
├── common/                  # Componentes Base (Modal, Cards, Headers)
│   ├── Modal.tsx           # ✅ Componente reutilizable
│   ├── PageHeader.tsx      # ✅ Encabezado de página
│   ├── StatCard.tsx        # ✅ Tarjeta de estadísticas
│   └── Panel.tsx           # ✅ Panel contenedor
│
├── charts/                  # Visualizaciones
│   └── BarChart.tsx        # ✅ Gráfico de barras
│
└── layout/
    └── AppShell.tsx        # ✅ Shell principal de la app
```

### `src/hooks/` - Custom Hooks

```
hooks/
├── useAuth.tsx             # ✅ Contexto de autenticación + hook
├── useLiveCollection.ts    # ✅ Escucha cambios en colecciones
├── useLiveDocument.ts      # ✅ Escucha cambios en documentos
└── useInventoryContext.ts  # ✅ Contexto y hook de inventario
```

### `src/firebase/` - Capa de Infraestructura

```
firebase/
├── config.ts               # ✅ Configuración Firebase
└── businessService.ts      # ✅ Servicios de negocio genéricos
```

### `src/lib/` - Utilidades

```
lib/
├── financial.ts            # ✅ Cálculos financieros/monetarios
├── format.ts               # ✅ Formateadores de datos
```

### `src/types/` - Tipos Globales

```
types/
└── models.ts               # ✅ TypeScript interfaces/types para toda la app
```

---

## 🔄 Patrones Implementados

### 1. **Domain Reactive Pattern**
Cada dominio reacciona a cambios en tiempo real usando Firestore listeners:

```typescript
// Hook reusable para escuchar colecciones
const collection$ = useLiveCollection<T>(path, filters);

// Hook para escuchar documentos individuales
const document$ = useLiveDocument<T>(docPath);
```

### 2. **Application Service Pattern**
Servicios que orquestan casos de uso:

```typescript
// Ejemplo: InventoryService
export class InventoryService {
  async createStockItem(data) { /* UseCase */ }
  async updateStock(id, quantity) { /* UseCase */ }
  async getInventory() { /* UseCase */ }
}
```

### 3. **Repository Pattern**
Abstracción de acceso a datos (Firebase):

```typescript
// Interfaz genérica
interface IRepository<T> {
  create(data: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
}

// Implementación en Firebase
class FirebaseInventoryRepository implements IRepository<Stock> { ... }
```

### 4. **Entity & Value Object Pattern**

```typescript
// Entity (Identidad única)
interface Sale {
  id: string;
  clientId: string;
  items: SaleItem[];
  total: number;
  createdAt: Date;
}

// Value Object (Sem identidad, inmutable)
interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface SalePrice {
  subtotal: number;
  tax: number;
  total: number;
}
```

### 5. **Context API + Hooks Pattern**
Gestión de estado global:

```typescript
// Inventario
const [inventoryState, setInventory] = useContext(InventoryContext);

// Autenticación
const { user, login, logout } = useAuth();
```

---

## 📊 Dependencias Entre Módulos

```
┌──────────────────┐
│   Dashboard      │─────────➜ Consumidor de estadísticas
│   & Reports      │
└──────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│    Sales Service (Agregador)         │
│  ├─ Inventario (Stock)               │
│  ├─ Clientes (Información)           │
│  └─ Precios (Cálculos)               │
└──────────────────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐
│Clientes│ │Sales │ │Inventory│ │Expenses│
│Service │ │Repo  │ │Service   │ │Service │
└────────┘ └──────┘ └────────┘ └────────┘
    │         │        │         │
    └─────────┴────────┴─────────┘
         │
    ┌────▼────────────────────┐
    │  Firebase Repository    │
    │  (Persistencia)         │
    └────────────────────────┘
```

---

## 🔐 Flujo de Datos

### Ejemplo: Crear una Venta

```
1. UI (SalesPage)
   └─➜ onClick: handleCreateSale(formData)
        │
2. Application Layer (SalesService)
   └─➜ CreateSaleUseCase.execute(salePriceData)
        │
3. Domain Layer (Sale Entity)
   └─➜ Validar reglas de negocio
        │
4. Infrastructure Layer (FirebaseSalesRepository)
   └─➜ repository.create(sale)
        │
5. Firebase Firestore
   └─➜ Guardar documento
        │
6. Real-time Update (useLiveCollection)
   └─➜ Actualizar UI automáticamente
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| **Frontend** | React 18 | UI Framework |
| **Build** | Vite | Bundler rápido |
| **Lenguaje** | TypeScript | Type Safety |
| **Estado** | Context API + Hooks | State Management |
| **Backend** | Firebase/Firestore | Base de datos |
| **Auth** | Firebase Authentication | Autenticación |
| **Styling** | CSS Modules/Tailwind* | Estilos |
| **Charts** | Chart Library* | Visualización |

*Verificar configuración de Vite y tailwind.config.js

---

## 📝 Convenciones de Código

### Nomenclatura
- **Services**: `*Service.ts` (ej: `SalesService.ts`)
- **Use Cases**: `*UseCase.ts` (ej: `CreateSaleUseCase.ts`)
- **Repositories**: `Firebase*Repository.ts` (ej: `FirebaseSalesRepository.ts`)
- **Entities**: PascalCase (ej: `Sale`, `Client`, `Stock`)
- **Interfaces**: `I*` o `*Interface` (ej: `IRepository`, `IService`)

### Estructura de Archivo
```typescript
// 1. Imports
import { useContext } from 'react';
import { SalesService } from '../services/SalesService';

// 2. Types/Interfaces
interface SaleFormData { ... }

// 3. Component/Function
export function SalesPage() { ... }

// 4. Exports
export default SalesPage;
```

---

## ✅ Estado del Proyecto

- ✅ **130+ módulos** transformados a TypeScript
- ✅ **Clean Architecture** implementada
- ✅ **Repositories** abstrayendo Firebase
- ✅ **Application Services** orquestando lógica
- ✅ **Contexto de Inventario** con sincronización en tiempo real
- ✅ **Build validado** sin errores
- ⏳ **Tests unitarios** (planeado)
- ⏳ **Documentation** (en progreso)

---

## 🚀 Próximos Pasos

1. **Agregar validaciones** en cada entidad del dominio
2. **Crear Unit Tests** por módulo
3. **Implementar Logger** centralizado
4. **Agregar error handling** consistente
5. **Optimizar performance** de queries Firestore
6. **Documentar APIs** con JSDoc

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0
**Autor**: Équipo de Modernización
