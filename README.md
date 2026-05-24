# IoT Sensor Dashboard

Real-time IoT sensor monitoring dashboard. Ingests telemetry over MQTT, stores time-series readings in PostgreSQL, and visualizes live + historical data with threshold-based alerting and email notifications.

## Stack

- **Frontend:** React 19 + Vite + TypeScript, TailwindCSS v4, Recharts, Socket.io client, Framer Motion
- **Backend:** Node.js + Express 5 + TypeScript, Prisma ORM, Socket.io, mqtt.js, Nodemailer
- **Database:** PostgreSQL (Neon free tier)
- **MQTT Broker:** Eclipse Mosquitto (local via Docker) / HiveMQ Cloud (production)
- **Auth:** JWT (admin / viewer roles)

## Project Structure

```
.
├── server/     # Express + Prisma + MQTT + Socket.io API
├── client/     # React 19 + Vite + Tailwind v4 dashboard
└── docker/     # Mosquitto broker compose config
```

## Quick Start

> Full setup details are completed step-by-step. This README will be expanded as later steps add database, MQTT, simulator, and deployment instructions.

```bash
# Server
cd server
npm install
npm run dev

# Client
cd client
npm install
npm run dev
```

## Scripts

### Server

| Script | Description |
| --- | --- |
| `npm run dev` | Start API in watch mode (nodemon + tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run seed` | Seed database via Prisma |
| `npm run simulate` | Run the MQTT sensor simulator |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

### Client

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## License

MIT
