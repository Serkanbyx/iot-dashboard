# IoT Sensor Dashboard — Step-by-Step Build Guide

> **Archived: original build playbook.**
> This document is the original step-by-step roadmap used to build the IoT Sensor Dashboard from scratch.
> The codebase may have evolved since this guide was written — new features, refactors, and fixes may not be reflected here.
> See [../README.md](../README.md) for current setup, architecture, and deployment notes.

---

> **Project Summary:**
> A real-time IoT sensor monitoring dashboard that ingests telemetry data via MQTT protocol, stores time-series measurements in PostgreSQL, and displays live metrics with historical trends. The system includes a sensor simulator (no physical hardware required), threshold-based alerting with email notifications via Nodemailer, real-time dashboard updates via Socket.io, and interactive Recharts visualizations. Features JWT-based auth (admin/viewer roles), configurable alert thresholds per sensor type, and a hierarchical MQTT topic structure. Single PostgreSQL database handles both application data (via Prisma ORM) and time-series sensor data (via raw SQL with proper indexing and `date_trunc()` aggregation).

> Each step below is a self-contained prompt. Execute them in order.
> Stack: React 19 + Vite + TypeScript, Node.js + Express 5 + TypeScript, PostgreSQL (Neon free tier), Prisma ORM, Eclipse Mosquitto (MQTT broker via Docker), mqtt.js, Socket.io, Recharts, TailwindCSS v4, Nodemailer.
> Deploy: Render free tier (backend) + Neon free tier (PostgreSQL) + Vercel free tier (frontend) + HiveMQ Cloud free tier (MQTT broker).
> All services use **permanent free tiers** — no credit card required, no expiration.

> **Free Tier Services:**
> | Service | Provider | Free Tier Details |
> |---|---|---|
> | PostgreSQL | Neon | 0.5GB storage, always free, no expiry |
> | Backend Hosting | Render | Free web service, spins down after 15min inactivity |
> | Frontend Hosting | Vercel | Hobby plan, unlimited deploys |
> | MQTT Broker (prod) | HiveMQ Cloud | 100 connections, 10GB traffic/month |
> | MQTT Broker (dev) | Docker Mosquitto | Local, free |
> | Email | Gmail SMTP | Free with App Password |

> **UI/UX Design Philosophy:**
> The dashboard follows a modern "data observatory" aesthetic — dark-first design with vibrant accent colors for data visualization, glassmorphism cards, smooth animations, and real-time pulse effects. Every interaction provides immediate visual feedback. The design prioritizes data density without sacrificing readability.

---

## Table of Contents

**PHASE 1 — Backend Foundation**
- STEP 1 — Project Scaffolding & Dependency Setup
- STEP 2 — Docker Mosquitto & MQTT Topic Architecture
- STEP 3 — Environment Configuration & Database Setup
- STEP 4 — Prisma Schema & Sensor Readings Table
- STEP 5 — User Auth System & Admin Seed
- STEP 6 — Sensor Simulator
- STEP 7 — MQTT Consumer & PostgreSQL Writer
- STEP 8 — Alert Model, Threshold Config & Seed Data
- STEP 9 — Alert Engine & Email Service
- STEP 10 — REST API: Sensor Data Endpoints
- STEP 11 — REST API: Alert Endpoints
- STEP 12 — Backend Validation Rules
- STEP 13 — Security Audit & Backend Review

**PHASE 2 — Client Foundation**
- STEP 14 — Client Setup: Vite, TailwindCSS & Theme System
- STEP 15 — Axios Instance, Service Files & Shared Types
- STEP 16 — Contexts & Custom Hooks
- STEP 17 — Main Layout & Responsive Shell
- STEP 18 — Navbar: Connection Status, Alerts & User Menu
- STEP 19 — Sidebar: Navigation & Active States
- STEP 20 — App Routing & Route Guards

**PHASE 3 — Pages**
- STEP 21 — Login Page
- STEP 22 — Dashboard Page: Layout & Data Flow
- STEP 23 — Sensor Card Component
- STEP 24 — Sensor Sparkline
- STEP 25 — Sensor Full Chart (Expanded View)
- STEP 26 — Sensor Grid & Real-Time Integration
- STEP 27 — Alert Toast Component
- STEP 28 — Historical Page: Filters & Date Range
- STEP 29 — Historical Chart & Stats Summary
- STEP 30 — Alerts Page: Stats & Filter Bar
- STEP 31 — Alert List & Acknowledge Flow
- STEP 32 — Settings Page: Threshold Cards
- STEP 33 — Range Visualizer & System Status
- STEP 34 — Reusable UI Components
- STEP 35 — Loading Skeletons & Micro-Interactions
- STEP 36 — Dark/Light Mode Polish & Responsive Audit
- STEP 37 — 404 Page & Error Boundaries

**PHASE 4 — Finalization**
- STEP 38 — README & Documentation
- STEP 39 — Code Cleanup, Pre-Deploy Review & Deployment

---

## Global Build Rules (apply to EVERY step)

- **Do not** run any `git` commands. Version control is handled manually by the developer.
- **Do not** install packages or dependencies unless the step explicitly requires them.
- **Do not** run long-running processes (dev servers, simulators) unless the step specifically requests it.
- Treat every step as self-contained — read only the current step's instructions before implementing.
- All code must pass `tsc --noEmit` after each step.
- Use English for all code identifiers, filenames, and technical terms.

---

## Architecture at a Glance

```mermaid
flowchart LR
    SIM["Sensor Simulator<br/>(mqtt.js)"] -->|MQTT publish| BROKER["MQTT Broker<br/>(Mosquitto / HiveMQ)"]
    BROKER -->|MQTT subscribe| CONSUMER["MQTT Consumer<br/>(Node.js)"]
    CONSUMER --> DB[("PostgreSQL<br/>(Neon)")]
    CONSUMER --> ALERT["Alert Engine"]
    ALERT --> DB
    ALERT -->|critical| EMAIL["Nodemailer<br/>(Gmail SMTP)"]
    ALERT -->|socket.io| CLIENT["React Dashboard<br/>(Vite + TailwindCSS)"]
    CONSUMER -->|socket.io| CLIENT
    CLIENT -->|REST API| API["Express 5 API<br/>(Prisma ORM)"]
    API --> DB
```

---

# PHASE 1 — Backend Foundation

---

## STEP 1 — Project Scaffolding & Dependency Setup

### Folder Structure

```
iot-dashboard/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── mqtt.ts
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── sensorController.ts
│   │   │   ├── alertController.ts
│   │   │   └── thresholdController.ts
│   │   ├── middlewares/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── sanitize.ts
│   │   │   └── validate.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── sensorRoutes.ts
│   │   │   ├── alertRoutes.ts
│   │   │   └── thresholdRoutes.ts
│   │   ├── services/
│   │   │   ├── mqttConsumer.ts
│   │   │   ├── alertEngine.ts
│   │   │   ├── emailService.ts
│   │   │   └── socketService.ts
│   │   ├── simulator/
│   │   │   └── sensorSimulator.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── sensor.ts
│   │   │   ├── alert.ts
│   │   │   └── socket.ts
│   │   ├── utils/
│   │   │   ├── generateToken.ts
│   │   │   ├── helpers.ts
│   │   │   └── constants.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   ├── nodemon.json
│   └── package.json
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.ts
│   │   │   ├── authService.ts
│   │   │   ├── sensorService.ts
│   │   │   ├── alertService.ts
│   │   │   └── thresholdService.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── SensorCard.tsx
│   │   │   │   ├── SensorSparkline.tsx
│   │   │   │   ├── SensorChart.tsx
│   │   │   │   ├── SensorGrid.tsx
│   │   │   │   ├── FloorTabs.tsx
│   │   │   │   ├── LiveIndicator.tsx
│   │   │   │   └── AlertSummaryBar.tsx
│   │   │   ├── historical/
│   │   │   │   ├── HistoricalChart.tsx
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   ├── StatsSummary.tsx
│   │   │   │   └── FilterBar.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── AlertBadge.tsx
│   │   │   │   ├── AlertList.tsx
│   │   │   │   ├── AlertItem.tsx
│   │   │   │   ├── AlertToast.tsx
│   │   │   │   └── AlertStats.tsx
│   │   │   ├── settings/
│   │   │   │   ├── ThresholdCard.tsx
│   │   │   │   ├── RangeVisualizer.tsx
│   │   │   │   └── SystemStatus.tsx
│   │   │   └── ui/
│   │   │       ├── Spinner.tsx
│   │   │       ├── StatusDot.tsx
│   │   │       ├── GlassCard.tsx
│   │   │       ├── AnimatedNumber.tsx
│   │   │       ├── ConfirmModal.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Toggle.tsx
│   │   │       └── Pagination.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useAnimatedValue.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── HistoricalPage.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── guards/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── AdminRoute.tsx
│   │   │   └── GuestOnlyRoute.tsx
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── sensor.ts
│   │   │   ├── alert.ts
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── constants.ts
│   │   │   └── cn.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker/
│   ├── mosquitto/
│   │   └── mosquitto.conf
│   └── docker-compose.yml
├── .gitignore
├── .env.example
└── README.md
```

### Server Dependencies

**Production:**
- `express` (v5) — web framework
- `@prisma/client` — Prisma database client
- `mqtt` — MQTT client (mqtt.js)
- `socket.io` — real-time WebSocket server
- `jsonwebtoken` — JWT authentication
- `bcryptjs` — password hashing
- `nodemailer` — email sending
- `helmet` — security headers
- `cors` — cross-origin resource sharing
- `express-rate-limit` — rate limiting
- `express-validator` — input validation
- `express-mongo-sanitize` — input sanitization
- `dotenv` — environment variables

**Development:**
- `typescript` — TypeScript compiler
- `tsx` — fast TypeScript execution
- `nodemon` — auto-restart
- `prisma` — Prisma CLI
- `@types/express`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/cors`, `@types/nodemailer`

### Client Dependencies

**Production:**
- `react`, `react-dom` (v19) — UI library
- `react-router-dom` (v7) — routing
- `axios` — HTTP client
- `socket.io-client` — WebSocket client
- `recharts` — charting
- `react-hot-toast` — toast notifications
- `date-fns` — date utilities
- `lucide-react` — icons
- `clsx` — conditional class names
- `framer-motion` — animations and transitions

**Development:**
- `typescript`, `@vitejs/plugin-react`, `tailwindcss` (v4), `@tailwindcss/vite`
- `@types/react`, `@types/react-dom`

### NPM Scripts

**server/package.json:**
- `"dev": "nodemon"` — dev server
- `"build": "tsc"` — compile
- `"start": "node dist/index.js"` — production
- `"seed": "tsx prisma/seed.ts"` — seed DB
- `"simulate": "tsx src/simulator/sensorSimulator.ts"` — run simulator
- `"db:migrate": "prisma migrate dev"` — migrations
- `"db:generate": "prisma generate"` — generate client
- `"db:studio": "prisma studio"` — GUI

**server/nodemon.json:**
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "tsx src/index.ts"
}
```

