# ⚡ Autonomous EV Fleet Control Center

A full-stack real-time teleoperation dashboard for managing driverless robotaxis.
Built with React.js (frontend) + Node.js + WebSocket (backend).

---

## 📁 Folder Structure

```
ev-fleet-clean/
├── .vscode/
│   └── settings.json          ← VS Code settings
│
├── backend/
│   ├── server.js              ← Express + WebSocket server
│   └── package.json           ← Backend dependencies
│
└── frontend/
    ├── public/
    │   └── index.html         ← HTML shell
    ├── src/
    │   ├── App.js             ← Main layout + 5 tabs
    │   ├── App.css            ← Global styles
    │   ├── index.js           ← React entry point
    │   ├── hooks/
    │   │   └── useFleet.js    ← WebSocket + REST API hook
    │   └── components/
    │       ├── UIKit.jsx           ← StatusBadge, BatteryBar, etc.
    │       ├── FleetMap.jsx        ← Live Leaflet dark map
    │       ├── FleetList.jsx       ← Filterable vehicle sidebar
    │       ├── VehiclePanel.jsx    ← Vehicle detail + controls
    │       ├── CameraGrid.jsx      ← Simulated WebRTC cameras
    │       ├── TeleoperationPanel.jsx ← Dual joystick controller
    │       ├── AnalyticsDashboard.jsx ← Charts & KPIs
    │       ├── DispatchPanel.jsx   ← Job scheduler
    │       └── Telemetry.jsx       ← Latency + incident log
    └── package.json           ← Frontend dependencies
```

---

## 🚀 Setup & Run

### Prerequisites
- **Node.js 16 or 18** (use `nvm use 18` if needed)
- npm

### Step 1 — Start the Backend
```bash
cd backend
npm install
npm start
```
Server starts at **http://localhost:4000**

### Step 2 — Start the Frontend
Open a **new terminal**:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
App opens at **http://localhost:3000**

---

## 🖥️ Open in VS Code

```bash
# Open the whole project in VS Code
code ev-fleet-clean/

# Or open backend and frontend as separate folders
code ev-fleet-clean/backend
code ev-fleet-clean/frontend
```

Recommended VS Code extensions:
- **ESLint** — `dbaeumer.vscode-eslint`
- **Prettier** — `esbenp.prettier-vscode`
- **ES7+ React snippets** — `dsznajder.es7-react-js-snippets`

---

## 🗺️ Navigation Tabs

| Tab | Feature |
|-----|---------|
| 🗺 Map | Live Leaflet dark map with animated vehicle markers |
| 📷 Cameras | 5-angle canvas-simulated WebRTC feeds per vehicle |
| 🕹 Teleop | Dual joystick + WASD keyboard remote control |
| 📋 Dispatch | Job queue with auto-dispatch for critical rides |
| 📊 Analytics | Live charts — fleet status, speed, battery, revenue |

---

## 🔌 API Reference

### REST Endpoints (Backend: port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fleet` | Get all vehicles |
| GET | `/api/incidents` | Get incident log |
| POST | `/api/takeover/:id` | Remote takeover |
| POST | `/api/release/:id` | Release to autonomous |
| POST | `/api/dispatch-cleaning/:id` | Send for cleaning |
| POST | `/api/recall/:id` | Recall to depot |
| POST | `/api/deploy/:id` | Deploy idle vehicle |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `FLEET_INIT` | Server → Client | Initial fleet state on connect |
| `TELEMETRY` | Server → Client | Full fleet update every 1 second |
| `VEHICLE_UPDATE` | Server → Client | Single vehicle state change |
| `INCIDENT` | Server → Client | New incident logged |
| `CONTROL_CMD` | Client → Server | Send steering/speed during takeover |
| `PING / PONG` | Both | Round-trip latency measurement |

---

## 🚗 Vehicle Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `autonomous` | 🟢 Green | Self-driving, on route |
| `takeover_needed` | 🔴 Red | Blocked — needs human intervention |
| `manual_control` | 🟠 Orange | Operator actively controlling |
| `charging` | 🟡 Yellow | At charging station |
| `cleaning` | 🔵 Blue | Undergoing cleaning service |
| `idle` | ⚫ Gray | Available for deployment |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Canvas API, Leaflet, Recharts |
| Backend | Node.js, Express, ws (WebSocket) |
| Map | CartoDB dark tiles via Leaflet |
| Realtime | Native WebSocket (1Hz telemetry) |
| Camera | HTML5 Canvas simulation |

---

## ⚠️ Troubleshooting

**Port already in use:**
```bash
kill -9 $(lsof -ti:4000)   # Kill backend port
kill -9 $(lsof -ti:3000)   # Kill frontend port
```

**npm install fails:**
```bash
npm install --legacy-peer-deps
```

**Node version issues:**
```bash
nvm install 18
nvm use 18
```

**Map not loading:**
Make sure the Leaflet CSS link in `public/index.html` is loading correctly. Check browser console for errors.
