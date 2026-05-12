const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── Bangalore Bounding Box ──────────────────────────────────────────────────
const BLORE = {
  lat: { min: 12.85, max: 13.08 },
  lng: { min: 77.48, max: 77.72 },
};

// ─── Real EV car models with image URLs ──────────────────────────────────────
const CAR_MODELS = [
  { 
    brand:'Tesla', 
    model:'Model S', 
    image:'/cars/Tesla-model-s.jpg', 
    color:'#E31937', 
    range:600 
  },
  { 
    brand:'Tesla', 
    model:'Model 3', 
    image:'/cars/Tesla-model-3.jpg', 
    color:'#1E3A5F', 
    range:560 
  },
  { 
    brand:'BMW', 
    model:'iX', 
    image:'/cars/BMW-iX.jpg', 
    color:'#1C69D4', 
    range:630 
  },
  { 
    brand:'BMW', 
    model:'i4', 
    image:'/cars/BMW-i4.jpg', 
    color:'#2D2D2D', 
    range:590 
  },
  { 
    brand:'Mercedes', 
    model:'EQS', 
    image:'/cars/Mercedes-EQS.jpg', 
    color:'#B8B8B8', 
    range:780 
  },
  { 
    brand:'Audi', 
    model:'e-tron GT', 
    image:'/cars/Audi-E-tron.jpg', 
    color:'#BB0A21', 
    range:500 
  },
  { 
    brand:'Hyundai', 
    model:'IONIQ 6', 
    image:'/cars/Hyundai-ioniq-6.jpg', 
    color:'#00AAD2', 
    range:614 
  },
  { 
    brand:'Tata', 
    model:'Nexon EV', 
    image:'/cars/Tata-Nexon-EV.jpg', 
    color:'#003087', 
    range:437 
  },
  { 
    brand:'Tata', 
    model:'Tiago EV', 
    image:'/cars/Tata-Tiago-EV.jpg', 
    color:'#E4002B', 
    range:315 
  },
  { 
    brand:'MG', 
    model:'ZS EV', 
    image:'/cars/MG-ZS-EV.jpg', 
    color:'#B5121B', 
    range:461 
  },
  { 
    brand:'Kia', 
    model:'EV6', 
    image:'/cars/Kia-EV6.jpg', 
    color:'#05141F', 
    range:528 
  },
  { 
    brand:'Volvo', 
    model:'C40 Recharge', 
    image:'/cars/Volvo-C40.jpg', 
    color:'#003F87', 
    range:440 
  }
];
// ─── Bangalore routes ─────────────────────────────────────────────────────────
const ROUTES = [
  { name: 'Whitefield → MG Road',    waypoints: [[12.97, 77.75], [12.97, 77.60]] },
  { name: 'Koramangala → Airport',   waypoints: [[12.93, 77.63], [13.20, 77.71]] },
  { name: 'Indiranagar → Electronic City', waypoints: [[12.98, 77.64], [12.84, 77.67]] },
  { name: 'JP Nagar → Hebbal',       waypoints: [[12.91, 77.59], [13.04, 77.60]] },
  { name: 'HSR Layout → Yelahanka',  waypoints: [[12.91, 77.64], [13.10, 77.59]] },
  { name: 'BTM Layout → Marathahalli', waypoints: [[12.91, 77.61], [12.96, 77.70]] },
  { name: 'Banashankari → Sarjapur', waypoints: [[12.93, 77.55], [12.91, 77.78]] },
  { name: 'Malleshwaram → Bellandur', waypoints: [[13.00, 77.57], [12.93, 77.67]] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const pick    = (arr)      => arr[randInt(0, arr.length)];
const clamp   = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ─── Vehicle Factory ──────────────────────────────────────────────────────────
function createVehicle(index) {
  const car   = CAR_MODELS[index % CAR_MODELS.length];
  const route = pick(ROUTES);

  // All vehicles start as autonomous & moving
  const status = index === 2 ? 'takeover_needed' : 'autonomous';

  // Random starting position inside Bangalore
  const lat = rand(BLORE.lat.min, BLORE.lat.max);
  const lng = rand(BLORE.lng.min, BLORE.lng.max);

  // Random continuous movement direction (in degrees)
  const heading = rand(0, 360);

  return {
    id:          `BLR-${String(index + 1).padStart(3, '0')}`,
    brand:       car.brand,
    model:       car.model,
    carName:     `${car.brand} ${car.model}`,
    image:       car.image,
    carColor:    car.color,
    rangeKm:     car.range,
    status,
    lat,
    lng,
    speed:       randInt(30, 80),      // all cars moving
    battery:     randInt(35, 98),
    passengers:  randInt(1, 4),
    route:       route.name,
    heading,
    // Movement vector — how much lat/lng changes per tick
    dLat:        (Math.cos((heading * Math.PI) / 180)) * 0.0004,
    dLng:        (Math.sin((heading * Math.PI) / 180)) * 0.0004,
    sensors: {
      lidar:  Math.random() > 0.08 ? 'OK' : 'DEGRADED',
      radar:  Math.random() > 0.04 ? 'OK' : 'FAULT',
      camera: Math.random() > 0.06 ? 'OK' : 'DEGRADED',
      gps:    'OK',
    },
    alerts: status === 'takeover_needed'
      ? [{ type: 'CRITICAL', msg: 'Obstacle detected on Outer Ring Road' }]
      : [],
    tripDuration:          randInt(3, 42),
    distanceToDestination: rand(1, 25),
    totalTrips:            randInt(80, 900),
    cleanlinessScore:      randInt(60, 100),
    lastCleaned:           new Date(Date.now() - randInt(1, 48) * 3600000).toISOString(),
    operator:   null,
    takeoverAt: null,
  };
}

// ─── Fleet (12 real EV cars) ──────────────────────────────────────────────────
let fleet     = Array.from({ length: 12 }, (_, i) => createVehicle(i));
let incidents = [];

// ─── Update — ALL cars move every tick ───────────────────────────────────────
function updateFleet() {
  fleet = fleet.map((v) => {
    if (v.status === 'charging' || v.status === 'cleaning') return v;

    // Bounce off Bangalore boundary walls — flip direction component
    let { lat, lng, dLat, dLng, heading } = v;
    lat += dLat + (Math.random() - 0.5) * 0.00008;   // tiny random wobble
    lng += dLng + (Math.random() - 0.5) * 0.00008;

    // Bounce off edges
    if (lat < BLORE.lat.min || lat > BLORE.lat.max) {
      dLat  = -dLat;
      lat   = clamp(lat, BLORE.lat.min, BLORE.lat.max);
      heading = (360 - heading + 180) % 360;
    }
    if (lng < BLORE.lng.min || lng > BLORE.lng.max) {
      dLng  = -dLng;
      lng   = clamp(lng, BLORE.lng.min, BLORE.lng.max);
      heading = (360 - heading) % 360;
    }

    // Speed fluctuates naturally (traffic simulation)
    const speed = clamp(v.speed + (Math.random() - 0.5) * 6, 20, 90);

    // Battery drains proportionally to speed
    const battery = Math.max(5, v.battery - (speed / 100000));

    // If battery very low → auto-return to charge
    const status = battery < 8 ? 'charging' : v.status;

    return {
      ...v,
      lat, lng, dLat, dLng, heading, speed, battery, status,
      tripDuration:          v.tripDuration + 1 / 60,
      distanceToDestination: Math.max(0, v.distanceToDestination - speed / 36000),
    };
  });
}

// ─── Broadcast ────────────────────────────────────────────────────────────────
function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload, timestamp: Date.now() });
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