**server/tsconfig.json:**
- `target`: ES2022, `module`: NodeNext, `moduleResolution`: NodeNext
- `outDir`: ./dist, `rootDir`: ./src, `strict`: true
- `esModuleInterop`: true, `skipLibCheck`: true

**client/package.json:**
- `"dev": "vite"` — dev server
- `"build": "tsc -b && vite build"` — production build
- `"preview": "vite preview"` — preview build

### .gitignore

```
node_modules/
dist/
.env
*.log
.DS_Store
```

### Tasks

1. Create all folders as specified in the tree
2. Initialize `server/package.json`, install all server dependencies
3. Create `server/tsconfig.json` and `server/nodemon.json`
4. Initialize client with Vite React-TS template, install additional dependencies
5. Create `.gitignore`

---

## STEP 2 — Docker Mosquitto & MQTT Topic Architecture

### Docker Setup

**docker/mosquitto/mosquitto.conf:**
```
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest stdout
```

**docker/docker-compose.yml:**
```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
    restart: unless-stopped

volumes:
  mosquitto_data:
  mosquitto_log:
```

### MQTT Topic Hierarchy

| Topic Pattern | Example | Description |
|---|---|---|
| `factory/{floorId}/{sensorId}/temperature` | `factory/floor1/sensor01/temperature` | Temperature readings |
| `factory/{floorId}/{sensorId}/humidity` | `factory/floor1/sensor01/humidity` | Humidity readings |
| `factory/{floorId}/{sensorId}/pressure` | `factory/floor2/sensor03/pressure` | Pressure readings |
| `factory/{floorId}/{sensorId}/status` | `factory/floor1/sensor01/status` | Online/offline status |
| `factory/+/+/+` | — | Wildcard subscribe for all |

### MQTT Payload Schema

```json
{
  "sensorId": "sensor01",
  "floor": "floor1",
  "type": "temperature",
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| sensorId | string | yes | Unique sensor identifier |
| floor | string | yes | Floor/location identifier |
| type | string | yes | temperature, humidity, or pressure |
| value | number | yes | Numeric reading |
| unit | string | yes | °C, %, or hPa |
| timestamp | string (ISO 8601) | yes | Reading timestamp |

### Sensor Types

| Type | Unit | Normal Range | Description |
|---|---|---|---|
| temperature | °C | -10 to 60 | Ambient temperature |
| humidity | % | 0 to 100 | Relative humidity |
| pressure | hPa | 900 to 1100 | Atmospheric pressure |

### Tasks

1. Create `docker/mosquitto/mosquitto.conf`
2. Create `docker/docker-compose.yml`
3. Test: `cd docker && docker-compose up -d` then `docker ps`

---

## STEP 3 — Environment Configuration & Database Setup

### server/.env.example

| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/iot_dashboard` | PostgreSQL (Neon in production) |
| `MQTT_BROKER_URL` | `mqtt://localhost:1883` | Local dev; `mqtts://xxx.hivemq.cloud:8883` in prod |
| `MQTT_USERNAME` | `` | HiveMQ Cloud username (empty for local) |
| `MQTT_PASSWORD` | `` | HiveMQ Cloud password (empty for local) |
| `MQTT_TOPIC_ROOT` | `factory` | Root topic |
| `JWT_SECRET` | `min-32-char-secret-here` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | `your-email@gmail.com` | Gmail address |
| `SMTP_PASS` | `your-app-password` | Gmail App Password |
| `ALERT_EMAIL_FROM` | `IoT Dashboard <you@gmail.com>` | Sender |
| `ALERT_EMAIL_TO` | `admin@example.com` | Recipient |

### src/config/env.ts

- Load with `dotenv`, export typed frozen config object
- Interface `EnvConfig` for type safety
- **SECURITY:** Enforce `JWT_SECRET` ≥ 32 chars in production (throw on startup)
- Validate `DATABASE_URL` is present

### src/config/database.ts

- Create Prisma singleton
- `connectDatabase()`: connect Prisma, initialize `sensor_readings` table (raw SQL), create indexes
- `disconnectDatabase()`: graceful shutdown
- `cleanupOldReadings()`: DELETE readings older than 30 days (called on startup + every 24h via setInterval)

### src/config/mqtt.ts

- Typed `MqttConfig` interface
- Connection options: `clientId` (random suffix), `clean: true`, `reconnectPeriod: 5000`
- Include `username`/`password` only if env vars are non-empty
- Auto-detect protocol from URL (`mqtt://` vs `mqtts://`)

### src/index.ts — Entry Point

Middleware order:
1. `helmet()` — security headers
2. `cors({ origin: config.CLIENT_URL, credentials: true })` — strict CORS
3. `express.json({ limit: '10kb' })` — body parser
4. `express.urlencoded({ extended: true, limit: '10kb' })` — form parser
5. Custom sanitize middleware (body + params only, NOT query)
6. Global rate limiter

Then: disable `x-powered-by`, mount routes, error handler, connect DB, start MQTT consumer, listen.

**EXPRESS 5 CRITICAL:** `req.query` is read-only. Never assign to it. Do NOT install `hpp`.

**SECURITY:**
- Helmet, strict CORS, body size 10kb limit, x-powered-by disabled, global rate limiter, sanitize middleware

### Tasks

1. Create `src/config/env.ts` with typed config and production validation
2. Create `src/config/database.ts` with Prisma singleton, sensor table init, cleanup scheduler
3. Create `src/config/mqtt.ts` with auth-aware connection options
4. Create `src/index.ts` entry point with full middleware stack
5. Create `.env` from `.env.example` with local values

---

## STEP 4 — Prisma Schema & Sensor Readings Table

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**User model:**

| Field | Type | Attributes | Description |
|---|---|---|---|
| id | String | @id @default(uuid()) | Primary key |
| name | String | @db.VarChar(50) | Display name |
| email | String | @unique @db.VarChar(255) | Login email |
| password | String | @db.VarChar(255) | bcrypt hash |
| role | Role (enum) | @default(VIEWER) | ADMIN or VIEWER |
| isActive | Boolean | @default(true) | Account active |
| lastLogin | DateTime? | | Last login |
| createdAt | DateTime | @default(now()) | Created |
| updatedAt | DateTime | @updatedAt | Updated |

**ThresholdConfig model:**

| Field | Type | Attributes | Description |
|---|---|---|---|
| id | String | @id @default(uuid()) | Primary key |
| sensorType | SensorType (enum) | @unique | TEMPERATURE, HUMIDITY, PRESSURE |
| minValue | Float | | Warning min |
| maxValue | Float | | Warning max |
| criticalMin | Float | | Critical min (email trigger) |
| criticalMax | Float | | Critical max (email trigger) |
| unit | String | @db.VarChar(10) | Unit label |
| isActive | Boolean | @default(true) | Alerting enabled |
| createdById | String? | | Last modifier |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Alert model:**

| Field | Type | Attributes | Description |
|---|---|---|---|
| id | String | @id @default(uuid()) | Primary key |
| sensorId | String | @db.VarChar(50) | Sensor that triggered |
| floor | String | @db.VarChar(50) | Location |
| sensorType | SensorType | | Measurement type |
| value | Float | | Actual reading |
| threshold | Float | | Threshold violated |
| severity | Severity (enum) | | WARNING or CRITICAL |
| direction | Direction (enum) | | ABOVE or BELOW |
| message | String | @db.VarChar(200) | Description |
| isAcknowledged | Boolean | @default(false) | Admin ack'd |
| acknowledgedById | String? | | Who ack'd |
| acknowledgedAt | DateTime? | | When ack'd |
| emailSent | Boolean | @default(false) | Email sent |
| createdAt | DateTime | @default(now()) | |

**Enums:** `Role` (ADMIN, VIEWER), `SensorType` (TEMPERATURE, HUMIDITY, PRESSURE), `Severity` (WARNING, CRITICAL), `Direction` (ABOVE, BELOW)

**Indexes on Alert:**
- `@@index([createdAt(sort: Desc)])`
- `@@index([sensorId, sensorType, isAcknowledged])`
- `@@index([isAcknowledged, severity])`

### Sensor Readings Table (raw SQL in database.ts)

```sql
CREATE TABLE IF NOT EXISTS sensor_readings (
  time        TIMESTAMPTZ NOT NULL,
  sensor_id   VARCHAR(50) NOT NULL,
  floor       VARCHAR(50) NOT NULL,
  sensor_type VARCHAR(20) NOT NULL,
  value       DOUBLE PRECISION NOT NULL,
  unit        VARCHAR(10) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readings_time ON sensor_readings (time DESC);
CREATE INDEX IF NOT EXISTS idx_readings_sensor ON sensor_readings (sensor_id, sensor_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_readings_floor ON sensor_readings (floor, time DESC);
```

### src/types/sensor.ts

```typescript
export type SensorTypeValue = 'temperature' | 'humidity' | 'pressure';

export interface SensorReading {
  sensorId: string;
  floor: string;
  type: SensorTypeValue;
  value: number;
  unit: string;
  timestamp: string;
}

export interface AggregatedReading {
  bucket: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  readingCount: number;
}

export interface SensorInfo {
  sensorId: string;
  floor: string;
  lastSeen: string;
}
```

### src/types/socket.ts

```typescript
export interface ServerToClientEvents {
  'sensor:data': (data: SensorReading) => void;
  'alert:new': (alert: AlertPayload) => void;
  'alert:acknowledged': (data: { alertId: string; acknowledgedBy: string }) => void;
}

export interface ClientToServerEvents {
  'subscribe:floor': (floor: string) => void;
  'unsubscribe:floor': (floor: string) => void;
}
```

### Tasks

1. Write full `prisma/schema.prisma` with all models and enums
2. Create type files in `src/types/`
3. Implement `initializeSensorTable()` in `database.ts`
4. Run `prisma migrate dev --name init`
5. Verify with `prisma studio`

**SECURITY:**
- Password: bcrypt hash, never returned (Prisma `select`/`omit`)
- Role: not settable via public API
- Sensor readings: periodic cleanup (30 days)
- Proper indexes for query performance

---

## STEP 5 — User Auth System & Admin Seed

### src/utils/generateToken.ts

- `generateToken(userId: string): string` — sign JWT with userId payload

### src/middlewares/auth.ts

**`protect`:** Extract Bearer token → verify → query user (exclude password) → attach `req.user` → 401 if invalid

**`adminOnly`:** Check `req.user.role === 'ADMIN'` → 403 if not

