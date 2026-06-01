# IoT Sensor Dashboard

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-Mosquitto%20%2F%20HiveMQ-660066)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio&logoColor=white)

A full-stack, real-time IoT sensor monitoring dashboard. Ingests telemetry over MQTT, stores time-series readings in PostgreSQL, evaluates threshold-based alerting rules with email notifications, and visualizes live and historical data through an interactive glassmorphism UI.

<!-- TODO: Add actual screenshots -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Alerts](docs/screenshots/alerts.png) -->
<!-- ![Historical](docs/screenshots/historical.png) -->

---

## Features

- **Real-time Monitoring** — Live sensor cards with animated values, sparklines, and expandable charts via Socket.io
- **Multi-floor Dashboard** — Filter sensors by floor with tabbed navigation and auto-updating counts
- **Alert Engine** — Automatic WARNING/CRITICAL detection based on configurable thresholds per sensor type
- **Email Notifications** — Nodemailer + Gmail SMTP sends emails on critical alerts
- **Historical Analytics** — Aggregated charts with minute/hour windows, date range picker, brush zoom, and stats summary
- **Alert Management** — Paginated alert list with severity filters, single/bulk acknowledge, and cleanup
- **Settings Panel** — Threshold configuration with live range visualizer, toggle monitoring, and system status
- **Dark/Light Mode** — CSS custom property-based theming with smooth transitions
- **Responsive Design** — Mobile-first with collapsible sidebar, bottom navigation, and adaptive layouts
- **Glassmorphism UI** — Backdrop blur, subtle borders, glow effects, and Framer Motion animations
- **Role-based Access** — JWT authentication with Admin/Viewer roles and route guards
- **Loading Skeletons** — Page-specific skeleton patterns with shimmer animations

---

## Architecture

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

---

## MQTT Topic Structure

| Topic Pattern | Example | Description |
|---|---|---|
| `{root}/{floor}/{sensorId}/{type}` | `factory/floor1/sensor01/temperature` | Individual sensor reading |

**Payload:**

```json
{
  "sensorId": "sensor01",
  "floor": "floor1",
  "type": "temperature",
  "value": 24.5,
  "unit": "°C",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

---

## Tech Stack

| Category | Technology | Hosting |
|---|---|---|
| Backend | Node.js, Express 5, TypeScript | Render (free) |
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4, Framer Motion | Vercel (free) |
| Database | PostgreSQL | Neon (free) |
| ORM | Prisma 7 | — |
| MQTT | Eclipse Mosquitto (dev), HiveMQ Cloud (prod) | HiveMQ (free) |
| Real-time | Socket.io 4 | — |
| Charts | Recharts 3 | — |
| Email | Nodemailer + Gmail SMTP | Gmail (free) |
| Auth | JWT + bcryptjs | — |

---

## Prerequisites

- **Docker** — for local Mosquitto MQTT broker
- **Node.js 20+** — runtime for server and client
- **PostgreSQL 16+** or a [Neon](https://neon.tech) account (free tier)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/iot-dashboard.git
cd iot-dashboard
```

### 2. Start the MQTT broker

```bash
cd docker
docker compose up -d
cd ..
```

### 3. Set up the server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database URL, JWT secret, and SMTP credentials
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 4. Start the simulator

In a second terminal:

```bash
cd server
npm run simulate
```

### 5. Set up the client

In a third terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with the seeded credentials:

```
Email:    admin@iot-dashboard.com
Password: admin123
```

---

## API Endpoints

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Server health + uptime |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and receive JWT token |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PATCH | `/api/auth/profile` | JWT | Update user profile |
| PATCH | `/api/auth/password` | JWT | Change password |

### Sensors

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/sensors/latest` | JWT | Latest reading per sensor |
| GET | `/api/sensors/history` | JWT | Raw history for a sensor |
| GET | `/api/sensors/aggregated` | JWT | Aggregated data (minute/hour) |
| GET | `/api/sensors/list` | JWT | List of all known sensors |
| GET | `/api/sensors/floors` | JWT | Floor overview with readings |

### Alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/alerts` | JWT | Paginated, filterable alert list |
| GET | `/api/alerts/stats` | JWT | Alert stats (total, unacknowledged, etc.) |
| PATCH | `/api/alerts/:id/acknowledge` | Admin | Acknowledge a single alert |
| PATCH | `/api/alerts/acknowledge-all` | Admin | Acknowledge all unacknowledged alerts |
| DELETE | `/api/alerts/cleanup` | Admin | Delete old acknowledged alerts |

