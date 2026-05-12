import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = 'http://localhost:4000/api';
const WS_URL = 'ws://localhost:4000';

export function useFleet() {
  const [fleet, setFleet] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const wsRef = useRef(null);
  const pingRef = useRef(null);

  const updateVehicle = useCallback((updated) => {
    setFleet(prev => prev.map(v => v.id === updated.id ? updated : v));
    setSelectedVehicle(prev => prev?.id === updated.id ? updated : prev);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      pingRef.current = setInterval(() => {
        const t = Date.now();
        ws.send(JSON.stringify({ type: 'PING' }));
        ws._pingTime = t;
      }, 2000);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'FLEET_INIT':
          setFleet(msg.payload);
          break;
        case 'TELEMETRY':
          setFleet(msg.payload);
          break;
        case 'VEHICLE_UPDATE':
          updateVehicle(msg.payload);
          break;
        case 'INCIDENT':
          setIncidents(prev => [msg.payload, ...prev].slice(0, 50));
          break;
        case 'PONG':
          setLatency(Date.now() - ws._pingTime);
          break;
        case 'LATENCY_PING':
          setLatency(Date.now() - msg.payload.serverTime);
          break;
        default: break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      clearInterval(pingRef.current);
    };

    fetch(`${API_BASE}/incidents`)
      .then(r => r.json())
      .then(setIncidents)
      .catch(console.error);

    return () => {
      clearInterval(pingRef.current);
      ws.close();
    };
  }, [updateVehicle]);

  const takeover = useCallback(async (vehicleId, operator = 'OPS-01') => {
    const res = await fetch(`${API_BASE}/takeover/${vehicleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    const data = await res.json();
    if (data.success) updateVehicle(data.vehicle);
    return data;
  }, [updateVehicle]);

  const release = useCallback(async (vehicleId) => {
    const res = await fetch(`${API_BASE}/release/${vehicleId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) updateVehicle(data.vehicle);
    return data;
  }, [updateVehicle]);

  const dispatchCleaning = useCallback(async (vehicleId) => {
    const res = await fetch(`${API_BASE}/dispatch-cleaning/${vehicleId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) updateVehicle(data.vehicle);
    return data;
  }, [updateVehicle]);

  const recall = useCallback(async (vehicleId) => {
    const res = await fetch(`${API_BASE}/recall/${vehicleId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) updateVehicle(data.vehicle);
    return data;
  }, [updateVehicle]);

  const deploy = useCallback(async (vehicleId) => {
    const res = await fetch(`${API_BASE}/deploy/${vehicleId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) updateVehicle(data.vehicle);
    return data;
  }, [updateVehicle]);

  const sendControlCmd = useCallback((vehicleId, cmd) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CONTROL_CMD', vehicleId, ...cmd }));
    }
  }, []);

  const stats = {
    total: fleet.length,
    autonomous: fleet.filter(v => v.status === 'autonomous').length,
    manual: fleet.filter(v => v.status === 'manual_control').length,
    charging: fleet.filter(v => v.status === 'charging').length,
    cleaning: fleet.filter(v => v.status === 'cleaning').length,
    idle: fleet.filter(v => v.status === 'idle').length,
    alerts: fleet.filter(v => v.alerts?.length > 0).length,
    avgBattery: fleet.length ? Math.round(fleet.reduce((s, v) => s + v.battery, 0) / fleet.length) : 0,
    totalPassengers: fleet.reduce((s, v) => s + (v.passengers || 0), 0),
  };

  return {
    fleet, incidents, connected, latency, selectedVehicle,
    setSelectedVehicle, stats,
    takeover, release, dispatchCleaning, recall, deploy, sendControlCmd,
  };
}