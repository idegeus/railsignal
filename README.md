# RailSignal

> **Crowdsourced mobile coverage on the rails.**
> *See the gaps. Close them.*

RailSignal is an open-source, privacy-first mobile app that passively collects signal quality data on train routes and publishes it as open data — giving commuters, regulators, and operators the evidence they need to actually fix mobile dead zones.

**Launch route:** Barcelona ↔ Flaça (Rodalies / Renfe R11)

---

## Table of Contents

1. [Why This Exists](#why-this-exists)
2. [Name & Identity](#name--identity)
3. [How It Works](#how-it-works)
4. [Features](#features)
5. [Data Model](#data-model)
6. [Technical Architecture](#technical-architecture)
7. [Privacy Design](#privacy-design)
8. [Platform Notes](#platform-notes)
9. [Repository Structure](#repository-structure)
10. [Local Development](#local-development)
11. [Deployment](#deployment)
12. [Roadmap](#roadmap)
13. [Advocacy Strategy](#advocacy-strategy)
14. [Contributing](#contributing)
15. [License](#license)

---

## Why This Exists

I'm using the Barcelona–Flaça train corridor often, together with remote workers, commuters, and business travellers who need reliable internet to work on the move. Often I'm annoyed by significant portions of the route that have no usable mobile signal, across all operators, consistently.

This is not a secret — but it is undocumented. Operators have no formal, evidence-based pressure to improve coverage on this corridor. Regulators lack granular, independent data. Commuters have no way to plan around dead zones.

RailSignal fixes this by turning every journey into a data point. Passive, automatic, privacy-preserving signal logging — aggregated into a public dataset that anyone can download, cite, and act on.

**The goal is not just an app. It is a publicly available evidence base that operators and regulators cannot ignore.**

---

## Name & Identity

**Name:** RailSignal

**Logo concept:** Signal bars (▁▃▅▇) rising from stylised train tracks. Immediately communicates both domains — railway and mobile connectivity.

**Tagline options:**
- *"See the gaps. Close them."* ← primary
- *"Your commute, mapped."*
- *"Coverage where it counts."*
- *"Dead zones don't lie."*

**Colour palette:**
- Good signal: `#34d399` (green)
- Fair signal: `#fbbf24` (amber)
- Dead zone: `#f87171` (red)
- Brand accent: `#a78bfa` (purple)
- Background: `#0f0f14` (near-black)

---

## How It Works

1. User installs the app and grants background location permission (once).
2. App runs silently in the background — no interaction needed.
3. Every ~10 seconds while travelling, the app records a signal reading.
4. **Journey auto-detection:** the app uses GPS speed + route corridor matching to detect when the user is on a train. It only logs actively during journeys — not all day.
5. Readings are buffered locally in SQLite (important: the route has dead zones, so we cannot assume connectivity during collection).
6. When connectivity is available, readings are uploaded in batch to the API, anonymised and snapped to a 50m grid before leaving the device.
7. The backend aggregates readings per route segment and serves them via a public API and interactive web map.

---

## Features

### Core (MVP)

| Feature | Description |
|---|---|
| **Passive signal logger** | Background logging every ~10s: dBm, network type, operator, GPS, speed |
| **Journey auto-detection** | Detects train travel via speed + GPS corridor — no start/stop button |
| **Offline buffer** | SQLite local queue; uploads when connectivity returns |
| **Anonymised upload** | GPS snapped to 50m grid on-device before any data leaves the phone |
| **Coverage heatmap** | Web map: colour-coded signal quality per 50m segment of route |
| **Route Report Card** | % time with good / fair / no signal, per route, per time period |

### Community layer

| Feature | Description |
|---|---|
| **One-tap manual reports** | "Call dropped here", "couldn't load email" — qualitative layer on top of raw data |
| **Dead zone alerts** | Notification before entering a known bad segment, based on community data |
| **Operator leaderboard** | Public ranking of operators by route segment with evidence |

### Advocacy layer

| Feature | Description |
|---|---|
| **Open data API** | All aggregated data freely available as GeoJSON + CSV, CC-BY licence |
| **Shareable route reports** | PDF/link export of a route's coverage stats, ready to send to Renfe / CNMC / press |
| **Trend tracking** | Month-over-month change — shows if coverage is improving or stagnating |

---

## Data Model

### `signal_reading` (core collection table)

```
id              UUID            Primary key
device_id       UUID            Anonymous, rotatable device identifier
journey_id      UUID            Groups readings into a single trip
timestamp       TIMESTAMPTZ     UTC
lat             FLOAT           Snapped to ~50m grid
lng             FLOAT           Snapped to ~50m grid
signal_dbm      INTEGER         e.g. -87. NULL if no signal.
network_type    TEXT            '5G' | '4G' | '3G' | '2G' | 'none'
mcc             TEXT            Mobile Country Code (e.g. '214' for Spain)
mnc             TEXT            Mobile Network Code → resolves to operator name
speed_kmh       FLOAT           GPS-derived speed
platform        TEXT            'android' | 'ios'
app_version     TEXT            Semver
```

### `journey` (trip grouping table)

```
journey_id      UUID
route_id        TEXT            e.g. 'BCN-FLA'
started_at      TIMESTAMPTZ
ended_at        TIMESTAMPTZ
reading_count   INTEGER
platform        TEXT
app_version     TEXT
```

### `segment_aggregate` (derived, recomputed hourly)

```
segment_id      TEXT            50m polyline segment identifier
route_id        TEXT
operator        TEXT            Resolved from MCC+MNC
avg_signal_dbm  FLOAT
pct_no_signal   FLOAT           0.0–1.0
pct_good        FLOAT           signal > -85 dBm
dominant_net    TEXT            Most common network type in segment
sample_count    INTEGER
updated_at      TIMESTAMPTZ
```

### What is never stored

- Name, email, phone number, or any identifying information
- Exact GPS coordinates (always snapped before upload)
- Device make, model, or OS version
- Data from other apps
- Persistent cross-session tracking (device_id is rotatable by user at any time)

---

## Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Mobile App                          │
│          React Native + Expo (iOS + Android)             │
│                                                          │
│  ┌─────────────────┐     ┌──────────────────────────┐   │
│  │  Signal module  │     │  Journey detector        │   │
│  │  Android:       │     │  Speed + GPS corridor    │   │
│  │  TelephonyMgr   │────▶│  matching                │   │
│  │  iOS:           │     └──────────────────────────┘   │
│  │  CoreTelephony  │              │                      │
│  │  + native mod   │              ▼                      │
│  └─────────────────┘     ┌──────────────────────────┐   │
│                          │  Local SQLite buffer     │   │
│                          │  (offline-first)         │   │
│                          └──────────┬───────────────┘   │
│                                     │ anonymise on-device│
└─────────────────────────────────────┼────────────────────┘
                                      │ HTTPS batch upload
                                      ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend (EU region)                   │
│                  FastAPI (Python)                        │
│                                                          │
│  POST /readings  →  validate → store                     │
│  GET  /segments  →  serve aggregated heatmap tiles       │
│  GET  /routes/:id/report  →  route report card           │
│  GET  /export    →  GeoJSON / CSV open data              │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  PostgreSQL + PostGIS                             │   │
│  │  Hourly aggregation job → segment_aggregate       │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────┐
│                  Web Dashboard (public)                  │
│                                                          │
│  • Interactive heatmap (MapLibre GL)                     │
│  • Route report cards                                    │
│  • Operator leaderboard                                  │
│  • Open data downloads                                   │
└──────────────────────────────────────────────────────────┘
```

### Stack summary

| Layer | Technology | Rationale |
|---|---|---|
| Mobile | React Native + Expo | Single codebase for iOS + Android |
| iOS signal | CoreTelephony + Expo native module | Public API limited; native module needed for raw dBm |
| Android signal | `TelephonyManager` via React Native module | Full access to RSRP, RSRQ, dBm, operator |
| Background tasks | `expo-task-manager` + `expo-location` | Background GPS + periodic signal polling |
| Local storage | SQLite via `expo-sqlite` | Offline buffer — critical given dead zones on route |
| API | FastAPI (Python) | Fast to build, async, good PostGIS ecosystem |
| Database | PostgreSQL + PostGIS | Spatial queries, segment aggregation |
| Map tiles | Martin (Rust tile server) or PMTiles | Serve vector tiles efficiently |
| Hosting | Hetzner VPS (CX22, EU West) | Full control over PostGIS, storage, and backups; ~€4/month |
| Reverse proxy | Caddy | Automatic HTTPS via Let's Encrypt, minimal config |
| Web map | MapLibre GL JS | Open source, no API key required |

---

## Privacy Design

Privacy is a first-class design constraint, not an afterthought.

- **No account required.** Ever. The app generates a random UUID on first launch.
- **Device ID is rotatable.** Users can reset their ID at any time from settings, breaking any continuity.
- **GPS snapping on-device.** Coordinates are rounded to the nearest ~50m grid cell before any data leaves the phone. The server never sees exact GPS.
- **No personal data on server.** The backend receives: snapped coordinates, signal values, network codes, speed. Nothing that identifies a person.
- **GDPR compliant by design.** EU hosting, no personal data stored, no consent banners needed for technical data collection (though we will be transparent in the app).
- **Open licence.** All aggregated data published under Creative Commons CC-BY 4.0. Anyone can use it, cite it, build on it.
- **Open source.** The app and backend will be open source. Anyone can verify what data is actually collected.

---

## Platform Notes

### Android

Android's `TelephonyManager` API provides rich signal data:
- `getSignalStrength()` → dBm, RSRP, RSRQ, RSSI
- `getNetworkOperator()` → MCC + MNC
- `getNetworkType()` → LTE, NR (5G), UMTS, etc.
- Background access works well with a foreground service

Android is the **primary platform for data quality**. Aim for Android-first in the MVP.

### iOS

CoreTelephony is more restricted on modern iOS:
- `CTTelephonyNetworkInfo` gives carrier name and current radio access technology
- Raw dBm is **not available** via public API on iOS 16+
- Signal bars (1–5) can be inferred but are less precise than dBm
- Background location requires `"Always"` permission — the prompt must be timed carefully to avoid rejection
- A native Expo module will be needed to access anything beyond what `expo-location` provides

**Approach:** iOS contributes journey counts, network type, and operator identity. Android contributes the high-resolution signal strength data. The two complement each other — iOS widens community participation, Android drives data quality.

---

## Repository Structure

```
RailSignal/
├── README.md                  ← this file
├── apps/
│   ├── mobile/                ← React Native (Expo) app
│   │   ├── app/               ← Expo Router screens
│   │   ├── modules/           ← Native modules (signal, telephony)
│   │   ├── services/          ← Journey detector, logger, uploader
│   │   ├── store/             ← Local SQLite buffer
│   │   └── app.json
│   └── web/                   ← Public dashboard
│       ├── pages/             ← Route map, report cards, downloads
│       └── components/
├── backend/
│   ├── api/                   ← FastAPI app
│   │   ├── routes/            ← /readings, /segments, /report, /export
│   │   ├── models/            ← Pydantic schemas
│   │   └── db/                ← SQLAlchemy + PostGIS models
│   ├── jobs/                  ← Aggregation cron jobs
│   └── migrations/            ← Alembic migrations
├── data/
│   ├── raw/                   ← Local test recordings (gitignored)
│   └── exports/               ← Published open data snapshots
├── docs/
│   ├── api.md                 ← API reference
│   ├── privacy.md             ← Full privacy policy
│   ├── contributing.md        ← How to contribute
│   └── advocacy/              ← Route reports for regulators / press
└── infra/
    ├── docker-compose.yml      ← Local dev stack
    ├── docker-compose.prod.yml ← Production stack (Caddy + PostGIS + Martin)
    ├── Caddyfile               ← Reverse proxy + automatic SSL
    ├── deploy.sh               ← git pull → rebuild → migrate
    ├── backup.sh               ← Postgres → Hetzner Object Storage
    └── .env.example            ← Environment variable template
```

---

## Local Development

### Prerequisites

- [Docker](https://docs.docker.com/get-started/) + Docker Compose v2
- Node.js 20+ (for the mobile app and web dashboard)
- Python 3.12+ (optional — the API runs inside Docker)

### Start the backend

```bash
cp infra/.env.example backend/.env  # edit values as needed
docker compose -f infra/docker-compose.yml up -d
```

Services started:

| Service | URL | Notes |
|---|---|---|
| FastAPI | http://localhost:8000 | Auto-reloads on code changes |
| API docs | http://localhost:8000/docs | Interactive Swagger UI |
| PostgreSQL | localhost:5432 | PostGIS enabled |
| Martin tiles | http://localhost:3001 | Vector tile server |

### Run migrations

```bash
docker compose -f infra/docker-compose.yml exec api alembic upgrade head
```

### Mobile app

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` for an Android / iOS simulator.

---

## Deployment

Hosted on a Hetzner VPS (CX22 — 2 vCPU, 4 GB RAM, ~€4/month). Falkenstein (Germany) or Helsinki (Finland) keeps data in the EU. The full stack runs under Docker Compose; Caddy handles TLS automatically via Let's Encrypt.

### One-time server setup

```bash
# Ubuntu 24.04 LTS
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git awscli

git clone https://github.com/youruser/railsignal.git /srv/railsignal
cp /srv/railsignal/infra/.env.example /srv/railsignal/infra/.env
nano /srv/railsignal/infra/.env
```

Point your DNS `A` record at the server IP before first deploy — Caddy requests the Let's Encrypt certificate on first startup. Update `infra/Caddyfile` with your actual domains.

### Deploy

```bash
bash /srv/railsignal/infra/deploy.sh
```

Pulls latest code, rebuilds changed images, restarts services, and runs any pending Alembic migrations.

### Automated backups

Configure `S3_*` variables in `infra/.env`, then register the daily cron:

```bash
echo "0 3 * * * /srv/railsignal/infra/backup.sh >> /var/log/railsignal-backup.log 2>&1" | crontab -
```

Backups are gzip-compressed Postgres dumps uploaded to Hetzner Object Storage (S3-compatible, EU-resident).

---

## Roadmap

### Phase 0 — Validate (Weeks 1–3)

- [x] Build minimal Android signal logger (no UI, just logging to file)
- [ ] Run personally on BCN→Flaça 10+ times
- [ ] Visualise in Kepler.gl or QGIS — confirm data is compelling
- [ ] Share a map screenshot publicly to gauge interest
- [x] Decide: React Native or native Android for MVP?

### Phase 1 — MVP App (Months 1–2)

- [x] React Native project setup with Expo
- [x] Android signal collection module
- [x] Journey auto-detection (speed + GPS corridor)
- [x] Local SQLite offline buffer
- [ ] FastAPI backend with PostGIS
- [ ] Basic web heatmap viewer
- [ ] Recruit 10–20 beta users on the BCN↔Flaça commute
- [ ] iOS app (participation-level, not full signal data)

### Phase 2 — Community & Public Launch (Months 3–5)

- [ ] App Store + Google Play submission
- [ ] Open data API + CSV/GeoJSON downloads live
- [ ] Route Report Card generator (PDF + shareable link)
- [ ] Operator leaderboard published
- [ ] Dead zone alerts feature
- [ ] First public route report: Barcelona–Flaça coverage analysis
- [ ] Press outreach: Spanish tech media, Xataka, El País Tecnología
- [ ] Formal submission to CNMC and Renfe with dataset
- [ ] Expand logging to other Rodalies routes

### Phase 3 — Impact & Scale (Months 6–12)

- [ ] EU-style formal coverage report (Ofcom model)
- [ ] Partnership with rail passenger associations (e.g. Associació per la Promoció del Transport Públic)
- [ ] Expand to cross-border routes (Barcelona–Lyon, Madrid–Lisbon)
- [ ] Explore grant funding: EU Horizon Europe, Spanish CDTI, Mozilla Foundation, NGI
- [ ] Consider API partnership with telecoms researchers / universities
- [ ] Add warning module communicating laptop when using hotspot, warning upcoming dead zones

---

## Advocacy Strategy

The app is a data collection tool. The real impact comes from how that data is used.

### Target audiences

| Audience | What they need | What we give them |
|---|---|---|
| **CNMC** (telecoms regulator) | Evidence of coverage failures on specific corridors | Route reports with GPS-stamped, timestamped readings, operator breakdown |
| **ADIF / Renfe** | Passenger pressure + data on their network | Coverage maps tied to specific train lines and timetables |
| **Telecom operators** | Competitive pressure + specific problem locations | Segment-level data showing exactly where they underperform vs competitors |
| **Journalists** | A story with data and visuals | Embeddable maps, downloadable datasets, shareable report cards |
| **Researchers** | Clean, open, longitudinal dataset | CC-BY API and CSV exports |
| **Other commuters** | Know what to expect, plan their work | Dead zone map, alerts, journey reports |

### Key regulatory contacts

- **CNMC** (Comisión Nacional de Mercados y la Competencia) — telecoms coverage obligations
- **SETELECO** — Secretaría de Estado de Telecomunicaciones, under Ministerio para la Transformación Digital
- **European Commission** — European Electronic Communications Code (EECC) mandates coverage data

### The shame mechanism

A public operator leaderboard — "Movistar: 62% good signal on this route. Orange: 41%. Vodafone: 38%" — published with evidence and updated monthly, creates competitive pressure without requiring any regulatory action. Operators respond to reputational data faster than to regulator requests.

---

## Contributing

RailSignal is open source and welcomes contributors.

**Most valuable contributions right now:**
- Android signal collection module (TelephonyManager expertise)
- iOS native module for CoreTelephony access
- PostGIS experience (spatial aggregation queries)
- Regular commuters on the BCN↔Flaça or other Rodalies routes willing to run the beta app

See `docs/contributing.md` for setup instructions (coming soon).

---

## Licence

- **App and backend code:** MIT Licence
- **Collected data:** Creative Commons CC-BY 4.0
- **Route reports:** CC-BY 4.0

---

*RailSignal is an independent, community-driven project. It is not affiliated with Renfe, ADIF, or any mobile operator.*