// ─── REST API ─────────────────────────────────────────────────────────────────
app.get('/api/fleet',     (_, res) => res.json(fleet));
app.get('/api/incidents', (_, res) => res.json(incidents.slice(-50)));

app.post('/api/takeover/:id', (req, res) => {
  const v = fleet.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  v.status     = 'manual_control';
  v.operator   = req.body.operator || 'OPS-01';
  v.takeoverAt = Date.now();
  v.speed      = 0;
  v.dLat = 0; v.dLng = 0;
  v.alerts = [{ type: 'INFO', msg: `Manual control by ${v.operator}` }];
  const inc = { id: Date.now(), vehicleId: v.id, type: 'TAKEOVER', msg: `${v.carName} taken over by ${v.operator}`, at: new Date().toISOString() };
  incidents.push(inc);
  broadcast('VEHICLE_UPDATE', v);
  broadcast('INCIDENT', inc);
  res.json({ success: true, vehicle: v });
});

app.post('/api/release/:id', (req, res) => {
  const v = fleet.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  const heading = rand(0, 360);
  v.status     = 'autonomous';
  v.operator   = null;
  v.takeoverAt = null;
  v.speed      = randInt(30, 60);
  v.heading    = heading;
  v.dLat       = Math.cos((heading * Math.PI) / 180) * 0.0004;
  v.dLng       = Math.sin((heading * Math.PI) / 180) * 0.0004;
  v.alerts     = [];
  broadcast('VEHICLE_UPDATE', v);
  res.json({ success: true, vehicle: v });
});

