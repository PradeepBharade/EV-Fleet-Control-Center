import React, { useState, useEffect, useRef } from 'react';

export function IncidentLog({ incidents }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [incidents.length]);

  const typeColor = { TAKEOVER: '#ff6b35', INFO: '#00cfff', ALERT: '#ffcc00', CRITICAL: '#ff2244' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 10, color: '#556677', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
        Incident Log ({incidents.length})
      </div>
      <div ref={logRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {incidents.length === 0 && (
          <div style={{ color: '#3a4a6a', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginTop: 20 }}>
            No incidents recorded
          </div>
        )}
        {incidents.map((inc, i) => (
          <div key={inc.id || i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{
              fontSize: 9, color: typeColor[inc.type] || '#8899aa',
              fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5,
              minWidth: 55, marginTop: 1,
            }}>{inc.type}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#c0d0e8', fontFamily: 'monospace' }}>{inc.vehicleId}</div>
              <div style={{ fontSize: 10, color: '#556677' }}>{inc.msg}</div>
            </div>
            <span style={{ fontSize: 9, color: '#3a4a6a', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {new Date(inc.at).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LatencyMeter({ latency, connected }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (latency !== null) {
      setHistory(prev => [...prev.slice(-29), latency]);
    }
  }, [latency]);

  const max = Math.max(...history, 200);
  const color = !connected ? '#ff2244' : latency < 50 ? '#00ff88' : latency < 150 ? '#ffcc00' : '#ff6b35';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: '#556677', textTransform: 'uppercase', letterSpacing: 1.5 }}>Network Latency</span>
        <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {connected ? (latency !== null ? `${latency}ms` : '—') : 'OFFLINE'}
        </span>
      </div>
      {/* Spark chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 30 }}>
        {Array.from({ length: 30 }, (_, i) => {
          const val = history[i] ?? 0;
          const h = val > 0 ? Math.max(2, (val / max) * 30) : 2;
          const c = val < 50 ? '#00ff88' : val < 150 ? '#ffcc00' : '#ff6b35';
          return <div key={i} style={{ flex: 1, height: h, background: c, borderRadius: 1, opacity: 0.7 }} />;
        })}
      </div>
    </div>
  );
}

export function FleetSparklines({ fleet }) {
  const speeds = fleet.filter(v => v.status === 'autonomous').map(v => v.speed);
  const avg = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {fleet.slice(0, 6).map(v => (
        <div key={v.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 8, color: '#556677', fontFamily: 'monospace' }}>{v.id}</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{
              width: `${v.battery}%`, height: '100%',
              background: v.battery > 50 ? '#00ff88' : v.battery > 20 ? '#ffcc00' : '#ff2244',
              borderRadius: 2, transition: 'width 1s',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}