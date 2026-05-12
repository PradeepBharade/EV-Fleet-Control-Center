import React, { useState } from 'react';
import { useFleet } from './hooks/useFleet';
import FleetMap from './components/FleetMap';
import FleetList from './components/FleetList';
import VehiclePanel from './components/VehiclePanel';
import CameraGrid from './components/CameraGrid';
import TeleoperationPanel from './components/TeleoperationPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DispatchPanel from './components/DispatchPanel';
import { IncidentLog, LatencyMeter } from './components/Telemetry';
import './App.css';

const TABS = [
  { id: 'map',       label: '🗺  Map' },
  { id: 'cameras',   label: '📷  Cameras' },
  { id: 'teleop',    label: '🕹  Teleop' },
  { id: 'dispatch',  label: '📋  Dispatch' },
  { id: 'analytics', label: '📊  Analytics' },
];

function TopBar({ stats, connected, latency, tick }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 54, borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(6,8,20,0.97)', flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #00cfff 0%, #0044ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            boxShadow: '0 0 16px #00cfff44',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e0eaff', fontFamily: 'monospace', letterSpacing: 1.5 }}>EV FLEET CONTROL</div>
            <div style={{ fontSize: 8, color: '#556677', fontFamily: 'monospace', letterSpacing: 2.5 }}>AUTONOMOUS OPERATIONS CENTER</div>
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', gap: 18 }}>
          {[
            { label: 'Autonomous', value: stats.autonomous, color: '#00ff88' },
            { label: 'Manual',     value: stats.manual,     color: '#ff6b35' },
            { label: 'Alerts',     value: stats.alerts,     color: '#ff2244' },
            { label: 'Charging',   value: stats.charging,   color: '#ffcc00' },
            { label: 'Passengers', value: stats.totalPassengers, color: '#00cfff' },
            { label: 'Avg Battery',value: `${stats.avgBattery}%`, color: '#8899aa' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 7, color: '#445566', textTransform: 'uppercase', letterSpacing: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.color, fontFamily: 'monospace', lineHeight: 1.2 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#445566', fontFamily: 'monospace' }}>
            {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e0eaff', fontFamily: 'monospace' }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
          background: connected ? 'rgba(0,255,136,0.07)' : 'rgba(255,34,68,0.1)',
          border: `1px solid ${connected ? '#00ff8830' : '#ff224430'}`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#00ff88' : '#ff2244',
            boxShadow: `0 0 8px ${connected ? '#00ff88' : '#ff2244'}`,
            animation: connected ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 9, color: connected ? '#00ff88' : '#ff4466', fontFamily: 'monospace', letterSpacing: 1 }}>
            {connected ? `LIVE${latency !== null ? ` · ${latency}ms` : ''}` : 'DISCONNECTED'}
          </span>
        </div>
      </div>
    </header>
  );
}

function TabBar({ activeTab, setActiveTab, alerts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(6,8,20,0.8)', flexShrink: 0,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            position: 'relative',
            background: isActive ? 'rgba(0,207,255,0.12)' : 'transparent',
            border: `1px solid ${isActive ? '#00cfff44' : 'transparent'}`,
            color: isActive ? '#00cfff' : '#556677',
            padding: '6px 18px', borderRadius: 8, fontSize: 11,
            fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.15s',
          }}>
            {tab.label}
            {tab.id === 'map' && alerts > 0 && (
              <div style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: '50%', background: '#ff2244', boxShadow: '0 0 6px #ff2244' }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', ...style,
    }}>
      {title && (
        <div style={{ fontSize: 9, color: '#445566', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 2, height: 9, background: '#00cfff', borderRadius: 1 }} />
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

export default function App() {
  const {
    fleet, incidents, connected, latency,
    selectedVehicle, setSelectedVehicle, stats,
    takeover, release, dispatchCleaning, recall, deploy, sendControlCmd,
  } = useFleet();

  const [activeTab, setActiveTab] = useState('map');
  const [tick, setTick] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const renderCenter = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', height: '100%' }}>
            <FleetMap fleet={fleet} selectedVehicle={selectedVehicle} onSelectVehicle={setSelectedVehicle} />
          </div>
        );
      case 'cameras':
        return (
          <Panel title="Multi-Camera WebRTC Feeds" style={{ height: '100%' }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <CameraGrid vehicle={selectedVehicle} />
            </div>
          </Panel>
        );
      case 'teleop':
        return (
          <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TeleoperationPanel vehicle={selectedVehicle} onControlCmd={sendControlCmd} onRelease={release} />
            {selectedVehicle && (
              <Panel title="Sensor Array">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {Object.entries(selectedVehicle.sensors || {}).map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: '#445566', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{k}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: v === 'OK' ? '#00ff88' : v === 'DEGRADED' ? '#ffcc00' : '#ff2244' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        );
      case 'dispatch':
        return (
          <Panel title="Ride Dispatch & Job Scheduler" style={{ height: '100%' }}>
            <DispatchPanel fleet={fleet} onDeploy={deploy} />
          </Panel>
        );
      case 'analytics':
        return (
          <div style={{ height: '100%', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <AnalyticsDashboard fleet={fleet} incidents={incidents} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#060812', color: '#e0eaff', overflow: 'hidden' }}>
      <TopBar stats={stats} connected={connected} latency={latency} tick={tick} />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} alerts={stats.alerts} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '270px 1fr 285px', gap: 10, padding: 10, minHeight: 0 }}>
        {/* LEFT: Fleet list */}
        <Panel title={`Fleet · ${fleet.length} Vehicles`}>
          <FleetList fleet={fleet} selectedVehicle={selectedVehicle} onSelect={setSelectedVehicle} />
        </Panel>

        {/* CENTER */}
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          {renderCenter()}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <Panel title={selectedVehicle ? `${selectedVehicle.id} · Details` : 'Vehicle Details'} style={{ flex: 1 }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <VehiclePanel vehicle={selectedVehicle} onTakeover={takeover} onRelease={release} onClean={dispatchCleaning} onRecall={recall} onDeploy={deploy} />
            </div>
          </Panel>
          <Panel title="Incident Log" style={{ height: 185, flexShrink: 0 }}>
            <IncidentLog incidents={incidents} />
          </Panel>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,8,20,0.9)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Avg Battery', value: `${stats.avgBattery}%` },
            { label: 'Pax', value: stats.totalPassengers },
            { label: 'Incidents', value: incidents.length },
          ].map(m => (
            <span key={m.label} style={{ fontSize: 9, color: '#445566', fontFamily: 'monospace' }}>
              {m.label}: <span style={{ color: '#8899aa' }}>{m.value}</span>
            </span>
          ))}
        </div>
        <div style={{ width: 260 }}>
          <LatencyMeter latency={latency} connected={connected} />
        </div>
        <span style={{ fontSize: 9, color: '#334455', fontFamily: 'monospace' }}>EV Fleet Control v2.0</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.09); border-radius: 2px; }
        * { box-sizing: border-box; }
        button:hover:not(:disabled) { filter: brightness(1.15); }
      `}</style>
    </div>
  );
}