app.post('/api/dispatch-cleaning/:id', (req, res) => {
  const v = fleet.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  v.status = 'cleaning'; v.speed = 0; v.dLat = 0; v.dLng = 0; v.passengers = 0;
  broadcast('VEHICLE_UPDATE', v);
  setTimeout(() => {
    const h = rand(0, 360);
    v.status = 'autonomous'; v.cleanlinessScore = 100; v.lastCleaned = new Date().toISOString();
    v.speed = randInt(30, 60); v.heading = h;
    v.dLat = Math.cos((h * Math.PI) / 180) * 0.0004;
    v.dLng = Math.sin((h * Math.PI) / 180) * 0.0004;
    broadcast('VEHICLE_UPDATE', v);
  }, 30000);
  res.json({ success: true, vehicle: v });
});

app.post('/api/recall/:id', (req, res) => {
  const v = fleet.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  v.status = 'charging'; v.speed = 0; v.dLat = 0; v.dLng = 0;
  v.route  = 'Returning to charging hub';
  broadcast('VEHICLE_UPDATE', v);
  res.json({ success: true, vehicle: v });
});

app.post('/api/deploy/:id', (req, res) => {
  const v = fleet.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  if (v.battery < 15) return res.status(400).json({ error: 'Battery too low' });
  const h = rand(0, 360);
  v.status = 'autonomous'; v.route = pick(ROUTES).name; v.alerts = [];
  v.speed = randInt(30, 60); v.heading = h;
  v.dLat = Math.cos((h * Math.PI) / 180) * 0.0004;
  v.dLng = Math.sin((h * Math.PI) / 180) * 0.0004;
  broadcast('VEHICLE_UPDATE', v);
  res.json({ success: true, vehicle: v });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('✅ Client connected');
  ws.send(JSON.stringify({ type: 'FLEET_INIT', payload: fleet, timestamp: Date.now() }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      if (msg.type === 'CONTROL_CMD') {
        const v = fleet.find((x) => x.id === msg.vehicleId);
        if (v && v.status === 'manual_control') {
          if (msg.speed   !== undefined) v.speed   = msg.speed;
          if (msg.heading !== undefined) v.heading = msg.heading;
          broadcast('VEHICLE_UPDATE', v);
        }
      }
    } catch (e) { console.error(e); }
  });

  ws.on('close', () => console.log('❌ Client disconnected'));
});

// 1 Hz telemetry
setInterval(() => { updateFleet(); broadcast('TELEMETRY', fleet); }, 1000);
// Latency ping
setInterval(() => broadcast('LATENCY_PING', { serverTime: Date.now() }), 5000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚗 EV Fleet Backend  →  http://localhost:${PORT}`);
  console.log(`🏙️  Location: Bangalore, India`);
  console.log(`🚘  Fleet: 12 real EV cars, all moving`);
});