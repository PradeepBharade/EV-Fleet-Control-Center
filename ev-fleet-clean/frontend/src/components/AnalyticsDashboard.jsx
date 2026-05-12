import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const COLORS = {
  autonomous: '#00ff88',
  manual_control: '#ff6b35',
  takeover_needed: '#ff2244',
  charging: '#ffcc00',
  cleaning: '#00cfff',
  idle: '#556677',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1525', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
      {label && <div style={{ fontSize: 10, color: '#556677', marginBottom: 4, fontFamily: 'monospace' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color || '#e0eaff', fontFamily: 'monospace' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, children, span = 1 }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '14px 16px',
      gridColumn: span > 1 ? `span ${span}` : undefined,
    }}>
      <div style={{ fontSize: 10, color: '#556677', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 2, height: 10, background: '#00cfff', borderRadius: 1 }} />
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsDashboard({ fleet, incidents }) {
  const [history, setHistory] = useState([]);
  const [tripData] = useState(() => Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    trips: Math.floor(20 + Math.sin(h / 3) * 15 + Math.random() * 8),
    revenue: Math.floor(180 + Math.sin(h / 3) * 120 + Math.random() * 60),
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const autonomous = fleet.filter(v => v.status === 'autonomous').length;
      const avgSpeed = fleet.filter(v => v.status === 'autonomous').reduce((s, v) => s + v.speed, 0) / (autonomous || 1);
      const avgBattery = fleet.reduce((s, v) => s + v.battery, 0) / (fleet.length || 1);

      setHistory(prev => [...prev.slice(-59), { time: now, autonomous, avgSpeed: Math.round(avgSpeed), avgBattery: Math.round(avgBattery) }]);
    }, 1000);
    return () => clearInterval(interval);
  }, [fleet]);

  // Status distribution
  const statusDist = Object.entries(
    fleet.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count, label: status.replace('_', ' ') }));

  // Battery distribution buckets
  const batteryBuckets = [
    { range: '0–25%', count: fleet.filter(v => v.battery <= 25).length, color: '#ff2244' },
    { range: '25–50%', count: fleet.filter(v => v.battery > 25 && v.battery <= 50).length, color: '#ff6b35' },
    { range: '50–75%', count: fleet.filter(v => v.battery > 50 && v.battery <= 75).length, color: '#ffcc00' },
    { range: '75–100%', count: fleet.filter(v => v.battery > 75).length, color: '#00ff88' },
  ];

  // Top vehicles by trips
  const topVehicles = [...fleet].sort((a, b) => b.totalTrips - a.totalTrips).slice(0, 6);

  // Incident type breakdown
  const incidentTypes = incidents.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      padding: 16,
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Fleet status pie */}
      <ChartCard title="Fleet Status Distribution">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={statusDist} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3}>
              {statusDist.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.status] || '#556677'} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {statusDist.map(d => (
            <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[d.status] || '#556677' }} />
              <span style={{ fontSize: 9, color: '#8899aa', fontFamily: 'monospace', textTransform: 'uppercase' }}>{d.label} ({d.count})</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Live telemetry */}
      <ChartCard title="Live Fleet Telemetry" span={2}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#556677', fontFamily: 'monospace' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 8, fill: '#556677', fontFamily: 'monospace' }} width={25} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="avgSpeed" stroke="#00cfff" dot={false} strokeWidth={1.5} name="Avg Speed" />
            <Line type="monotone" dataKey="avgBattery" stroke="#00ff88" dot={false} strokeWidth={1.5} name="Avg Battery" />
            <Line type="monotone" dataKey="autonomous" stroke="#ff6b35" dot={false} strokeWidth={1.5} name="Active Vehicles" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 24h trips & revenue */}
      <ChartCard title="24h Trip Volume & Revenue" span={2}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={tripData}>
            <defs>
              <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00cfff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00cfff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#556677', fontFamily: 'monospace' }} interval={3} />
            <YAxis tick={{ fontSize: 8, fill: '#556677', fontFamily: 'monospace' }} width={25} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="trips" stroke="#00cfff" fill="url(#tripsGrad)" strokeWidth={1.5} name="Trips" />
            <Area type="monotone" dataKey="revenue" stroke="#00ff88" fill="url(#revGrad)" strokeWidth={1.5} name="Revenue $" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Battery buckets */}
      <ChartCard title="Battery Distribution">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          {batteryBuckets.map(b => (
            <div key={b.range} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, color: '#8899aa', fontFamily: 'monospace', minWidth: 55 }}>{b.range}</span>
              <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${(b.count / fleet.length) * 100}%`,
                  height: '100%', background: b.color, borderRadius: 4,
                  display: 'flex', alignItems: 'center', paddingLeft: 6, transition: 'width 0.5s',
                }}>
                  <span style={{ fontSize: 8, color: '#000', fontWeight: 700 }}>{b.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Top vehicles */}
      <ChartCard title="Top Vehicles by Trips">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={topVehicles} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 8, fill: '#556677', fontFamily: 'monospace' }} />
            <YAxis dataKey="id" type="category" tick={{ fontSize: 9, fill: '#8899aa', fontFamily: 'monospace' }} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalTrips" fill="#00cfff" radius={[0, 3, 3, 0]} name="Total Trips" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* KPI summary */}
      <ChartCard title="Performance KPIs" span={2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Fleet Utilization', value: `${Math.round((fleet.filter(v => v.status === 'autonomous').length / fleet.length) * 100)}%`, color: '#00ff88', sub: 'vehicles on road' },
            { label: 'Total Trips Today', value: tripData.reduce((s, d) => s + d.trips, 0), color: '#00cfff', sub: 'all routes' },
            { label: 'Revenue Today', value: `$${(tripData.reduce((s, d) => s + d.revenue, 0) / 1000).toFixed(1)}k`, color: '#ffcc00', sub: 'gross' },
            { label: 'Incidents Today', value: incidents.length, color: incidents.length > 5 ? '#ff2244' : '#ff6b35', sub: 'all types' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#556677', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: 'monospace', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: '#3a4a6a', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}