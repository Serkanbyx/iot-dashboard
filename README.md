<div align="center">

  <h1>IoT Sensor Dashboard</h1>

  <p><em>A full-stack, real-time IoT sensor monitoring dashboard that ingests telemetry over MQTT, stores time-series readings in PostgreSQL, evaluates threshold-based alerts with email notifications, and visualizes live and historical data through a glassmorphism UI with dark/light mode support.</em></p>

  <p>
    <img src="https://img.shields.io/badge/license-PolyForm%20NC-blue?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express 5" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL Neon" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma 7" />
    <img src="https://img.shields.io/badge/MQTT-HiveMQ-660066?style=flat-square" alt="MQTT" />
    <img src="https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/API-Render-46E3B7?style=flat-square&logo=render&logoColor=white" alt="API on Render" />
    <img src="https://img.shields.io/badge/Web-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Web on Vercel" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs welcome" />
  </p>

  <p>
    <a href="https://iot-dashboard-one-rouge.vercel.app/">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Quick Start</a> •
    <a href="#api-endpoints">API Docs</a> •
    <a href="#screenshots">Screenshots</a>
  </p>

  <a href="https://iot-dashboard-one-rouge.vercel.app/">
    <img src="./assets/screenshots/dashboard-dark.png" alt="IoT Dashboard" />
  </a>

</div>

---

## Features

- **Real-time Monitoring** — Live sensor cards with animated values, sparklines, and expandable Recharts via Socket.io push
- **Multi-floor Dashboard** — Filter sensors by floor with tabbed navigation and auto-updating counts
- **Alert Engine** — Automatic WARNING/CRITICAL detection based on configurable thresholds per sensor type
- **Email Notifications** — Nodemailer + Gmail SMTP sends emails on critical alerts
- **Historical Analytics** — Aggregated charts with minute/hour windows, date range picker, brush zoom, and stats summary
- **Alert Management** — Paginated alert list with severity/type/status filters, single/bulk acknowledge, and cleanup
- **Settings Panel** — Threshold configuration with live range visualizer, toggle monitoring, and system status display
- **Device Management** — Admin panel to register, edit, toggle, and delete IoT devices with MQTT whitelist enforcement
- **Dark/Light Mode** — CSS custom property-based theming with smooth transitions across all pages
- **Responsive Design** — Mobile-first with collapsible sidebar, bottom navigation, and adaptive layouts
- **Glassmorphism UI** — Backdrop blur, subtle borders, glow effects, and Framer Motion layout animations
- **Role-based Access** — JWT authentication with Admin/Viewer roles and route guards (Protected, Admin, Guest)
- **Loading Skeletons** — Page-specific skeleton patterns with shimmer animations
- **Swagger API Docs** — Interactive OpenAPI 3.0 documentation at `/api-docs`

---

## Live Demo