**Type augmentation:**
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string; role: 'ADMIN' | 'VIEWER' };
    }
  }
}
```

### src/middlewares/errorHandler.ts

- 4-param error handler
- Dev: full error + stack. Prod: generic message only
- Prisma errors: P2002 → 409, P2025 → 404, P2003 → 400
- JWT errors: JsonWebTokenError/TokenExpiredError → 401

### src/middlewares/rateLimiter.ts

- `globalLimiter`: 100 req / 15 min
- `authLimiter`: 10 req / 15 min
- `apiLimiter`: 200 req / 15 min

### src/middlewares/sanitize.ts

- Strip `$` and `.` patterns from `req.body` and `req.params` only
- **Do NOT touch `req.query`** (Express 5 read-only)

### src/controllers/authController.ts

| Function | Route | Description |
|---|---|---|
| `register` | POST /api/auth/register | Create user (only name, email, password — NEVER role) |
| `login` | POST /api/auth/login | Auth + update lastLogin + return token |
| `getMe` | GET /api/auth/me | Current user profile |
| `updateProfile` | PATCH /api/auth/profile | Update name/email only |
| `changePassword` | PATCH /api/auth/password | Requires current password |

### src/routes/authRoutes.ts

| Method | Path | Middleware | Controller |
|---|---|---|---|
| POST | `/api/auth/register` | authLimiter, validation | register |
| POST | `/api/auth/login` | authLimiter, validation | login |
| GET | `/api/auth/me` | protect | getMe |
| PATCH | `/api/auth/profile` | protect, validation | updateProfile |
| PATCH | `/api/auth/password` | protect, validation | changePassword |

### prisma/seed.ts

1. Upsert admin: name "Admin", email "admin@iot-dashboard.com", password "admin123" (hashed), role ADMIN
2. Upsert threshold configs (defaults from Step 8)
3. Log results, disconnect

Config in package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }`

### Tasks

1. Create Express Request type augmentation
2. Create `generateToken` utility
3. Create auth middlewares (protect, adminOnly)
4. Create errorHandler with Prisma error mapping
5. Create rate limiters
6. Create sanitize middleware
7. Create auth controller (all functions)
8. Create auth routes
9. Create seed script

**SECURITY:**
- Role never settable via register/updateProfile
- Login: identical error for wrong email/password ("Invalid email or password")
- Password: select:false, never returned, change requires current
- bcrypt 12 rounds, JWT ≥ 32 chars enforced in prod
- Auth rate limit: 10/15min

---

## STEP 6 — Sensor Simulator

### src/simulator/sensorSimulator.ts

Standalone script mimicking 6 IoT sensors across 3 floors.

**Sensors:**

| sensorId | floor | Publishes |
|---|---|---|
| sensor01 | floor1 | temperature, humidity, pressure |
| sensor02 | floor1 | temperature, humidity, pressure |
| sensor03 | floor2 | temperature, humidity, pressure |
| sensor04 | floor2 | temperature, humidity, pressure |
| sensor05 | floor3 | temperature, humidity, pressure |
| sensor06 | floor3 | temperature, humidity, pressure |

**Publish interval:** Every 3 seconds per sensor (18 messages / 3 seconds total)

**Value Generation:**
- `temperature`: base 22°C, range 18–35°C, 5% chance spike to 45–50°C
- `humidity`: base 55%, range 30–80%, 5% chance spike to 92–98%
- `pressure`: base 1013hPa, range 990–1040hPa, 3% chance drop to 940–955hPa

**Typed interfaces:**
```typescript
interface SensorConfig {
  sensorId: string;
  floor: string;
}

interface GeneratorConfig {
  base: number;
  min: number;
  max: number;
  spikeValue: number;
  spikeChance: number;
}
```

**Behavior:**
1. Connect to MQTT broker (with auth if env vars present)
2. On connect: log success, start interval
3. Every 3s: publish 18 readings (6 sensors × 3 types)
4. Topic: `factory/{floor}/{sensorId}/{type}`
5. Graceful shutdown on SIGINT

### Tasks

1. Create `src/simulator/sensorSimulator.ts` with typed config
2. Implement value generation with occasional spikes
3. MQTT connect + publish loop
4. Graceful shutdown handler
5. Test: `npm run simulate` + verify with `mosquitto_sub -t "factory/#"`

---

## STEP 7 — MQTT Consumer & PostgreSQL Writer

### src/services/mqttConsumer.ts

**Function:** `startMqttConsumer(io: Server): void`

**Subscription:** `factory/+/+/+`

**Flow:**
1. Connect to MQTT broker
2. Subscribe to wildcard topic
3. On message: parse topic → extract floor/sensorId/type
4. Parse JSON payload
5. Validate with type guard (`isValidSensorReading`)
6. INSERT into `sensor_readings` via `prisma.$executeRaw`
7. Emit `sensor:data` Socket.io event
8. Pass to alert engine

**Type guard:**
```typescript
function isValidSensorReading(data: unknown): data is SensorReading {
  // validate structure, types, enum values, finite number, ISO timestamp
}
```

**INSERT query:**
```sql
INSERT INTO sensor_readings (time, sensor_id, floor, sensor_type, value, unit)
VALUES ($1, $2, $3, $4, $5, $6)
```

**Error handling:** Invalid JSON/validation → log + skip. DB write fail → log + continue. Never crash.

### Tasks

1. Create `src/services/mqttConsumer.ts`
2. Implement connection, subscription, message parsing
3. Type guard validation
4. PostgreSQL insert via parameterized raw query
5. Socket.io emit for real-time
6. All errors handled gracefully

**SECURITY:**
- Type guard validates all incoming data
- Parameterized SQL prevents injection
- No sensitive config in logs

---

## STEP 8 — Alert Model, Threshold Config & Seed Data

### Default Thresholds

| Type | Min | Max | Critical Min | Critical Max | Unit |
|---|---|---|---|---|---|
| TEMPERATURE | 15 | 35 | 5 | 45 | °C |
| HUMIDITY | 30 | 70 | 20 | 90 | % |
| PRESSURE | 980 | 1040 | 960 | 1060 | hPa |

### src/controllers/thresholdController.ts

| Function | Route | Middleware | Description |
|---|---|---|---|
| `getAllThresholds` | GET /api/thresholds | protect | Get all configs |
| `updateThreshold` | PATCH /api/thresholds/:sensorType | protect, adminOnly, validation | Update values |

**updateThreshold:** Validate sensorType enum, destructure only `{ minValue, maxValue, criticalMin, criticalMax, isActive }`, enforce `criticalMin < minValue < maxValue < criticalMax`, call `alertEngine.refreshCache()` after update.

### src/routes/thresholdRoutes.ts

| Method | Path | Middleware | Controller |
|---|---|---|---|
| GET | `/api/thresholds` | protect | getAllThresholds |
| PATCH | `/api/thresholds/:sensorType` | protect, adminOnly, validation | updateThreshold |

### Tasks

1. Add threshold seed data to `prisma/seed.ts` (upsert 3 configs)
2. Create threshold controller
3. Create threshold routes
4. Run `npm run seed`

**SECURITY:** Admin-only updates, enum validation, logical ordering enforced, mass assignment protection

---

## STEP 9 — Alert Engine & Email Service

### src/services/socketService.ts

- `initSocket(httpServer): Server` — typed Socket.io with CORS
- `getIO(): Server` — global accessor
- On connect: join `'dashboard'` room, log
- On disconnect: log

### src/services/emailService.ts

- `sendAlertEmail(alert: AlertEmailPayload): Promise<void>`
- Nodemailer transporter (lazy init)
- HTML email with alert details
- Subject: `"[CRITICAL] IoT Alert: {type} on {sensorId}"`
- **Rate limit:** Max 1 email per sensor per 5 minutes (in-memory Map cooldown)

### src/services/alertEngine.ts

- `processReading(reading: SensorReading, io: Server): Promise<void>`
- `refreshCache(): void`

**Flow:**
1. Load thresholds from cache (Map, refreshed every 60s)
2. Check if alerting active for type
3. Evaluate: `value > criticalMax` or `< criticalMin` → CRITICAL; `> max` or `< min` → WARNING; else return
4. Determine direction (ABOVE/BELOW)
5. Generate message
6. **Dedup:** Query for unack'd alert with same sensor+type in last 60s → skip if exists
7. Create Alert via Prisma
8. Emit `alert:new` via Socket.io
9. If CRITICAL: send email, mark `emailSent: true`

### Socket Events

| Event | Direction | Payload | Trigger |
|---|---|---|---|
| `sensor:data` | Server → Client | `SensorReading` | Every reading |
| `alert:new` | Server → Client | `Alert` | New alert |
| `alert:acknowledged` | Server → Client | `{ alertId, acknowledgedBy }` | Admin ack |

### Tasks

1. Create socketService with typed Socket.io
2. Create emailService with rate limiting
3. Create alertEngine with caching, dedup, alert creation
4. Integrate alertEngine into mqttConsumer
5. Initialize Socket.io in index.ts

**SECURITY:** Email creds never logged, rate limited (1/5min/sensor), dedup prevents DB flooding, Socket.io CORS restricted

---

## STEP 10 — REST API: Sensor Data Endpoints

### src/controllers/sensorController.ts

| Function | Route | Description |
|---|---|---|
| `getLatestReadings` | GET /api/sensors/latest | Latest per sensor+type |
| `getSensorHistory` | GET /api/sensors/history | Raw history within range |
| `getAggregatedData` | GET /api/sensors/aggregated | date_trunc averages |
| `getSensorList` | GET /api/sensors/list | Known sensors |
| `getFloorOverview` | GET /api/sensors/floors | Latest by floor |

**Queries:**

```sql
-- getLatestReadings
SELECT DISTINCT ON (sensor_id, sensor_type)
  time, sensor_id, floor, sensor_type, value, unit
FROM sensor_readings
WHERE time > NOW() - INTERVAL '5 minutes'
ORDER BY sensor_id, sensor_type, time DESC;

-- getAggregatedData (standard PostgreSQL)
SELECT
  date_trunc($1, time) AS bucket,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  COUNT(*) AS reading_count
FROM sensor_readings
WHERE sensor_id = $2 AND sensor_type = $3
  AND time >= $4::timestamptz AND time <= $5::timestamptz
GROUP BY bucket ORDER BY bucket ASC;

-- getSensorList
SELECT DISTINCT sensor_id, floor, MAX(time) AS last_seen
FROM sensor_readings
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY sensor_id, floor ORDER BY floor, sensor_id;
```

**Query params for history/aggregated:** sensorId (required), type (enum), start (ISO, default -1h), stop (ISO, default now), window (minute/hour for aggregated)

### src/routes/sensorRoutes.ts

| Method | Path | Middleware | Controller |
|---|---|---|---|
| GET | `/api/sensors/latest` | protect, apiLimiter | getLatestReadings |
| GET | `/api/sensors/history` | protect, apiLimiter, validation | getSensorHistory |
| GET | `/api/sensors/aggregated` | protect, apiLimiter, validation | getAggregatedData |
| GET | `/api/sensors/list` | protect | getSensorList |
| GET | `/api/sensors/floors` | protect | getFloorOverview |

### Tasks

1. Create sensor controller with all 5 functions
2. Implement `date_trunc` queries
3. Create sensor routes
4. Add express-validator rules

**SECURITY:** All require auth, API rate limiter, max 7-day range, parameterized SQL, enum validation

---

## STEP 11 — REST API: Alert Endpoints

### src/controllers/alertController.ts

