/**
 * VehiclePanel.jsx
 * Right-side detail panel. Shows a large car image + full telemetry.
 */
import React, { useState } from 'react';
import { StatusBadge, BatteryBar } from './UIKit';

export default function VehiclePanel({ vehicle, onTakeover, onRelease, onClean, onRecall, onDeploy }) {
  const [loading, setLoading] = useState(null);

  if (!vehicle) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      height:'100%', gap:12, color:'#3a4a6a', fontFamily:'monospace' }}>
      <div style={{ fontSize:32 }}>🚗</div>
      <div style={{ fontSize:12 }}>Select a vehicle</div>
    </div>
  );

  async function handle(action, fn) { setLoading(action); await fn(); setLoading(null); }

  const btn = (label, action, fn, color='#00cfff', disabled=false) => (
    <button onClick={() => handle(action, fn)} disabled={!!loading || disabled} style={{
      background: disabled ? 'rgba(255,255,255,0.03)' : `${color}18`,
      border:     `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : `${color}44`}`,
      color:      disabled ? '#3a4a6a' : color,
      padding:'8px 14px', borderRadius:8, fontSize:11, fontFamily:'monospace',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      flex:1, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase',
    }}>{loading === action ? '…' : label}</button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, height:'100%', overflowY:'auto', paddingRight:2 }}>

      {/* ── Car image hero ── */}
      <div style={{ position:'relative', borderRadius:12, overflow:'hidden',
        border:`1px solid ${vehicle.carColor || 'rgba(255,255,255,0.1)'}44`,
        height:140, background:'#0d1020', flexShrink:0 }}>
        <img
          src={vehicle.image}
          alt={vehicle.carName}
          style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.9 }}
          onError={(e) => { e.target.style.display='none'; }}
        />
        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(6,8,18,0.9) 0%, transparent 60%)' }} />
        {/* Car name on image */}
        <div style={{ position:'absolute', bottom:10, left:12 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'monospace',
            textShadow:'0 2px 8px rgba(0,0,0,0.8)' }}>
            {vehicle.brand}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontFamily:'monospace' }}>
            {vehicle.model}
          </div>
        </div>
        {/* ID badge */}
        <div style={{ position:'absolute', top:10, right:10,
          background:'rgba(0,0,0,0.7)', borderRadius:6, padding:'3px 8px',
          fontSize:10, color:'#00cfff', fontFamily:'monospace', fontWeight:700,
          border:'1px solid rgba(0,207,255,0.3)' }}>
          {vehicle.id}
        </div>
      </div>

      {/* ── Status + trips ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <StatusBadge status={vehicle.status} />
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'#556677' }}>Total Trips</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#00cfff', fontFamily:'monospace' }}>{vehicle.totalTrips}</div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {vehicle.alerts?.map((a, i) => (
        <div key={i} style={{
          background: a.type==='CRITICAL' ? 'rgba(255,34,68,0.12)' : 'rgba(0,207,255,0.08)',
          border:`1px solid ${a.type==='CRITICAL' ? '#ff224466' : '#00cfff44'}`,
          borderRadius:8, padding:'8px 12px', fontSize:11, fontFamily:'monospace',
          color: a.type==='CRITICAL' ? '#ff6680' : '#00cfff',
          display:'flex', alignItems:'center', gap:8,
        }}>
          {a.type==='CRITICAL' ? '⚠' : 'ℹ'} {a.msg}
        </div>
      ))}

      {/* ── Telemetry grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Speed',      value:`${Math.round(vehicle.speed)}`, unit:'km/h', color:'#00ff88' },
          { label:'Passengers', value:vehicle.passengers,              unit:'pax',  color:'#00cfff' },
          { label:'Heading',    value:`${Math.round(vehicle.heading)}°`,unit:'',    color:'#ffcc00' },
          { label:'Range',      value:vehicle.rangeKm,                 unit:'km',   color:'#8899aa' },
        ].map((m) => (
          <div key={m.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:9, color:'#556677', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:m.color, fontFamily:'monospace' }}>
              {m.value}<span style={{ fontSize:10, color:'#556677', marginLeft:3 }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Battery ── */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
        <div style={{ fontSize:9, color:'#556677', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Battery</div>
        <BatteryBar value={vehicle.battery} />
      </div>

      {/* ── Route ── */}
      {vehicle.route && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
          <div style={{ fontSize:9, color:'#556677', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Current Route</div>
          <div style={{ fontSize:11, color:'#e0eaff', fontFamily:'monospace' }}>📍 {vehicle.route}</div>
          {vehicle.distanceToDestination > 0 && (
            <div style={{ fontSize:10, color:'#8899aa', marginTop:4 }}>{vehicle.distanceToDestination.toFixed(1)} km remaining</div>
          )}
        </div>
      )}

      {/* ── Sensors ── */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
        <div style={{ fontSize:9, color:'#556677', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Sensors</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {Object.entries(vehicle.sensors || {}).map(([k, val]) => {
            const c = val==='OK' ? '#00ff88' : val==='DEGRADED' ? '#ffcc00' : '#ff2244';
            return (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:c, boxShadow:`0 0 5px ${c}` }} />
                <span style={{ fontSize:10, color:'#8899aa', fontFamily:'monospace', textTransform:'uppercase' }}>{k}</span>
                <span style={{ fontSize:9, color:c, marginLeft:'auto' }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:'auto' }}>
        <div style={{ fontSize:9, color:'#556677', textTransform:'uppercase', letterSpacing:1.5 }}>Controls</div>
        <div style={{ display:'flex', gap:8 }}>
          {vehicle.status === 'manual_control'
            ? btn('↩ Release Auto', 'release',  () => onRelease(vehicle.id), '#00ff88')
            : btn('⚡ Takeover',    'takeover', () => onTakeover(vehicle.id), '#ff6b35')}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {btn('🧹 Clean', 'clean', () => onClean(vehicle.id), '#00cfff', vehicle.status==='cleaning')}
          {vehicle.status === 'charging'
            ? btn('🚀 Deploy', 'deploy', () => onDeploy(vehicle.id), '#00ff88', vehicle.battery < 15)
            : btn('🔋 Recall', 'recall', () => onRecall(vehicle.id), '#ffcc00', ['cleaning'].includes(vehicle.status))}
        </div>
      </div>

      {vehicle.operator && (
        <div style={{ fontSize:10, color:'#556677', fontFamily:'monospace', textAlign:'center' }}>
          Operator: {vehicle.operator}
        </div>
      )}
    </div>
  );
}