[🚀 View Live Demo](https://iot-dashboard-one-rouge.vercel.app/)

```
Default admin credentials (demo only):
Email:    admin@iot-dashboard.com
Password: admin123
```

> These credentials are for the public demo only. Production deployments must set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before running seed.

> The backend runs on Render free tier and may need ~30 seconds to cold-start on the first request. The app automatically pings `/api/health` and shows a **Waking up** status instead of going offline immediately.

> Optional: set the repository variable `BACKEND_HEALTH_URL` (e.g. `https://your-api.onrender.com/api/health`) to enable the scheduled keep-alive workflow and reduce cold starts.

---

## Screenshots

All screenshots are captured from the [live deployment](https://iot-dashboard-one-rouge.vercel.app/) running against the seeded demo dataset.

<table>
  <tr>
    <td align="center" width="33%">
      <a href="./assets/screenshots/login.png"><img src="./assets/screenshots/login.png" alt="Login" /></a>
      <sub><b>Login</b><br/>Glassmorphism auth with register flow</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/dashboard.png"><img src="./assets/screenshots/dashboard.png" alt="Dashboard" /></a>
      <sub><b>Dashboard</b><br/>Real-time sensor monitoring with floor tabs</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/historical.png"><img src="./assets/screenshots/historical.png" alt="Historical" /></a>
      <sub><b>Historical</b><br/>Aggregated charts with date range picker</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <a href="./assets/screenshots/alerts.png"><img src="./assets/screenshots/alerts.png" alt="Alerts" /></a>
      <sub><b>Alerts</b><br/>Filterable alert list with stats summary</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/devices.png"><img src="./assets/screenshots/devices.png" alt="Devices" /></a>
      <sub><b>Devices</b><br/>Admin device registry with CRUD actions</sub>
    </td>
    <td align="center" width="33%">
      <a href="./assets/screenshots/settings.png"><img src="./assets/screenshots/settings.png" alt="Settings" /></a>
      <sub><b>Settings</b><br/>Threshold config with range visualizer</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <a href="./assets/screenshots/dashboard-dark.png"><img src="./assets/screenshots/dashboard-dark.png" alt="Dark Mode" /></a>
      <sub><b>Dark Mode</b><br/>Full dark theme across all pages</sub>
    </td>
    <td align="center" width="33%">
      <sub><b>&nbsp;</b></sub>
    </td>
    <td align="center" width="33%">
      <sub><b>&nbsp;</b></sub>
    </td>
  </tr>
</table>

---

## Architecture

A high-level visual map of the system. Both diagrams render natively on GitHub thanks to Mermaid support.

### Domain Model

How the core entities relate to each other and how real-time delivery fans out.

```mermaid
graph LR
  User(("User"))
  Device(["Device"])
  ThresholdConfig(["ThresholdConfig"])
  Alert(["Alert"])
  SensorReading(["SensorReading"])

  User -- "registers" --> Device
  User -- "configures" --> ThresholdConfig
  User -- "acknowledges" --> Alert
  Device -- "generates" --> SensorReading
  SensorReading -- "evaluated by" --> ThresholdConfig
  ThresholdConfig -. "triggers" .-> Alert
  Alert -. "emits via Socket.io" .-> User
```

### Request Lifecycle

How a single sensor reading travels through the stack.

```mermaid
flowchart LR
  SIM["Sensor Simulator<br/>(mqtt.js)"]
  BROKER["MQTT Broker<br/>(HiveMQ Cloud)"]
  CONSUMER["MQTT Consumer<br/>(Node.js)"]
  DB[("PostgreSQL<br/>(Neon)")]
  ALERT["Alert Engine"]
  EMAIL["Nodemailer<br/>(Gmail SMTP)"]
  WS["Socket.io"]
  CLIENT["React 19 SPA<br/>(Vite + Tailwind v4)"]
  API["Express 5 API<br/>(Prisma 7 + JWT)"]

  SIM -- "MQTT publish" --> BROKER
  BROKER -- "MQTT subscribe" --> CONSUMER
  CONSUMER --> DB
  CONSUMER --> ALERT
  ALERT --> DB
  ALERT -- "critical" --> EMAIL
  ALERT -. "alert:new" .-> WS
  CONSUMER -. "sensor:data" .-> WS
  WS -. "WebSocket" .-> CLIENT
  CLIENT -- "Axios + JWT" --> API
  API --> DB
```

---

## Technologies

### Frontend

- **React 19** — Modern UI library with hooks and context for state management
- **Vite 8** — Lightning-fast build tool and dev server with HMR
- **TypeScript 6** — Type-safe development across all components
- **Tailwind CSS v4** — Utility-first CSS framework with custom dark/light theme system
- **Framer Motion** — Smooth layout animations, page transitions, and micro-interactions
- **Recharts 3** — Responsive charting for sparklines, sensor charts, and historical data
- **Socket.io Client** — Real-time sensor data and alert event streaming
- **React Router v7** — Client-side routing with protected/admin/guest route guards
- **Axios** — HTTP client with JWT interceptors and error handling
- **Lucide React** — Modern icon library

### Backend

- **Node.js 20+** — Server-side JavaScript runtime
- **Express 5** — Next-gen web framework with async error handling
- **TypeScript 6** — End-to-end type safety
- **Prisma 7** — Modern ORM with PostgreSQL adapter and type-safe queries
- **PostgreSQL (Neon)** — Serverless database for application and time-series data
- **MQTT (mqtt.js)** — IoT telemetry ingestion from MQTT broker (Mosquitto / HiveMQ)
- **Socket.io 4** — Real-time bidirectional event streaming to React clients
- **JWT + bcryptjs** — Stateless authentication with password hashing
- **Nodemailer** — SMTP email notifications on critical alerts
- **Swagger UI** — Interactive OpenAPI 3.0 API documentation
- **Helmet + CORS + Rate Limiting** — Security middleware stack

---

## Installation

### Prerequisites

- **Node.js** v20+ and **npm**
- **Docker** — for local Mosquitto MQTT broker
- **PostgreSQL 16+** or a [Neon](https://neon.tech) account (free tier)

### Local Development

**1. Clone the repository:**

```bash
git clone https://github.com/Serkanbyx/s5.3_Iot-Dashboard.git
cd s5.3_Iot-Dashboard
```

**2. Start the MQTT broker:**

```bash
cd docker
docker compose up -d
cd ..
```

**3. Set up environment variables:**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**server/.env**

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/iot_dashboard
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_TOPIC_ROOT=factory
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ALERT_EMAIL_FROM=IoT Dashboard <your_email@gmail.com>
ALERT_EMAIL_TO=recipient@example.com
```

**client/.env**

```env
VITE_API_URL=http://localhost:5000
```

**4. Install dependencies and set up database:**

```bash
# Terminal 1 — Backend
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev

# Terminal 2 — Simulator
cd server
npm run simulate

# Terminal 3 — Frontend
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with the development seed credentials:

```
Email:    admin@iot-dashboard.com
Password: admin123
```

> Local development uses these defaults automatically. Do not use them in production.

---

## Usage

1. **Register / Login** — Create a new account or log in with existing credentials
2. **Dashboard** — View real-time sensor readings organized by floor with animated cards and sparklines
3. **Expand Charts** — Click any sensor card to view a full interactive Recharts visualization
4. **Historical Data** — Navigate to Historical page, select sensor, type, time window, and date range
5. **Alerts** — Monitor threshold violations with severity filters, acknowledge or bulk-clear alerts
6. **Devices** — (Admin) Register new IoT sensors, toggle active state, edit floor/type assignments
7. **Settings** — (Admin) Configure threshold ranges per sensor type with live range visualizer
8. **Theme Toggle** — Switch between dark, light, and system themes from the navbar

---

## How It Works

### MQTT Data Flow

Sensor readings flow through a structured MQTT topic hierarchy:

```
{root}/{floor}/{sensorId}/{type}
factory/floor1/sensor01/temperature
```

The MQTT consumer validates incoming data against the registered device whitelist, writes to PostgreSQL, evaluates threshold rules, and fans out to connected clients via Socket.io.

### Alert Engine

Every incoming reading is evaluated against configurable thresholds:

```
criticalMin ← WARNING → minValue ← NORMAL → maxValue ← WARNING → criticalMax
```

- **WARNING** — value between `criticalMin–minValue` or `maxValue–criticalMax`
- **CRITICAL** — value below `criticalMin` or above `criticalMax`

When triggered: alert is persisted → `alert:new` emitted via Socket.io → email sent for CRITICAL severity.

### Authentication Flow

JWT-based stateless auth with role-based access:

1. User logs in → server returns signed JWT token
2. Axios interceptor attaches `Authorization: Bearer <token>` to every request
3. `protect` middleware verifies token and attaches user to request
4. `adminOnly` middleware checks `role === ADMIN` for privileged routes
5. Client route guards (`ProtectedRoute`, `AdminRoute`, `GuestOnlyRoute`) enforce navigation

---

## API Endpoints

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Welcome page with API links |
| GET | `/api-docs` | — | Swagger UI documentation |
| GET | `/api/health` | — | Health check and uptime |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and receive JWT token |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PATCH | `/api/auth/profile` | JWT | Update user profile |
| PATCH | `/api/auth/password` | JWT | Change password |

### Sensors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/sensors/latest` | JWT | Latest reading per sensor+type |
| GET | `/api/sensors/history` | JWT | Raw history for a sensor |
| GET | `/api/sensors/aggregated` | JWT | Aggregated data (minute/hour) |
| GET | `/api/sensors/list` | JWT | List of all known sensors |
| GET | `/api/sensors/floors` | JWT | Floor overview with readings |

### Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | JWT | Paginated, filterable alert list |
| GET | `/api/alerts/stats` | JWT | Alert statistics |
| PATCH | `/api/alerts/:id/acknowledge` | Admin | Acknowledge a single alert |
| PATCH | `/api/alerts/acknowledge-all` | Admin | Acknowledge all alerts |
| DELETE | `/api/alerts/cleanup` | Admin | Delete old acknowledged alerts |

### Thresholds

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/thresholds` | JWT | Get all threshold configurations |
| PATCH | `/api/thresholds/:sensorType` | Admin | Update threshold for a sensor type |

### Devices

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/devices` | JWT | List all registered devices |
| GET | `/api/devices/:id` | JWT | Get a single device |
| POST | `/api/devices` | Admin | Register a new device |
| PATCH | `/api/devices/:id` | Admin | Update a device |
| DELETE | `/api/devices/:id` | Admin | Delete a device |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sensor:data` | Server → Client | New sensor reading received |
| `alert:new` | Server → Client | New alert created |
| `alert:acknowledged` | Server → Client | Alert was acknowledged |

> Auth endpoints require `Authorization: Bearer <token>` header. Admin endpoints require the `ADMIN` role.

---

## Project Structure

A clean monorepo layout with an explicit backend / frontend split. Each panel below is collapsible — expand the one you care about.

<details open>
<summary><b>Server</b> — Express 5 API</summary>

```
server/
├── prisma/
│   ├── schema.prisma        # 4 models: User, ThresholdConfig, Alert, Device
│   └── seed.ts              # admin user, thresholds, 6 default devices
├── src/
│   ├── config/              # env, database, mqtt, swagger
│   ├── controllers/         # auth, sensor, alert, threshold, device
│   ├── middlewares/         # auth, errorHandler, rateLimiter, sanitize, validate
│   ├── routes/              # one file per resource group
│   ├── services/            # mqttConsumer, alertEngine, emailService, socketService
│   ├── simulator/           # sensorSimulator.ts (mqtt.js publisher)
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # generateToken
│   ├── validators/          # express-validator rules per resource
│   └── index.ts             # Express app + Swagger + graceful shutdown
├── tsconfig.json
├── nodemon.json
└── package.json
```

</details>

<details>
<summary><b>Client</b> — React 19 + Vite SPA</summary>

```
client/
├── src/
│   ├── api/                 # axios instance + service wrappers
│   ├── components/
│   │   ├── alerts/          # AlertList, AlertItem, AlertToast, FilterBar, Stats
│   │   ├── dashboard/       # SensorCard, SensorChart, SensorGrid, FloorTabs
│   │   ├── guards/          # ProtectedRoute, AdminRoute, GuestOnlyRoute
│   │   ├── historical/      # HistoricalChart, DateRangePicker, StatsSummary
│   │   ├── layout/          # MainLayout, Navbar, Sidebar, MobileNav
│   │   ├── settings/        # ThresholdCard, RangeVisualizer, SystemStatus
│   │   ├── skeletons/       # page-specific loading skeletons
│   │   └── ui/              # GlassCard, Spinner, Badge, Toggle, Pagination...
│   ├── contexts/            # AuthContext, SocketContext, ThemeContext
│   ├── hooks/               # useSocket, useDebounce, useAnimatedValue...
│   ├── pages/               # Login, Dashboard, Historical, Alerts, Devices, Settings, 404
│   ├── types/               # TypeScript interfaces
│   └── utils/               # cn (clsx helper)
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

</details>

<details>
<summary><b>Repository root</b> — docs, governance & shared assets</summary>

```
s5.3_Iot-Dashboard/
├── client/              # → see Client panel above
├── server/              # → see Server panel above
├── docker/              # docker-compose.yml + mosquitto/mosquitto.conf
├── docs/                # build-guide.md (archived build playbook)
├── assets/              # screenshots/
├── .github/             # CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates
├── .gitignore
├── LICENSE              # PolyForm Noncommercial 1.0.0
└── README.md
```

</details>

---

## Security

- **Helmet** — Security HTTP headers on every response
- **CORS** — Strict origin whitelist (only `CLIENT_URL` allowed)
- **Rate Limiting** — Global limiter + stricter auth limiter + API limiter
- **Input Sanitization** — express-mongo-sanitize strips `$` and `.` operators
- **Input Validation** — express-validator rules on every mutation endpoint
- **Password Hashing** — bcryptjs with salt rounds
- **Production Admin** — `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` required for production seed; server refuses to start if the default demo password is still in use
- **JWT Authentication** — Stateless tokens with configurable expiry
- **Role-based Authorization** — Admin-only routes for settings, devices, and alert management
- **Device Whitelist** — MQTT consumer only processes data from registered active devices
- **No Stack Traces** — Error handler strips internals in production mode

---

## Deployment (All Free Tier)

Every service uses permanent free tiers — no credit card required, no expiration.

| Service | Platform | Cost |
|---------|----------|------|
| Backend API | [Render](https://render.com) | $0/month |
| Frontend | [Vercel](https://vercel.com) | $0/month |
| Database | [Neon](https://neon.tech) | $0/month |
| MQTT Broker | [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) | $0/month |
| Email | Gmail SMTP (App Password) | $0/month |
| **Total** | | **$0/month** |

### Render (Backend)

1. Connect your GitHub repository
2. Set root directory to `server`
3. Build command: `npm install && npx prisma generate && npm run db:deploy && npm run build && npm run seed`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`
6. **Required in production:** set `NODE_ENV=production`, `ALLOW_REGISTRATION=false`, and strong `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` values before seed runs

### Vercel (Frontend)

1. Import the repository
2. Set root directory to `client`
3. Framework preset: Vite
4. Add `VITE_API_URL` pointing to your Render backend URL

### Neon (Database)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string to `DATABASE_URL`
3. Run `npm run db:deploy` from the server directory (or `npx prisma migrate dev` for local development)

### HiveMQ Cloud (MQTT)

1. Create a free cluster at [hivemq.com](https://www.hivemq.com/mqtt-cloud-broker/)
2. Set `MQTT_BROKER_URL` to `mqtts://<cluster>.hivemq.cloud:8883`
3. Create credentials and set `MQTT_USERNAME` / `MQTT_PASSWORD`

> After deploying both services, set `CLIENT_URL` on Render to your Vercel URL and redeploy.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `MQTT_BROKER_URL` | MQTT broker URL | `mqtt://localhost:1883` |
| `MQTT_USERNAME` | MQTT username (optional) | — |
| `MQTT_PASSWORD` | MQTT password (optional) | — |
| `MQTT_TOPIC_ROOT` | Base MQTT topic | `factory` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `CLIENT_URL` | CORS allowed origin | `http://localhost:5173` |
| `ALLOW_REGISTRATION` | Allow public sign-up | `true` (defaults to `false` in production) |
| `SEED_ADMIN_EMAIL` | Admin email for `npm run seed` | dev: `admin@iot-dashboard.com` |
| `SEED_ADMIN_PASSWORD` | Admin password for seed | dev: `admin123`; **required in production** |
| `SEED_ADMIN_NAME` | Admin display name | `Admin` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP email address | — |
| `SMTP_PASS` | SMTP password / app password | — |
| `ALERT_EMAIL_FROM` | Sender display name | — |
| `ALERT_EMAIL_TO` | Alert recipient email | — |

### Client (`client/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | _(empty = same origin)_ |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](.github/CONTRIBUTING.md) and [Code of Conduct](.github/CODE_OF_CONDUCT.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following semantic format:

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactoring |
| `docs:` | Documentation changes |
| `chore:` | Maintenance and dependency updates |

4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0** — see the [LICENSE](LICENSE) file for details.

---

## Developer

**Serkanby**

- 🌐 Website: [serkanbayraktar.com](https://serkanbayraktar.com/)
- 🐙 GitHub: [@Serkanbyx](https://github.com/Serkanbyx)
- 📧 Email: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)

---

## Acknowledgments

- [React](https://react.dev/) — UI library
- [Express](https://expressjs.com/) — Web framework
- [Prisma](https://www.prisma.io/) — Database ORM
- [Recharts](https://recharts.org/) — Charting library
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Socket.io](https://socket.io/) — Real-time engine
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [MQTT.js](https://github.com/mqttjs/MQTT.js) — MQTT client
- [Neon](https://neon.tech/) — Serverless PostgreSQL
- [HiveMQ](https://www.hivemq.com/) — Cloud MQTT broker

---

## Contact

- [Open an Issue](https://github.com/Serkanbyx/s5.3_Iot-Dashboard/issues)
- Email: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)
- Website: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!