| Function | Route | Description |
|---|---|---|
| `getAlerts` | GET /api/alerts | Paginated with filters |
| `getAlertStats` | GET /api/alerts/stats | Aggregated stats |
| `acknowledgeAlert` | PATCH /api/alerts/:id/acknowledge | Mark ack'd |
| `acknowledgeAll` | PATCH /api/alerts/acknowledge-all | Ack all |
| `deleteOldAlerts` | DELETE /api/alerts/cleanup | Delete old (admin) |

**Filters for getAlerts:** page (default 1), limit (1-100, default 20), severity, sensorType, isAcknowledged, sensorId, sort (whitelist)

**getAlertStats response:**
```typescript
{ total, unacknowledged, bySeverity: { WARNING, CRITICAL }, byType: { TEMPERATURE, HUMIDITY, PRESSURE }, last24h }
```

**acknowledgeAlert:** Update with `isAcknowledged: true`, `acknowledgedById`, `acknowledgedAt`. Emit `alert:acknowledged` Socket.io event.

### src/routes/alertRoutes.ts

| Method | Path | Middleware | Controller |
|---|---|---|---|
| GET | `/api/alerts` | protect, apiLimiter, validation | getAlerts |
| GET | `/api/alerts/stats` | protect | getAlertStats |
| PATCH | `/api/alerts/:id/acknowledge` | protect, adminOnly | acknowledgeAlert |
| PATCH | `/api/alerts/acknowledge-all` | protect, adminOnly | acknowledgeAll |
| DELETE | `/api/alerts/cleanup` | protect, adminOnly, validation | deleteOldAlerts |

### Tasks

1. Create alert controller (all 5 functions)
2. Implement dynamic Prisma where clause building
3. Implement groupBy stats
4. Create alert routes
5. Emit Socket.io on acknowledge

**SECURITY:** Admin-only for ack/delete, pagination clamped to 100, sort whitelist, days param 1-365

---

## STEP 12 — Backend Validation Rules

### Validators (one file per resource)

**Auth:** register (name 2-50 trim escape, email isEmail normalize, password min 6), login (email, password notEmpty), updateProfile (optional name/email), changePassword (currentPassword notEmpty, newPassword min 6)

**Threshold:** updateThreshold (minValue/maxValue/criticalMin/criticalMax isFloat, isActive optional boolean, custom: criticalMin < min < max < criticalMax)

**Sensor:** history/aggregated (sensorId notEmpty max 50, type isIn enum, start/stop optional isISO8601, window optional isIn minute/hour)

**Alert:** getAlerts (page optional int min 1, limit optional int 1-100, severity/sensorType/isAcknowledged optional isIn, sort optional whitelist), cleanup (days int 1-365)

### src/middlewares/validate.ts

```typescript
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map(e => ({ field: e.type === 'field' ? e.path : '', message: e.msg })) });
    return;
  }
  next();
};
```

### Tasks

1. Create validator files for each resource
2. Create centralized validate middleware
3. Apply to all routes
4. Test validation errors return proper format

---

## STEP 13 — Security Audit & Backend Review

### Comprehensive Security Checklist

- [ ] Mass assignment: every controller destructures only allowed fields
- [ ] Role: not settable via any public API
- [ ] User enumeration: identical login errors
- [ ] Password: hashed, select:false, never returned, change requires current
- [ ] JWT: ≥ 32 chars in production
- [ ] Rate limiters: auth (10/15min), global (100/15min), API (200/15min)
- [ ] Helmet enabled
- [ ] CORS: strict origin, never `*` in production
- [ ] Body size: 10kb limit
- [ ] Sanitize: strips patterns from body/params via custom middleware
- [ ] Express 5: no req.query assignment, no hpp
- [ ] XSS: escape() on text inputs
- [ ] SQL injection: all queries parameterized
- [ ] Pagination: limit ≤ 100, page positive integer
- [ ] Sort whitelist
- [ ] Time range: max 7 days
- [ ] MQTT validation: type guard on all payloads
- [ ] Socket.io CORS restricted
- [ ] Email rate limited (1/sensor/5min)
- [ ] Alert dedup (60s window)
- [ ] x-powered-by disabled
- [ ] .env.example synced, no secrets
- [ ] No console.log with sensitive data
- [ ] Error handler: no stack traces in production
- [ ] TypeScript strict mode enabled

### Tasks

1. Review all controllers against mass assignment
2. Verify all raw SQL uses parameterized queries
3. Test error handler in production mode
4. Verify all routes have proper middleware chains
5. Run `tsc --noEmit` — zero errors

---

# PHASE 2 — Client Foundation

---

## STEP 14 — Client Setup: Vite, TailwindCSS & Theme System

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
});
```

### index.css — Design System

The dashboard uses a **dark-first "data observatory" theme** with vibrant data colors:

```css
@import "tailwindcss";

@theme {
  /* Dark base palette */
  --color-bg-primary: #0a0e1a;
  --color-bg-secondary: #111827;
  --color-bg-card: #1a2035;
  --color-bg-card-hover: #1f2847;
  --color-bg-elevated: #242f4a;

  /* Light mode overrides */
  --color-bg-primary-light: #f8fafc;
  --color-bg-secondary-light: #ffffff;
  --color-bg-card-light: #ffffff;
  --color-bg-elevated-light: #f1f5f9;

  /* Accent colors for data visualization */
  --color-accent-blue: #3b82f6;
  --color-accent-cyan: #06b6d4;
  --color-accent-emerald: #10b981;
  --color-accent-amber: #f59e0b;
  --color-accent-rose: #f43f5e;
  --color-accent-violet: #8b5cf6;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #06b6d4;

  /* Text */
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-text-primary-light: #0f172a;
  --color-text-secondary-light: #475569;

  /* Borders */
  --color-border: #1e293b;
  --color-border-light: #e2e8f0;

  /* Glassmorphism */
  --color-glass: rgba(255, 255, 255, 0.03);
  --color-glass-border: rgba(255, 255, 255, 0.08);
  --color-glass-light: rgba(0, 0, 0, 0.02);
  --color-glass-border-light: rgba(0, 0, 0, 0.06);

  /* Sensor-specific colors */
  --color-sensor-temperature: #f43f5e;
  --color-sensor-humidity: #06b6d4;
  --color-sensor-pressure: #8b5cf6;

  /* Glow effects */
  --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.15);
  --shadow-glow-emerald: 0 0 20px rgba(16, 185, 129, 0.15);
  --shadow-glow-rose: 0 0 20px rgba(244, 63, 94, 0.15);
  --shadow-glow-amber: 0 0 20px rgba(245, 158, 11, 0.15);
}

@layer base {
  body {
    @apply bg-bg-primary text-text-primary antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .light body {
    @apply bg-bg-primary-light text-text-primary-light;
  }
}

@layer utilities {
  .glass {
    background: var(--color-glass);
    border: 1px solid var(--color-glass-border);
    backdrop-filter: blur(12px);
  }

  .light .glass {
    background: var(--color-glass-light);
    border: 1px solid var(--color-glass-border-light);
  }

  .glow-blue { box-shadow: var(--shadow-glow-blue); }
  .glow-emerald { box-shadow: var(--shadow-glow-emerald); }
  .glow-rose { box-shadow: var(--shadow-glow-rose); }
  .glow-amber { box-shadow: var(--shadow-glow-amber); }

  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
}
```

### src/utils/cn.ts

Utility for merging class names (like shadcn/ui pattern):
```typescript
import { clsx, type ClassValue } from 'clsx';
export function cn(...inputs: ClassValue[]) { return clsx(inputs); }
```

### Tasks

1. Create `vite.config.ts` with plugins and proxy
2. Create `index.css` with full dark-first design system, glassmorphism, glow effects, animations
3. Create `src/utils/cn.ts` helper
4. Import Inter font in `index.html` (Google Fonts CDN)
5. Verify Tailwind classes work with `npm run dev`

---

## STEP 15 — Axios Instance, Service Files & Shared Types

### src/api/axios.ts

- baseURL: `'/api'` (dev proxy) or `import.meta.env.VITE_API_URL + '/api'` (prod)
- timeout: 15000ms
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401 → clear token, redirect to `/login`

### Service Files

**authService.ts:** login, register, getMe, updateProfile, changePassword
**sensorService.ts:** getLatestReadings, getSensorHistory, getAggregatedData, getSensorList, getFloorOverview
**alertService.ts:** getAlerts, getAlertStats, acknowledgeAlert, acknowledgeAll, deleteOldAlerts
**thresholdService.ts:** getAllThresholds, updateThreshold

All fully typed with request/response interfaces.

### Client Types (src/types/)

**auth.ts:**
```typescript
export interface User {
  id: string; name: string; email: string; role: 'ADMIN' | 'VIEWER';
  isActive: boolean; lastLogin: string | null; createdAt: string;
}
export interface AuthResponse { success: boolean; data: { user: User; token: string } }
```

**sensor.ts:**
```typescript
export interface SensorReading {
  sensorId: string; floor: string; type: 'temperature' | 'humidity' | 'pressure';
  value: number; unit: string; timestamp: string;
}
export interface AggregatedReading { bucket: string; avgValue: number; minValue: number; maxValue: number; readingCount: number; }
export interface SensorInfo { sensorId: string; floor: string; lastSeen: string; }
```

**alert.ts:**
```typescript
export interface Alert {
  id: string; sensorId: string; floor: string;
  sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'PRESSURE';
  value: number; threshold: number; severity: 'WARNING' | 'CRITICAL';
  direction: 'ABOVE' | 'BELOW'; message: string;
  isAcknowledged: boolean; acknowledgedById: string | null;
  acknowledgedAt: string | null; emailSent: boolean; createdAt: string;
}
export interface AlertStats { total: number; unacknowledged: number; bySeverity: Record<string, number>; byType: Record<string, number>; last24h: number; }
export interface ThresholdConfig { id: string; sensorType: string; minValue: number; maxValue: number; criticalMin: number; criticalMax: number; unit: string; isActive: boolean; }
```

### Tasks

1. Create typed Axios instance with interceptors
2. Create all 4 service files (fully typed)
3. Create client type definition files
4. Verify types match server response shapes

---

## STEP 16 — Contexts & Custom Hooks

### src/contexts/AuthContext.tsx

- State: `user: User | null`, `token: string | null`, `loading: boolean`
- On mount: check localStorage for token → `getMe()` to validate
- `login(email, password)` → API call → store token → set user
- `register(name, email, password)` → same flow
- `logout()` → clear everything
- `isAdmin: boolean` computed

### src/contexts/SocketContext.tsx

- Create Socket.io client (typed with ServerToClientEvents)
- Connect only when token exists
- Disconnect on logout
- Provide: `{ socket, isConnected }`

### src/contexts/ThemeContext.tsx

- State: `'dark' | 'light' | 'system'`
- Apply class on `<html>` (add/remove `'light'` class — dark is default)
- Listen to `prefers-color-scheme` for system mode
- Persist to localStorage

### Custom Hooks

**useSocket.ts:** `function useSocket<T>(event: string, callback: (data: T) => void): void` — subscribe on mount, unsub on unmount

**useDebounce.ts:** `function useDebounce<T>(value: T, delay?: number): T`

**useLocalStorage.ts:** `function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void]`

**useAnimatedValue.ts:** Custom hook that smoothly animates from old number to new number using requestAnimationFrame — used for sensor value transitions

### Tasks

1. Create AuthContext with full auth flow
2. Create SocketContext with conditional connection
3. Create ThemeContext (dark default, light option)
4. Create all 4 custom hooks
5. Verify hooks are properly typed

---

## STEP 17 — Main Layout & Responsive Shell

### src/components/layout/MainLayout.tsx

**Structure:**
```
┌─────────────────────────────────────────────┐
│                   Navbar                     │
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │        <Outlet />                 │
│          │        (scrollable)               │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

