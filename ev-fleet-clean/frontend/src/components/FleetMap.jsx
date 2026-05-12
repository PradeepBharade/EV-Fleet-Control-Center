/**
 * FleetMap.jsx
 * Leaflet dark map centred on Bangalore, India.
 * Each vehicle marker shows the car brand logo / image.
 * All cars move continuously — markers update every second.
 */
import React, { useEffect, useRef } from 'react';
import { STATUS_CONFIG as STATUS_CFG } from './UIKit';

// Brand colours for SVG ring when image unavailable
const BRAND_COLOR = {
  Tesla:    '#E31937',
  BMW:      '#1C69D4',
  Mercedes: '#A0A0A0',
  Audi:     '#BB0A21',
  Hyundai:  '#00AAD2',
  Tata:     '#003087',
  MG:       '#B5121B',
  Kia:      '#05141F',
  Volvo:    '#003F87',
};

export default function FleetMap({ fleet, selectedVehicle, onSelectVehicle }) {
  const mapRef         = useRef(null);
  const instanceRef    = useRef(null);  // { map, L }
  const markersRef     = useRef({});    // id → { marker, trail }
  const trailsRef      = useRef({});    // id → array of [lat,lng]

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;

      // Centre = Bangalore city centre (MG Road area)
      const map = L.map(mapRef.current, {
        center:      [12.9716, 77.5946],
        zoom:        12,
        zoomControl: false,
      });

      // Dark tile layer (CartoDB)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap ©CartoDB | Bangalore EV Fleet',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Bangalore label
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

      instanceRef.current = { map, L };
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.map.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  // ── Update markers every telemetry tick ───────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !fleet.length) return;
    const { map, L } = instanceRef.current;

    fleet.forEach((v) => {
      const cfg        = STATUS_CFG[v.status] || STATUS_CFG.idle;
      const isSelected = selectedVehicle?.id === v.id;
      const moving     = v.status === 'autonomous' || v.status === 'manual_control';

      // ── Build car marker HTML ──────────────────────────────────────────────
      const size  = isSelected ? 52 : 42;
      const ring  = isSelected ? 3  : 2;
      const imgSrc = v.image || '';
      const bc    = BRAND_COLOR[v.brand] || cfg.color;

      const html = `
        <div style="
          width:${size}px; height:${size}px; border-radius:50%;
          border: ${ring}px solid ${cfg.color};
          box-shadow: 0 0 ${isSelected ? 14 : 8}px ${cfg.color}88;
          overflow:hidden; background:#1a1a2e; position:relative;
          transition: all 0.4s ease;
        ">
          ${imgSrc
            ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.3}px;font-weight:700;color:${bc};font-family:monospace">${v.brand.slice(0,2).toUpperCase()}</div>`
          }
          ${moving ? `<div style="position:absolute;bottom:2px;right:2px;width:8px;height:8px;border-radius:50%;background:${cfg.color};animation:pulse 1s infinite"></div>` : ''}
        </div>
        <div style="
          text-align:center; font-size:9px; color:${cfg.color};
          font-family:monospace; margin-top:2px; font-weight:600;
          text-shadow:0 0 6px ${cfg.color}88; white-space:nowrap;
        ">${v.brand}</div>
      `;

      const icon = L.divIcon({
        html,
        className: '',
        iconSize:   [size, size + 16],
        iconAnchor: [size / 2, size / 2],
      });

      const pos = [v.lat, v.lng];

      if (markersRef.current[v.id]) {
        // Smooth marker pan instead of teleport
        markersRef.current[v.id].setLatLng(pos).setIcon(icon);
      } else {
        const marker = L.marker(pos, { icon, zIndexOffset: isSelected ? 1000 : 0 })
          .addTo(map)
          .on('click', () => onSelectVehicle(v));
        markersRef.current[v.id] = marker;
      }

      // ── Tooltip ──────────────────────────────────────────────────────────
      markersRef.current[v.id].bindTooltip(`
        <div style="font-family:monospace;font-size:11px">
          <b>${v.carName}</b><br/>
          ${v.id} · ${cfg.label}<br/>
          🚀 ${Math.round(v.speed)} km/h · 🔋 ${Math.round(v.battery)}%
        </div>
      `, { className: 'blr-tooltip', direction: 'top', offset: [0, -size / 2 - 4] });

      // ── Moving trail (breadcrumb polyline) ────────────────────────────────
      if (moving) {
        if (!trailsRef.current[v.id]) trailsRef.current[v.id] = [];
        const trail = trailsRef.current[v.id];
        trail.push(pos);
        if (trail.length > 20) trail.shift(); // keep last 20 points

        // Remove old polyline if exists
        if (markersRef.current[`${v.id}_trail`]) {
          map.removeLayer(markersRef.current[`${v.id}_trail`]);
        }
        // Draw new trail
        const poly = L.polyline(trail, {
          color:     cfg.color,
          weight:    isSelected ? 3 : 1.5,
          opacity:   isSelected ? 0.7 : 0.35,
          dashArray: '4 4',
        }).addTo(map);
        markersRef.current[`${v.id}_trail`] = poly;
      }
    });
  }, [fleet, selectedVehicle, onSelectVehicle]);

  return (
    <div style={{ position:'relative', height:'100%', borderRadius:12, overflow:'hidden' }}>
      <div ref={mapRef} style={{ height:'100%', width:'100%' }} />

      {/* Bangalore label overlay */}
      <div style={{ position:'absolute', top:10, left:10, zIndex:999,
        background:'rgba(6,8,20,0.85)', borderRadius:8, padding:'6px 12px',
        border:'1px solid rgba(0,207,255,0.3)', backdropFilter:'blur(8px)' }}>
        <div style={{ fontSize:10, color:'#00cfff', fontFamily:'monospace', letterSpacing:1.5 }}>
          📍 BANGALORE, INDIA
        </div>
        <div style={{ fontSize:9, color:'#556677', fontFamily:'monospace' }}>
          12 EVs · Live tracking
        </div>
      </div>

      <style>{`
        .leaflet-container { background: #0a0e1a; font-family: monospace; }
        .blr-tooltip {
          background: #0f1525; border: 1px solid #1e3a5f;
          color: #e0eaff; padding: 6px 10px; border-radius: 6px;
        }
        .blr-tooltip::before { display: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}