### Thresholds

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/thresholds` | JWT | Get all threshold configurations |
| PATCH | `/api/thresholds/:sensorType` | Admin | Update threshold for a sensor type |

### Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `sensor:data` | Server → Client | New sensor reading received |
| `alert:new` | Server → Client | New alert created |
| `alert:acknowledged` | Server → Client | Alert was acknowledged |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|---|---|---|
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
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP email address | — |
| `SMTP_PASS` | SMTP password / app password | — |
| `ALERT_EMAIL_FROM` | Sender display name | — |
| `ALERT_EMAIL_TO` | Alert recipient email | — |

### Client (`client/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | _(empty = same origin)_ |

---

## Alert System

The alert engine evaluates every incoming sensor reading against configurable thresholds:

```
criticalMin ← WARNING → minValue ← NORMAL → maxValue ← WARNING → criticalMax
```

- **WARNING**: value falls between `criticalMin–minValue` or `maxValue–criticalMax`
- **CRITICAL**: value falls below `criticalMin` or above `criticalMax`

When an alert is generated:
1. It is persisted to the database
2. A `alert:new` event is emitted via Socket.io
3. If the severity is CRITICAL, an email notification is sent via Nodemailer

Admins can acknowledge alerts individually or in bulk, and clean up old acknowledged alerts.

---

## Deployment (All Free Tier)

| Service | Platform | Cost |
|---|---|---|
| Backend API | [Render](https://render.com) | $0/month |
| Frontend | [Vercel](https://vercel.com) | $0/month |
| Database | [Neon](https://neon.tech) | $0/month |
| MQTT Broker | [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) | $0/month |
| Email | Gmail SMTP (App Password) | $0/month |
| **Total** | | **$0/month** |

### Render (Backend)

1. Connect your GitHub repository
2. Set root directory to `server`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`

### Vercel (Frontend)

1. Import the repository
2. Set root directory to `client`
3. Framework preset: Vite
4. Add `VITE_API_URL` pointing to your Render backend URL

### Neon (Database)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run `npx prisma migrate deploy` from the server directory

### HiveMQ Cloud (MQTT)

1. Create a free cluster at [hivemq.com](https://www.hivemq.com/mqtt-cloud-broker/)
2. Set `MQTT_BROKER_URL` to `mqtts://<cluster>.hivemq.cloud:8883`
3. Set `MQTT_USERNAME` and `MQTT_PASSWORD`

---

## Folder Structure

```
.
├── client/                         # React frontend
│   ├── src/
│   │   ├── api/                    # Axios service modules
│   │   ├── components/
│   │   │   ├── alerts/             # Alert list, item, toast, filters
│   │   │   ├── dashboard/          # Sensor cards, charts, grid
│   │   │   ├── guards/             # Route guards (Protected, Admin, Guest)
│   │   │   ├── historical/         # Chart, filters, stats
│   │   │   ├── layout/             # Navbar, Sidebar, MainLayout, MobileNav
│   │   │   ├── settings/           # ThresholdCard, RangeVisualizer, SystemStatus
│   │   │   ├── skeletons/          # Loading skeleton patterns
│   │   │   └── ui/                 # Reusable UI primitives
│   │   ├── contexts/               # Auth, Socket, Theme providers
│   │   ├── hooks/                  # Custom hooks
│   │   ├── pages/                  # Route-level page components
│   │   ├── types/                  # TypeScript interfaces
│   │   └── utils/                  # Utility functions
│   └── vite.config.ts
│
├── server/                         # Express backend
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.ts                 # Seed script
│   └── src/
│       ├── config/                 # Database, env, MQTT config
│       ├── controllers/            # Route handlers
│       ├── middlewares/             # Auth, validation, rate limiting
│       ├── routes/                 # Express routers
│       ├── services/               # MQTT consumer, alert engine, email, socket
│       ├── simulator/              # MQTT sensor data simulator
│       ├── types/                  # TypeScript interfaces
│       ├── validators/             # express-validator rules
│       └── index.ts                # Entry point
│
└── docker/                         # Docker Compose for Mosquitto
    ├── docker-compose.yml
    └── mosquitto/mosquitto.conf
```

---

## License

MIT