- Sidebar: fixed left, 72px collapsed / 240px expanded (xl+)
- Main content: `ml-[72px]` (or ml-0 on mobile), `mt-[64px]` (navbar height), overflow-y-auto, full height
- Mobile: no sidebar visible, bottom navigation or hamburger
- Smooth transition on sidebar expand/collapse (width animation)
- Background: subtle gradient mesh pattern (CSS radial gradients) on the main area

**Background Pattern (behind content):**
```css
/* Subtle dot grid pattern */
background-image: radial-gradient(circle, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
background-size: 24px 24px;
```

### Tasks

1. Create MainLayout with sidebar + navbar + outlet
2. Implement responsive behavior (sidebar collapse states)
3. Add subtle background pattern
4. Verify smooth transitions
5. Mobile: content takes full width

---

## STEP 18 — Navbar: Connection Status, Alerts & User Menu

### src/components/layout/Navbar.tsx

Fixed top bar, h-16, glassmorphism background, z-50.

**Left section:**
- Hamburger button (mobile only) to toggle sidebar
- App logo: animated pulse dot (green when connected) + "IoT Dashboard" text
- The dot is a `<LiveIndicator />` component with CSS glow animation

**Center section:**
- Connection status pill: glassmorphism rounded-full badge
  - Connected: green dot + "Live" text + subtle green glow
  - Reconnecting: amber dot + "Reconnecting..." + pulse animation
  - Offline: red dot + "Offline" + no glow

**Right section:**
- **Alert bell:** lucide Bell icon with animated badge (unacknowledged count)
  - Badge: absolute positioned, bg-danger, text-xs, rounded-full, min-w-5
  - Shake animation on new alert arrival (CSS @keyframes)
  - Click: navigate to /alerts
- **Theme toggle:** Sun/Moon icon with smooth rotation transition on toggle
- **User menu dropdown:** click user avatar/name → dropdown with:
  - User name + role badge (ADMIN: violet, VIEWER: blue)
  - "Logout" button with LogOut icon
  - Dropdown: glassmorphism card with subtle border

### src/components/dashboard/LiveIndicator.tsx

Small animated dot indicating real-time connection:
- 8px circle with solid color
- Outer ring: 16px, same color at 30% opacity, pulsing scale animation (1 → 1.5 → 1)
- Props: `{ status: 'online' | 'offline' | 'warning' }`

### Tasks

1. Create Navbar with three sections
2. Create LiveIndicator animated component
3. Implement alert badge with shake animation
4. Implement theme toggle with rotation
5. Implement user dropdown (glassmorphism)
6. Mobile hamburger toggle

---

## STEP 19 — Sidebar: Navigation & Active States

### src/components/layout/Sidebar.tsx

**Props:** `{ isOpen: boolean; onClose: () => void }`

**Design:**
- Background: `bg-bg-secondary` with subtle glass border on right edge
- Width: 72px (collapsed) / 240px (expanded on hover or xl+ screens)
- Transition: width 300ms ease

**Nav Items:**

| Label | Icon | Path | Access |
|---|---|---|---|
| Dashboard | LayoutDashboard | `/` | All |
| Historical | TrendingUp | `/historical` | All |
| Alerts | Bell | `/alerts` | All |
| Settings | Sliders | `/settings` | Admin |

**Each nav item:**
- Icon (24px) + label text (hidden when collapsed, visible when expanded)
- Hover: `bg-bg-card-hover` with subtle left border accent
- Active: left border 3px accent-blue + icon/text turns accent-blue + subtle glow background
- Tooltip on hover when collapsed (shows label)
- Transition on all color changes (150ms)

**Bottom section:**
- Collapse toggle button (ChevronLeft/ChevronRight icon)
- Version text: "v1.0.0" (only when expanded)

**Mobile:**
- Full-screen overlay (bg-black/50 backdrop)
- Sidebar slides in from left (framer-motion animate)
- Click backdrop to close

### src/components/layout/MobileNav.tsx

Bottom navigation bar (visible only on mobile < 768px):
- Fixed bottom, h-16, glassmorphism background
- 4 icons equally spaced (same nav items minus Settings if not admin)
- Active icon: accent color with subtle dot below
- Hidden when keyboard is open (detect with visualViewport API)

### Tasks

1. Create Sidebar with collapse/expand states
2. Implement nav items with active state indicators
3. Add tooltip on hover when collapsed
4. Create MobileNav bottom bar
5. Mobile overlay behavior with framer-motion

---

## STEP 20 — App Routing & Route Guards

### src/App.tsx

