/**
 * FleetList.jsx
 * Left sidebar with real car images, brand names and live stats.
 */
import React, { useState } from 'react';
import { StatusBadge, BatteryBar, STATUS_CONFIG as STATUS_CFG } from './UIKit';

export default function FleetList({ fleet, selectedVehicle, onSelect }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = fleet.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = v.carName.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:10 }}>
      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search brand, model, ID…"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:8, padding:'7px 12px', color:'#e0eaff', fontSize:11, fontFamily:'monospace', width:'100%' }}
      />

      {/* Filter pills */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {['all','autonomous','charging','takeover_needed','manual_control'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'rgba(0,207,255,0.15)' : 'rgba(255,255,255,0.03)',
            border:     `1px solid ${filter === f ? '#00cfff55' : 'rgba(255,255,255,0.07)'}`,
            color:      filter === f ? '#00cfff' : '#556677',
            fontSize: 9, padding:'3px 8px', borderRadius:12, cursor:'pointer',
            fontFamily:'monospace', textTransform:'uppercase',
          }}>{f.replace(/_/g,' ')}</button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize:10, color:'#556677', fontFamily:'monospace' }}>
        {filtered.length} of {fleet.length} vehicles
      </div>

      {/* Car cards */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map((v) => {
          const cfg        = STATUS_CFG[v.status] || STATUS_CFG.idle;
          const isSelected = selectedVehicle?.id === v.id;
          const hasCritical= v.alerts?.some((a) => a.type === 'CRITICAL');
          const isMoving   = v.status === 'autonomous' || v.status === 'manual_control';

          return (
            <div key={v.id} className="car-card" onClick={() => onSelect(v)} style={{
              background: isSelected ? 'rgba(0,207,255,0.08)' : hasCritical ? 'rgba(255,34,68,0.06)' : 'rgba(255,255,255,0.025)',
              border:     `1px solid ${isSelected ? '#00cfff44' : hasCritical ? '#ff224433' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:12, padding:'10px 12px', cursor:'pointer', transition:'all 0.15s',
            }}>
              {/* Top row: image + info */}
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                {/* Car image */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{ width:48, height:36, borderRadius:8, overflow:'hidden',
                    border:`2px solid ${cfg.color}44`, background:'#1a1a2e' }}>
                    <img
                      src={v.image}
                      alt={v.carName}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={(e) => { e.target.style.display='none'; }}
                    />
                  </div>
                  {/* Moving indicator dot */}
                  {isMoving && (
                    <div style={{ position:'absolute', bottom:-2, right:-2,
                      width:10, height:10, borderRadius:'50%',
                      background: cfg.color, border:'1px solid #060812',
                      animation:'pulse 1.2s infinite' }} />
                  )}
                </div>

                {/* Brand & model */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#e0eaff', fontFamily:'monospace',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.brand}
                      {hasCritical && <span style={{ marginLeft:4, fontSize:10, color:'#ff2244' }}>⚠</span>}
                    </span>
                    <StatusBadge status={v.status} small />
                  </div>
                  <div style={{ fontSize:10, color:'#8899aa', fontFamily:'monospace', marginTop:1 }}>
                    {v.model} · {v.id}
                  </div>
                </div>
              </div>

              {/* Battery bar */}
              <BatteryBar value={v.battery} />

              {/* Bottom row: speed + passengers */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6,
                fontSize:10, color:'#556677', fontFamily:'monospace' }}>
                <span>🚀 {Math.round(v.speed)} km/h</span>
                <span>👤 {v.passengers} pax</span>
                <span style={{ color:'#445566' }}>{v.route ? v.route.split('→')[0].trim() : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}