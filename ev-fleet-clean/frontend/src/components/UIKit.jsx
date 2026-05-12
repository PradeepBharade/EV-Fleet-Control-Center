import React from 'react';

export const STATUS_CONFIG = {
  autonomous:     { label: 'Autonomous',     color: '#00ff88', bg: 'rgba(0,255,136,0.12)', dot: '#00ff88' },
  manual_control: { label: 'Manual Control', color: '#ff6b35', bg: 'rgba(255,107,53,0.15)', dot: '#ff6b35' },
  takeover_needed:{ label: 'Takeover Needed',color: '#ff2244', bg: 'rgba(255,34,68,0.18)',  dot: '#ff2244' },
  charging:       { label: 'Charging',       color: '#ffcc00', bg: 'rgba(255,204,0,0.12)',  dot: '#ffcc00' },
  cleaning:       { label: 'Cleaning',       color: '#00cfff', bg: 'rgba(0,207,255,0.12)',  dot: '#00cfff' },
  idle:           { label: 'Idle',           color: '#8899aa', bg: 'rgba(136,153,170,0.12)',dot: '#8899aa' },
};

export function StatusBadge({ status, small }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: small ? 4 : 6,
      padding: small ? '2px 8px' : '4px 10px',
      borderRadius: 20, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: 1,
      color: cfg.color, textTransform: 'uppercase', fontFamily: 'monospace',
    }}>
      <span style={{
        width: small ? 5 : 6, height: small ? 5 : 6,
        borderRadius: '50%', background: cfg.dot,
        boxShadow: `0 0 6px ${cfg.dot}`,
        animation: ['autonomous', 'manual_control', 'takeover_needed'].includes(status) ? 'pulse 1.5s infinite' : 'none',
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

export function BatteryBar({ value }) {
  const color = value > 60 ? '#00ff88' : value > 30 ? '#ffcc00' : '#ff2244';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: 'monospace', minWidth: 32 }}>{Math.round(value)}%</span>
    </div>
  );
}

export function SensorDot({ status }) {
  const color = status === 'OK' ? '#00ff88' : status === 'DEGRADED' ? '#ffcc00' : '#ff2244';
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, boxShadow: `0 0 5px ${color}`,
      title: status,
    }} />
  );
}

export function MetricCard({ label, value, unit, color, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 10, color: '#8899aa', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#e0eaff', fontFamily: 'monospace', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 12, color: '#8899aa', marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}