```typescript
<Routes>
  <Route element={<GuestOnlyRoute />}>
    <Route path="/login" element={<LoginPage />} />
  </Route>
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/historical" element={<HistoricalPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route element={<AdminRoute />}>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Guards

**ProtectedRoute:** loading → fullscreen Spinner; no user → Navigate to /login; else → Outlet
**AdminRoute:** not admin → Navigate to / + toast; else → Outlet
**GuestOnlyRoute:** user exists → Navigate to /; else → Outlet

### src/main.tsx

Provider order: BrowserRouter → ThemeProvider → AuthProvider → SocketProvider → `<Toaster />` → App

### Tasks

1. Create App.tsx with all routes
2. Create ProtectedRoute, AdminRoute, GuestOnlyRoute
3. Create main.tsx with provider hierarchy
4. Configure react-hot-toast (position: top-right, dark theme styling)

---

# PHASE 3 — Pages

---

## STEP 21 — Login Page

### src/pages/LoginPage.tsx

**Design: "Command Center Entry"**

Full viewport, dark background with animated elements:

**Background:**
- Dark base (`bg-bg-primary`)
- Animated gradient orbs: 2-3 large blurred circles (accent-blue, accent-violet, accent-cyan) slowly floating (CSS animation, 20s duration, infinite)
- Subtle grid pattern overlay (low opacity)

**Login Card (center):**
- Max-w-sm, glassmorphism card with subtle border glow
- Top: animated IoT icon (Activity from lucide) with pulse ring effect + "IoT Dashboard" heading
- Subtitle: "Sensor Monitoring Command Center"

**Form fields:**
| Field | Type | Placeholder | Icon |
|---|---|---|---|
| Email | email | "admin@iot-dashboard.com" | Mail icon (left) |
| Password | password | "Enter your password" | Lock icon (left), eye toggle (right) |

**Input styling:**
- h-12, rounded-xl, bg-bg-elevated, border-glass-border
- Focus: ring-2 ring-accent-blue, border-accent-blue
- Icon inside input (left padded)
- Password visibility toggle (Eye/EyeOff icon)

**Submit button:**
- Full width, h-12, rounded-xl
- Gradient background: accent-blue → accent-violet
- Hover: scale(1.01) + increased shadow
- Loading: spinner inside button, disabled state
- Text: "Access Dashboard"

**Below form:**
- Dev hint (only in dev): "Default: admin@iot-dashboard.com / admin123" in muted text

**Animations (framer-motion):**
- Card: fade in + slide up on mount (opacity 0→1, y: 20→0)
- Input fields: stagger animation (appear one by one with 100ms delay)
- Background orbs: continuous slow float

### Tasks

1. Create LoginPage with animated background
2. Create glassmorphism card with form
3. Implement password visibility toggle
4. Add framer-motion mount animations
5. Connect to AuthContext login
6. Error toast on failure, redirect on success
7. Loading state on submit button

---

## STEP 22 — Dashboard Page: Layout & Data Flow

### src/pages/DashboardPage.tsx

**Page Layout:**
```
┌─────────────────────────────────────────────────┐
│  [AlertSummaryBar - if unack'd alerts exist]    │
├─────────────────────────────────────────────────┤
│  Page Header: "Dashboard"  [LiveIndicator]      │
│  Subtitle: "Real-time sensor monitoring"        │
├─────────────────────────────────────────────────┤
│  [FloorTabs: All | Floor 1 | Floor 2 | Floor 3]│
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Sensor  │  │ Sensor  │  │ Sensor  │        │
│  │ Card    │  │ Card    │  │ Card    │  ...   │
│  └─────────┘  └─────────┘  └─────────┘        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │         │  │         │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────┘
```

**State:**
```typescript
interface DashboardState {
  readings: Map<string, SensorReading>;      // key: sensorId-type
  history: Map<string, SensorReading[]>;     // last 60 per sensor-type
  thresholds: ThresholdConfig[];
  selectedFloor: string;                     // 'all' | 'floor1' | 'floor2' | 'floor3'
  loading: boolean;
  unacknowledgedCount: number;
}
```

**Data flow:**
1. Mount: fetch `getLatestReadings()` + `getAllThresholds()` + `getAlertStats()`
2. Socket `sensor:data` → update readings Map + push to history (cap 60)
3. Socket `alert:new` → increment unacknowledgedCount + show AlertToast
4. Filter cards by selectedFloor

### src/components/dashboard/FloorTabs.tsx

Horizontal tab bar with floor options:
- Design: glassmorphism pill-shaped tabs
- Active tab: filled with accent-blue, white text, subtle glow
- Inactive: transparent, muted text
- Smooth background indicator sliding between tabs (framer-motion layoutId)
- Each tab shows sensor count for that floor

### src/components/dashboard/AlertSummaryBar.tsx

Appears at top when there are unacknowledged alerts:
- Glassmorphism bar with warning/danger color accent
- Left: AlertTriangle icon + "X unacknowledged alerts"
- Right: "View All →" link to /alerts
- Subtle pulse animation on the left icon
- Can be dismissed (localStorage remembers)
- Animate in with slide-down (framer-motion)

### Tasks

1. Create DashboardPage with layout structure
2. Create FloorTabs with sliding indicator animation
3. Create AlertSummaryBar with dismiss behavior
4. Implement Socket.io subscriptions
5. Implement data state management (readings Map, history sliding window)
6. Initial API fetch on mount

---

## STEP 23 — Sensor Card Component

### src/components/dashboard/SensorCard.tsx

**Props:**
```typescript
interface SensorCardProps {
  reading: SensorReading;
  history: SensorReading[];
  threshold?: ThresholdConfig;
  onExpand: () => void;
  isExpanded: boolean;
}
```

**Design: "Glassmorphism Data Card"**

Each card is a rounded-2xl glassmorphism container with dynamic styling based on alert state:

**Card States:**
| State | Border | Glow | Background accent |
|---|---|---|---|
| Normal | glass-border | none | transparent |
| Warning | amber-500/30 | glow-amber | amber-500/5 |
| Critical | rose-500/50 | glow-rose + pulse | rose-500/10 |

**Card Layout (not expanded):**
```
┌───────────────────────────────────┐
│ [TypeIcon]  sensor01 · floor1     │  ← header
│                                   │
│        23.5 °C                    │  ← big value (AnimatedNumber)
│                                   │
│  ▁▂▃▅▃▂▁▂▃▅▇▅▃▂▁▂▃▄▅▃          │  ← sparkline
│                                   │
│  3s ago              [↕ expand]   │  ← footer
└───────────────────────────────────┘
```

**Header:**
- Left: type-specific icon with sensor-type color (Thermometer=rose, Droplets=cyan, Gauge=violet)
- Right: sensorId text + floor badge (small, muted)

**Value Display:**
- Large text: text-4xl font-bold with sensor-type color
- Uses `<AnimatedNumber />` for smooth transitions (old → new value)
- Unit in smaller text beside it
- If in alert state: subtle background pulse behind the number

**Sparkline:**
- Mini chart (last 10 readings) using Recharts tiny AreaChart
- No axes, no labels — just the shape
- Gradient fill matching sensor-type color (10% opacity)
- Stroke: sensor-type color at 60% opacity
- Height: 40px

**Footer:**
- Left: relative timestamp ("3s ago") updated every second
- Right: expand/collapse chevron button
- If alert: small warning/critical badge

**Expanded State:**
- Card height animates taller (framer-motion)
- Shows full SensorChart component below sparkline
- Threshold reference lines visible in chart

### src/components/ui/AnimatedNumber.tsx

**Props:** `{ value: number; decimals?: number; duration?: number; className?: string }`

Custom animated counter:
- Smoothly transitions from previous value to new value
- Uses requestAnimationFrame for 60fps animation
- Duration: 300ms (default)
- Easing: ease-out

### Tasks

1. Create SensorCard with glassmorphism design
2. Create AnimatedNumber component
3. Implement threshold-based dynamic styling (normal/warning/critical)
4. Implement relative timestamp with auto-update
5. Implement expand/collapse animation (framer-motion)
6. Type-specific colors and icons

---

## STEP 24 — Sensor Sparkline

### src/components/dashboard/SensorSparkline.tsx

**Props:**
```typescript
interface SparklineProps {
  data: SensorReading[];
  color: string;        // hex color for the line/gradient
  height?: number;      // default 40
  animate?: boolean;    // new point animation
}
```

**Implementation:**
- Recharts `AreaChart` with `ResponsiveContainer`
- No XAxis, YAxis, CartesianGrid, Legend, or Tooltip
- Single `<Area>` with:
  - `type="monotone"` for smooth curve
  - `stroke={color}` at 60% opacity
  - `fill`: linearGradient from `{color}` at 20% to transparent
  - `strokeWidth: 1.5`
  - `dot: false` (no point markers)
  - `animationDuration: 300`
- Data: last 10 readings mapped to `[{ value }]`
- If less than 2 data points: show flat line at last value

**Color mapping:**
- temperature → `#f43f5e` (rose)
- humidity → `#06b6d4` (cyan)
- pressure → `#8b5cf6` (violet)

### Tasks

1. Create SensorSparkline component
2. Configure minimal Recharts AreaChart (no axes/labels)
3. Implement gradient fill with sensor-type color
4. Verify animation on new data point
5. Handle edge case: < 2 data points

---

## STEP 25 — Sensor Full Chart (Expanded View)

### src/components/dashboard/SensorChart.tsx

**Props:**
```typescript
interface SensorChartProps {
  data: SensorReading[];
  threshold?: ThresholdConfig;
  sensorType: SensorTypeValue;
  height?: number;  // default 200
}
```

**Full interactive chart shown when SensorCard is expanded:**
- Recharts `AreaChart` with `ResponsiveContainer` (100% width, 200px height)
- **XAxis:** time formatted as HH:mm:ss, tick color muted, fontSize 11
- **YAxis:** value, tick color muted, domain auto-padded ±10%
- **CartesianGrid:** strokeDasharray="3 3", very subtle opacity (0.1)
- **Area:** monotone, sensor-type color stroke (2px), gradient fill (15% → 0% opacity)
- **Tooltip:** custom styled glassmorphism card showing value + unit + time
- **Reference Lines (if thresholds):**
  - maxValue: dashed amber-500, label "Max"
  - criticalMax: dashed rose-500, label "Critical"
  - minValue: dashed amber-500 at bottom
  - criticalMin: dashed rose-500 at bottom
  - Each with subtle opacity (0.7)

**Custom Tooltip:**
- Glassmorphism mini card (dark bg, border, backdrop-blur)
- Shows: formatted time, value with unit, status label (Normal/Warning/Critical)
- Status colored appropriately

**Data:** last 60 readings from history prop (sliding window from parent)

### Tasks

1. Create SensorChart with full Recharts config
2. Add threshold reference lines with labels
3. Create custom glassmorphism tooltip
4. Ensure responsive container
5. Smooth animation on new data

---

## STEP 26 — Sensor Grid & Real-Time Integration

### src/components/dashboard/SensorGrid.tsx

**Props:**
```typescript
interface SensorGridProps {
  readings: SensorReading[];
  history: Map<string, SensorReading[]>;
  thresholds: ThresholdConfig[];
  selectedFloor: string;
}
```

**Layout:**
- CSS Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Each item wraps a SensorCard
- Empty state: `<EmptyState />` with Wifi icon and "No sensors detected" message
- Filter by floor before rendering
- Sort: group by sensorId, then by type (temperature → humidity → pressure)

**Expand behavior:**
- Only 1 card expanded at a time (state in parent)
- When card expands: other cards remain in grid, expanded card takes full column width on mobile

**Animation:**
- Cards enter with stagger animation (framer-motion) on initial load
- Each card fades in + slides up with 50ms stagger delay

### Real-Time Integration (in DashboardPage)

**Socket.io event handlers:**
```typescript
useSocket<SensorReading>('sensor:data', (data) => {
  setReadings(prev => new Map(prev).set(`${data.sensorId}-${data.type}`, data));
  setHistory(prev => {
    const key = `${data.sensorId}-${data.type}`;
    const existing = prev.get(key) || [];
    const updated = [...existing, data].slice(-60); // cap at 60
    return new Map(prev).set(key, updated);
  });
});

useSocket<Alert>('alert:new', (alert) => {
  toast.custom((t) => <AlertToast alert={alert} toastId={t.id} />);
  setUnacknowledgedCount(prev => prev + 1);
});
```

### Tasks

1. Create SensorGrid with responsive grid
2. Implement floor filtering
3. Implement single-card expand logic
4. Add stagger animation on mount
5. Wire up Socket.io handlers in DashboardPage
6. Implement sliding window history (max 60)
7. Show EmptyState when no data

---

## STEP 27 — Alert Toast Component

### src/components/alerts/AlertToast.tsx

Custom toast that appears on new alerts (real-time via Socket.io):

**Design:**
- Glassmorphism card with severity-colored left border (4px)
- Critical: rose border + subtle rose background
- Warning: amber border + subtle amber background
- Width: 360px max, rounded-xl

**Layout:**
```
┌─┬────────────────────────────────────┐
│ │ [Icon] Temperature Alert           │
│ │ sensor01 · floor1                  │
│ │ 47.2°C exceeded critical max 45°C │
│ │                          2s ago    │
└─┴────────────────────────────────────┘
```

- Left border strip (4px, severity color)
- Icon: AlertTriangle (warning) or AlertOctagon (critical) with color
- Title: "{Type} Alert" in bold
- Subtitle: sensorId + floor (muted)
- Message: the alert message
- Timestamp: relative
- Click: navigate to /alerts page, dismiss toast
- Auto-dismiss: 6 seconds
- Slide-in from right animation

### Tasks

1. Create AlertToast as custom react-hot-toast renderer
2. Implement severity-based styling
3. Click-to-navigate behavior
4. Auto-dismiss after 6 seconds
5. Slide-in animation

---

## STEP 28 — Historical Page: Filters & Date Range

### src/pages/HistoricalPage.tsx

**Layout:**
```
┌─────────────────────────────────────────┐
│  Page Header: "Historical Data"         │
│  Subtitle: "Explore past sensor data"   │
├─────────────────────────────────────────┤
│  [FilterBar]                            │
├─────────────────────────────────────────┤
│  [HistoricalChart - full width, 400px]  │
├─────────────────────────────────────────┤
│  [StatsSummary - 4 stat cards row]      │
└─────────────────────────────────────────┘
```

**State:**
```typescript
interface HistoricalState {
  sensors: SensorInfo[];
  thresholds: ThresholdConfig[];
  selectedSensor: string;
  selectedType: SensorTypeValue;
  dateRange: { start: string; stop: string };
  window: 'minute' | 'hour';
  data: AggregatedReading[];
  loading: boolean;
}
```

### src/components/historical/FilterBar.tsx

Horizontal bar with glassmorphism background, rounded-xl, p-4:

| Control | Type | Styling |
|---|---|---|
| Sensor | Select dropdown | glassmorphism input, shows "sensor01 (floor1)" |
| Type | Segmented button group | 3 buttons: Temp/Humid/Pressure with active highlight |
| Date Range | DateRangePicker component | Two datetime inputs + quick buttons |
| Window | Segmented group | minute / hour |
| Load | Button | Accent-blue gradient, "Load Data" with Search icon |

**Segmented button design:**
- Glassmorphism container with rounded-lg buttons inside
- Active: bg-accent-blue text-white
- Inactive: transparent, text-muted
- Smooth sliding background indicator (framer-motion layoutId)

### src/components/historical/DateRangePicker.tsx

**Layout:**
- Row of quick-select buttons: "1h", "6h", "24h", "3d", "7d"
- Below: two datetime-local inputs (Start, End)
- Quick button click: sets start/stop relative to now

**Quick buttons:**
- Small pills, glassmorphism
- Active (selected range): accent-blue filled
- Click: set start = now - duration, stop = now

**Validation:** end > start, max 7 days, shown as inline error

### Tasks

1. Create HistoricalPage with layout
2. Create FilterBar with all controls
3. Create DateRangePicker with quick buttons
4. Implement sensor list fetch on mount
5. Implement "Load Data" button → API call
6. Loading state while fetching

---

## STEP 29 — Historical Chart & Stats Summary

### src/components/historical/HistoricalChart.tsx

**Props:** `{ data: AggregatedReading[]; threshold?: ThresholdConfig; sensorType: SensorTypeValue; loading: boolean }`

**Full-width chart (Recharts AreaChart + Brush):**
- ResponsiveContainer: 100% width, 400px height
- XAxis: datetime, formatted by range span (HH:mm for hours, MM/DD for days)
- YAxis: value with unit, domain auto
- Area: monotone, sensor-type color, gradient fill
- Brush: bottom navigator for zoom (Recharts Brush component), height 40px
- Reference lines: threshold values (dashed, colored)
- CartesianGrid: subtle dotted
- Tooltip: custom glassmorphism (date, avg, min, max)
- Loading overlay: semi-transparent bg + centered Spinner

**Empty state:** When no data, show EmptyState with BarChart3 icon and "No data for selected range"

### src/components/historical/StatsSummary.tsx

**Props:** `{ data: AggregatedReading[]; unit: string }`

4 stat cards in a row (grid-cols-2 sm:grid-cols-4):

| Stat | Icon | Color | Value Source |
|---|---|---|---|
| Minimum | ArrowDownCircle | accent-cyan | Math.min of avgValues |
| Maximum | ArrowUpCircle | accent-rose | Math.max of avgValues |
| Average | TrendingUp | accent-emerald | Mean of avgValues |
| Data Points | Database | accent-violet | data.length |

**Each card:**
- Glassmorphism, rounded-xl, p-4
- Icon (colored, 20px) + label (text-xs muted)
- Value: text-2xl font-bold
- Subtle left border in card's accent color

### Tasks

1. Create HistoricalChart with Recharts AreaChart + Brush
2. Create custom tooltip
3. Add threshold reference lines
4. Create StatsSummary with 4 stat cards
5. Implement loading overlay
6. Implement empty state
7. Calculate stats from data array

---

## STEP 30 — Alerts Page: Stats & Filter Bar

### src/pages/AlertsPage.tsx

**Layout:**
```
┌────────────────────────────────────────────┐
│  Header: "Alerts"     [Acknowledge All btn]│
├────────────────────────────────────────────┤
│  [AlertStats - 4 stat badges]              │
├────────────────────────────────────────────┤
│  [FilterBar: severity|type|status|search]  │
├────────────────────────────────────────────┤
│  [AlertList]                               │
├────────────────────────────────────────────┤
│  [Pagination]                              │
└────────────────────────────────────────────┘
```

**State:**
```typescript
interface AlertsState {
  alerts: Alert[];
  stats: AlertStats | null;
  page: number;
  totalPages: number;
  total: number;
  filters: { severity: string; sensorType: string; isAcknowledged: string; sensorId: string; sort: string };
  loading: boolean;
}
```

### src/components/alerts/AlertStats.tsx

**4 stat badges in a row:**

| Label | Value | Color | Pulse |
|---|---|---|---|
| Total | stats.total | slate | no |
| Unacknowledged | stats.unacknowledged | amber | yes if > 0 |
| Critical | bySeverity.CRITICAL | rose | yes if > 0 |
| Last 24h | stats.last24h | cyan | no |

**Design:** Each badge is a glassmorphism pill with colored left dot, number, and label. Pulse animation on non-zero warning/critical badges.

### Filter Bar

- Severity: dropdown (All / Warning / Critical)
- Type: dropdown (All / Temperature / Humidity / Pressure)
- Status: dropdown (All / Unacknowledged / Acknowledged)
- Search: text input with Search icon for sensorId
- Sort: dropdown (Newest / Oldest / Severity)
- All inputs: glassmorphism styled, rounded-lg

**Behavior:** Filter change → reset page to 1 → refetch

### Tasks

1. Create AlertsPage with full layout
2. Create AlertStats badge row
3. Create filter bar with all controls
4. Implement filter state management
5. API fetch on mount and filter change
6. Loading state

---

## STEP 31 — Alert List & Acknowledge Flow

### src/components/alerts/AlertList.tsx & AlertItem.tsx

**AlertList:** Maps alerts to AlertItem components. Shows EmptyState if empty.

**AlertItem design:**
```
┌──┬──────────────────────────────────────────┐
│  │ [SeverityBadge] sensor01 · floor1 · Temp │
│  │ 47.2°C exceeded critical max of 45°C     │
│  │ 2 minutes ago    [✉️] [✓ Acknowledge]    │
└──┴──────────────────────────────────────────┘
```

- Left: 4px severity-colored border (amber/rose)
- Background: subtle severity tint for critical
- Row 1: severity badge + sensor info + type badge
- Row 2: message text
- Row 3: relative time + email icon (if sent) + acknowledge button (admin only)
- Acknowledged items: green checkmark + "Acknowledged by Admin" text, reduced opacity

**Severity Badge:** small pill — WARNING (amber bg, amber text) / CRITICAL (rose bg, rose text, pulse)

**Acknowledge button:** Ghost button, accent-emerald color, "✓ Acknowledge" — click → API call → optimistic update → toast

**Admin actions (header):**
- "Acknowledge All" button: danger variant, requires ConfirmModal
- "Cleanup" button: opens modal with days input, deletes old alerts

### Pagination (src/components/ui/Pagination.tsx)

- Previous / Next buttons
- Page numbers (show first, last, and 2 around current with ellipsis)
- "Page X of Y" center text
- Glassmorphism buttons

### Real-time updates

- Socket `alert:new`: prepend to list if matches filters, update stats
- Socket `alert:acknowledged`: update item in current list

### Tasks

1. Create AlertItem with severity styling
2. Create AlertList with mapping
3. Create Pagination component
4. Implement acknowledge API call + optimistic update
5. Implement "Acknowledge All" with ConfirmModal
6. Implement "Cleanup" with days input modal
7. Socket.io real-time updates
8. Empty state when no alerts

---

## STEP 32 — Settings Page: Threshold Cards

### src/pages/SettingsPage.tsx

**Layout:**
```
┌────────────────────────────────────────┐
│  Header: "Settings" [Admin badge]      │
│  Subtitle: "Alert threshold config"    │
├────────────────────────────────────────┤
│  [ThresholdCard - Temperature]         │
├────────────────────────────────────────┤
│  [ThresholdCard - Humidity]            │
├────────────────────────────────────────┤
│  [ThresholdCard - Pressure]            │
├────────────────────────────────────────┤
│  [SystemStatus panel]                  │
└────────────────────────────────────────┘
```

### src/components/settings/ThresholdCard.tsx

**Props:** `{ config: ThresholdConfig; onSave: (data) => void; saving: boolean }`

**Design:**
```
┌──────────────────────────────────────────────┐
│ [🌡️ Temperature]              [Active ◯━━] │
├──────────────────────────────────────────────┤
│ [RangeVisualizer - colored bar]              │
├──────────────────────────────────────────────┤
│ Critical Min  │  Warning Min                 │
│ [    5    ]   │  [   15    ]                 │
│                                              │
│ Warning Max   │  Critical Max                │
│ [   35    ]   │  [   45    ]                 │
├──────────────────────────────────────────────┤
│                         [💾 Save Changes]    │
└──────────────────────────────────────────────┘
```

- Header: type icon (colored) + type name + active toggle (right side)
- RangeVisualizer: colored bar visualization (see next step)
- Form: 2×2 grid of number inputs with labels
- Save button: accent-blue, shows spinner during save
- Validation: inline errors if criticalMin ≥ min, min ≥ max, max ≥ criticalMax
- Toggle auto-saves isActive (no need to click Save)

### Tasks

1. Create SettingsPage with cards layout
2. Create ThresholdCard with form
3. Implement client-side validation
4. Save button → API call → toast
5. Toggle auto-save for isActive
6. Loading states

---

## STEP 33 — Range Visualizer & System Status

### src/components/settings/RangeVisualizer.tsx

**Props:** `{ criticalMin, minValue, maxValue, criticalMax, unit, currentValue? }`

Visual bar showing threshold zones:

```
[●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●]
 ↑critical   ↑warning    NORMAL    warning↑   critical↑
   min          min                   max        max
```

**Implementation:**
- Horizontal bar, h-3, rounded-full, full width
- Gradient segments:
  - Left critical zone: rose-500 (from criticalMin to minValue)
  - Left warning zone: amber-500 (from minValue edge)
  - Normal zone: emerald-500 (center)
  - Right warning zone: amber-500
  - Right critical zone: rose-500 (from maxValue to criticalMax)
- Small triangle markers at each threshold position
- Labels below: criticalMin, min, max, criticalMax values
- If `currentValue` prop: show a marker dot on the bar at the value's position

### src/components/settings/SystemStatus.tsx

**System info panel:**
- Glassmorphism card, grid of status items
- Items:
  | Label | Value Source | Icon |
  |---|---|---|
  | MQTT Status | Socket connection | Wifi/WifiOff |
  | Active Sensors | Count from latest readings | Cpu |
  | Data Retention | "30 days" (static) | Clock |
  | Uptime | From /api/health | Activity |
- Each item: icon (colored) + label (muted, small) + value (bold)
- Status dot: green if connected, red if not

### Tasks

1. Create RangeVisualizer with gradient bar segments
2. Add threshold markers and labels
3. Create SystemStatus panel
4. Fetch health endpoint for uptime
5. Show connection status from SocketContext

---

## STEP 34 — Reusable UI Components

### src/components/ui/GlassCard.tsx

**Props:** `{ children, className?, padding?, glow? }`

Base glassmorphism card used everywhere:
- Background: glass utility class
- Border: glass-border
- rounded-2xl
- Optional glow variant (adds colored box-shadow)
- Hover: slight border brightness increase (transition)

### src/components/ui/Spinner.tsx

- SVG circle with `animate-spin`
- Props: `{ size?: 'sm' | 'md' | 'lg'; color?: string }`
- Sizes: sm=16, md=24, lg=40

### src/components/ui/StatusDot.tsx

- Props: `{ status: 'online' | 'offline' | 'warning'; pulse?: boolean; size?: 'sm' | 'md' }`
- Colored circle with optional pulse ring animation

### src/components/ui/Badge.tsx

- Props: `{ variant: 'info' | 'success' | 'warning' | 'danger' | 'violet'; children; pulse?: boolean }`
- Small pill badge with colored background/text
- Optional pulse animation

### src/components/ui/Toggle.tsx

- Props: `{ checked: boolean; onChange: (val) => void; disabled?: boolean }`
- iOS-style toggle switch
- Smooth sliding animation (transition-transform)
- Active: accent-blue background

### src/components/ui/ConfirmModal.tsx

- Props: `{ isOpen, onClose, onConfirm, title, message, confirmText?, variant?, loading? }`
- Backdrop: bg-black/60, backdrop-blur-sm
- Card: glassmorphism, centered, max-w-md
- Two buttons: Cancel (ghost) + Confirm (colored by variant)
- Escape key / backdrop click to close
- framer-motion: fade in backdrop, scale up card

### src/components/ui/EmptyState.tsx

- Props: `{ icon: LucideIcon; title: string; description?: string; action?: ReactNode }`
- Centered: icon (48px, muted) + title + description + optional action button

### src/components/ui/Pagination.tsx

(Already described in Step 31)

### Tasks

1. Create GlassCard base component
2. Create Spinner, StatusDot, Badge, Toggle
3. Create ConfirmModal with framer-motion
4. Create EmptyState
5. Verify all components support dark/light mode

---

## STEP 35 — Loading Skeletons & Micro-Interactions

### src/components/ui/Skeleton.tsx

**Props:** `{ className?: string; variant?: 'text' | 'circular' | 'card' }`

Animated placeholder for loading states:
- Base: rounded rectangle with shimmer animation
- Shimmer: CSS gradient moving left-to-right (background-position animation)
- Colors: bg-bg-elevated with lighter streak moving through
- Variants:
  - `text`: h-4 rounded, various widths
  - `circular`: rounded-full, equal w/h
  - `card`: full card shape (rounded-2xl, h-48)

**Skeleton patterns used in pages:**

**DashboardPage loading:** Grid of 6 skeleton SensorCards (show card outline + shimmer rectangles for value, sparkline)

**AlertsPage loading:** 3 skeleton rows (horizontal bars with shimmer)

**HistoricalPage loading:** Skeleton rectangle for chart area + 4 small skeleton stat cards

### Micro-Interactions

**Button hover effects:**
- All primary buttons: `hover:scale-[1.02]` + increased shadow
- Transition: `transition-all duration-150`

**Card hover:**
- SensorCards: `hover:border-accent-blue/20` subtle border glow on hover
- All GlassCards: slight brightness increase on hover

**Page transitions (framer-motion):**
- Each page wraps content in motion.div with:
  - `initial={{ opacity: 0, y: 10 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `transition={{ duration: 0.3 }}`

**Toast animations:**
- Slide in from right
- Fade out on dismiss

**Number changes:**
- AnimatedNumber hook makes sensor values smoothly transition
- Alert badge count: scale bounce on increment

### Tasks

1. Create Skeleton component with shimmer animation
2. Create skeleton patterns for each page
3. Apply page transition animations (framer-motion wrapper)
4. Apply button hover effects globally
5. Apply card hover subtle effects
6. Verify AnimatedNumber works on sensor value updates
7. Alert badge bounce on new alert

---

## STEP 36 — Dark/Light Mode Polish & Responsive Audit

### Dark Mode (default)

Already the default theme. Verify all components:
- GlassCards: proper glass effect in dark (white/3% bg, white/8% border)
- Text hierarchy: text-primary (slate-100) → text-secondary (slate-400) → text-muted (slate-500)
- Charts: dark grid lines, light-colored data
- Inputs: bg-bg-elevated, border-border, focus:ring-accent-blue
- Tooltips: dark glassmorphism
- Dropdowns: dark glassmorphism

### Light Mode

When user toggles to light:
- Body: bg-slate-50
- GlassCards: black/2% bg, black/6% border
- Text: slate-900 → slate-600 → slate-400
- Charts: adjust grid opacity, darker data lines
- Inputs: bg-white, border-slate-200
- Sidebar: bg-white with subtle shadow

### Responsive Breakpoints

| Breakpoint | Sidebar | Grid | Navbar |
|---|---|---|---|
| < 768px (mobile) | Hidden, bottom nav visible | 1 column | Hamburger, no center text |
| 768-1024px (tablet) | Collapsed (72px, icons) | 2 columns | Full |
| > 1024px (desktop) | Expanded (240px) | 3 columns | Full |

**Specific checks:**
- Login card: responsive padding, no horizontal overflow
- SensorCards: stack properly on mobile
- FilterBars: wrap to multiple rows on mobile
- Charts: maintain minimum height, font sizes scale
- Modals: respect mobile safe areas
- DateRangePicker: stack inputs vertically on mobile
- Tables/Lists: horizontal scroll if needed

### Accessibility Basics

- Focus ring visible on all interactive elements (ring-2 ring-accent-blue)
- Sufficient color contrast (WCAG AA)
- aria-labels on icon-only buttons
- Keyboard navigation: Tab through nav items, Enter to activate
- Escape to close modals/dropdowns

### Tasks

1. Audit all components in dark mode (fix any issues)
2. Audit all components in light mode (fix any issues)
3. Test responsive layout on mobile viewport (375px)
4. Test responsive layout on tablet (768px)
5. Add focus ring styles to all interactive elements
6. Add aria-labels to icon buttons
7. Verify chart readability in both themes

---

## STEP 37 — 404 Page & Error Boundaries

### src/pages/NotFoundPage.tsx

**Design: "Lost Signal"**

- Full viewport, centered content
- Background: same animated gradient orbs as login page (consistency)
- Large "404" text: text-9xl font-bold, gradient text (accent-blue → accent-violet)
- Heading: "Signal Lost"
- Description: "The page you're looking for doesn't exist or has been moved."
- Button: "Back to Dashboard" — accent-blue gradient, links to `/`
- Animated element: floating disconnected sensor icon (framer-motion float animation)

### Error Boundary

Create a React error boundary component (`ErrorBoundary.tsx`):
- Catches render errors in children
- Shows fallback UI: "Something went wrong" + "Reload" button
- Logs error to console (dev only)
- Wrap main App routes with ErrorBoundary

### Socket Reconnection States in Navbar

Verify the connection status indicator handles all states smoothly:
- Transition between states with 200ms opacity animation
- Connected → "Live" shows for 2 seconds after reconnection, then just green dot
- Reconnecting → show immediately on disconnect
- Offline → show after 5 seconds of no reconnection

### Tasks

1. Create NotFoundPage with "Lost Signal" design
2. Add animated floating element
3. Create ErrorBoundary component
4. Wrap routes with ErrorBoundary
5. Verify Socket reconnection status transitions

---

# PHASE 4 — Finalization

---

## STEP 38 — README & Documentation

### README.md Structure

1. **Title + Badges:** Node.js, React, TypeScript, PostgreSQL, MQTT, Socket.io badges
2. **Description:** 3-4 sentences
3. **Screenshots:** placeholder links for dashboard, alerts, historical views
4. **Features:** bulleted list
5. **Architecture:**

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────────────┐
│  MQTT Simulator │────▶│  Mosquitto   │────▶│  Node.js Backend       │
│  (mqtt.js)      │     │  (Broker)    │     │  ├─ MQTT Consumer      │
└─────────────────┘     └──────────────┘     │  ├─ Alert Engine       │
                                              │  ├─ REST API           │
                                              │  └─ Socket.io Server   │
                                              └──────────┬─────────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    ▼                    ▼                    ▼
                          ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                          │  PostgreSQL  │    │   Socket.io  │    │  Nodemailer  │
                          │  (Neon)      │    │   (to React) │    │  (Gmail)     │
                          └──────────────┘    └──────┬───────┘    └──────────────┘
                                                     ▼
                                            ┌──────────────────┐
                                            │  React Dashboard │
                                            │  ├─ Live Cards   │
                                            │  ├─ Charts       │
                                            │  ├─ Alerts       │
                                            │  └─ Historical   │
                                            └──────────────────┘
```

6. **MQTT Topic Structure** (table)
7. **Tech Stack:**

| Category | Technology | Hosting |
|---|---|---|
| Backend | Node.js, Express 5, TypeScript | Render (free) |
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4, Framer Motion | Vercel (free) |
| Database | PostgreSQL (standard) | Neon (free) |
| ORM | Prisma | — |
| MQTT | Eclipse Mosquitto (dev), HiveMQ Cloud (prod) | HiveMQ (free) |
| Real-time | Socket.io | — |
| Charts | Recharts | — |
| Email | Nodemailer + Gmail SMTP | Gmail (free) |
| Auth | JWT + bcryptjs | — |

8. **Prerequisites:** Docker, Node.js 20+, PostgreSQL 16+ or Neon account
9. **Getting Started** (full commands)
10. **API Endpoints** (table)
11. **Environment Variables** (table)
12. **Alert System** explanation
13. **Deployment (All Free Tier)** with cost table ($0/month)
14. **Folder Structure**
15. **License:** MIT

### Tasks

1. Create comprehensive README.md
2. Include architecture diagram
3. Include getting-started commands
4. Include API table
5. Include deployment instructions
6. Include $0/month cost table

---

## STEP 39 — Code Cleanup, Pre-Deploy Review & Deployment

### Cleanup Checklist

- [ ] Remove all `console.log` statements
- [ ] Remove unused imports
- [ ] `tsc --noEmit` passes in both server and client
- [ ] All API responses: `{ success, data/message }` format
- [ ] No hardcoded URLs
- [ ] Socket event names match between server and client types
- [ ] Form validations match between client and server
- [ ] Dark and light mode work on all pages
- [ ] Responsive layout works: mobile, tablet, desktop
- [ ] All pages have loading + empty states
- [ ] Full flow test: simulator → broker → consumer → DB → alert → socket → toast

### Deployment (All Free Tier — $0/month)

**1. Neon PostgreSQL (free forever):**
- neon.tech → new project → copy pooled connection string
- No extensions needed

**2. HiveMQ Cloud (free forever):**
- hivemq.com/cloud → free cluster → create credentials
- Connection: `mqtts://cluster.hivemq.cloud:8883`

**3. Render Backend (free tier):**
- render.com → New Web Service → connect GitHub
- Root: `server`, Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- Start: `node dist/index.js`, Instance: Free
- Env vars: DATABASE_URL, MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, JWT_SECRET (32+ chars), CLIENT_URL, SMTP vars
- After deploy: Render Shell → `npx tsx prisma/seed.ts`

**4. Vercel Frontend (free hobby):**
- vercel.com → import repo → root: `client` → preset: Vite
- Env: `VITE_API_URL` = Render URL
- Create `client/vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**5. Post-deploy:**
- Set CLIENT_URL on Render = Vercel URL → redeploy
- Run simulator locally: `npm run simulate` (points to HiveMQ)
- Verify full flow on live site

### Cost Summary

| Service | Cost | Limits |
|---|---|---|
| Neon PostgreSQL | $0 | 0.5GB, 190 compute hrs |
| Render Backend | $0 | 750 hrs/month, cold starts |
| Vercel Frontend | $0 | 100GB bandwidth |
| HiveMQ Cloud | $0 | 100 connections, 10GB traffic |
| Gmail SMTP | $0 | 500 emails/day |
| **Total** | **$0/month** | — |

### Post-Deploy Verification

**Functional:**
- [ ] Login works (cold start ~30s first time)
- [ ] Dashboard shows live data when simulator runs
- [ ] Historical page queries data
- [ ] Alerts appear and can be acknowledged
- [ ] Settings threshold changes work
- [ ] Email sent on critical alert
- [ ] Dark/light toggle works
- [ ] Mobile responsive

**Security:**
- [ ] Rate limiting (429 on rapid requests)
- [ ] CORS blocks other origins
- [ ] No stack traces in errors
- [ ] Helmet headers present
- [ ] SQL injection blocked (parameterized)
- [ ] 401 without token, 403 non-admin on admin routes

### Tasks

1. Run through cleanup checklist
2. Fix any TypeScript errors
3. Set up Neon + HiveMQ Cloud accounts
4. Deploy backend to Render
5. Seed production database
6. Deploy frontend to Vercel
7. Cross-configure URLs (CLIENT_URL ↔ VITE_API_URL)
8. Run simulator against production
9. Verify all checklists pass
