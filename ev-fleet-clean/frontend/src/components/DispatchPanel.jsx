import React, { useState, useEffect } from 'react';

const ZONES = ['Downtown', 'SoMa', 'Mission', 'Marina', 'Sunset', 'Richmond', 'Haight', 'Noe Valley'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_COLORS = { low: '#8899aa', medium: '#ffcc00', high: '#ff6b35', critical: '#ff2244' };

function DispatchCard({ job, onAssign, fleet }) {
  const [expanded, setExpanded] = useState(false);
  const idle = fleet.filter(v => v.status === 'idle' && v.battery > 20);
  const c = PRIORITY_COLORS[job.priority];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)', border: `1px solid ${c}33`,
      borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
      transition: 'all 0.15s',
    }} onClick={() => setExpanded(e => !e)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e0eaff', fontFamily: 'monospace' }}>{job.id}</span>
          <span style={{ fontSize: 9, color: c, textTransform: 'uppercase', letterSpacing: 1 }}>{job.priority}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {job.assignedTo ? (
            <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}>→ {job.assignedTo}</span>
          ) : (
            <span style={{ fontSize: 10, color: '#556677', fontFamily: 'monospace' }}>Unassigned</span>
          )}
          <span style={{ fontSize: 10, color: '#3a4a6a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#8899aa', marginTop: 4, fontFamily: 'monospace' }}>
        {job.from} → {job.to} · {job.passengers} pax · ETA {job.eta}min
      </div>

      {expanded && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: '#556677', marginBottom: 8 }}>{job.notes}</div>
          {!job.assignedTo && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {idle.length === 0
                ? <span style={{ fontSize: 10, color: '#3a4a6a', fontFamily: 'monospace' }}>No idle vehicles available</span>
                : idle.map(v => (
                  <button key={v.id} onClick={(e) => { e.stopPropagation(); onAssign(job.id, v.id); }} style={{
                    background: 'rgba(0,207,255,0.1)', border: '1px solid #00cfff44',
                    color: '#00cfff', padding: '4px 10px', borderRadius: 6,
                    fontSize: 10, fontFamily: 'monospace', cursor: 'pointer',
                  }}>
                    Assign {v.id} (🔋{Math.round(v.battery)}%)
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DispatchPanel({ fleet, onDeploy }) {
  const [jobs, setJobs] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => ({
      id: `JOB-${String(i + 1).padStart(3, '0')}`,
      from: ZONES[i % ZONES.length],
      to: ZONES[(i + 3) % ZONES.length],
      passengers: Math.floor(Math.random() * 3) + 1,
      priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      eta: Math.floor(Math.random() * 20) + 3,
      assignedTo: null,
      notes: `Ride request from ${ZONES[i % ZONES.length]} · ${Math.floor(Math.random() * 5) + 1}km`,
      createdAt: new Date(now - Math.random() * 3600000).toISOString(),
    }));
  });

  const [autoDispatch, setAutoDispatch] = useState(true);
  const [log, setLog] = useState([]);

  // Auto-dispatch critical jobs
  useEffect(() => {
    if (!autoDispatch) return;
    const interval = setInterval(() => {
      setJobs(prev => {
        const unassigned = prev.filter(j => !j.assignedTo && (j.priority === 'critical' || j.priority === 'high'));
        if (!unassigned.length) return prev;
        const idleVehicles = fleet.filter(v => v.status === 'idle' && v.battery > 20);
        if (!idleVehicles.length) return prev;
        const job = unassigned[0];
        const vehicle = idleVehicles[0];
        setLog(l => [{ msg: `Auto-dispatched ${vehicle.id} for ${job.id}`, at: new Date().toLocaleTimeString(), color: '#00ff88' }, ...l.slice(0, 9)]);
        onDeploy(vehicle.id);
        return prev.map(j => j.id === job.id ? { ...j, assignedTo: vehicle.id } : j);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [autoDispatch, fleet, onDeploy]);

  function assignJob(jobId, vehicleId) {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTo: vehicleId } : j));
    onDeploy(vehicleId);
    setLog(l => [{ msg: `Manually assigned ${vehicleId} → ${jobId}`, at: new Date().toLocaleTimeString(), color: '#00cfff' }, ...l.slice(0, 9)]);
  }

  function addJob() {
    const from = ZONES[Math.floor(Math.random() * ZONES.length)];
    const to = ZONES[Math.floor(Math.random() * ZONES.length)];
    setJobs(prev => [{
      id: `JOB-${String(prev.length + 1).padStart(3, '0')}`,
      from, to,
      passengers: Math.floor(Math.random() * 3) + 1,
      priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      eta: Math.floor(Math.random() * 20) + 3,
      assignedTo: null,
      notes: `New ride request from ${from}`,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }

  const unassigned = jobs.filter(j => !j.assignedTo).length;
  const assigned = jobs.filter(j => !!j.assignedTo).length;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12 }}>
      {/* Jobs list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#ff6b35', fontFamily: 'monospace' }}>{unassigned} pending</span>
            <span style={{ fontSize: 11, color: '#00ff88', fontFamily: 'monospace' }}>{assigned} assigned</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setAutoDispatch(a => !a)} style={{
              background: autoDispatch ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${autoDispatch ? '#00ff8844' : 'rgba(255,255,255,0.08)'}`,
              color: autoDispatch ? '#00ff88' : '#556677',
              padding: '4px 10px', borderRadius: 6, fontSize: 9, fontFamily: 'monospace', cursor: 'pointer',
            }}>AUTO {autoDispatch ? 'ON' : 'OFF'}</button>
            <button onClick={addJob} style={{
              background: 'rgba(0,207,255,0.1)', border: '1px solid #00cfff44',
              color: '#00cfff', padding: '4px 10px', borderRadius: 6,
              fontSize: 9, fontFamily: 'monospace', cursor: 'pointer',
            }}>+ NEW JOB</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jobs.map(job => <DispatchCard key={job.id} job={job} onAssign={assignJob} fleet={fleet} />)}
        </div>
      </div>

      {/* Dispatch log */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, color: '#556677', textTransform: 'uppercase', letterSpacing: 1.5 }}>Dispatch Log</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {log.length === 0 && <div style={{ fontSize: 10, color: '#3a4a6a', fontFamily: 'monospace' }}>No activity yet</div>}
          {log.map((l, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${l.color}55`, paddingLeft: 8 }}>
              <div style={{ fontSize: 10, color: '#8899aa', fontFamily: 'monospace' }}>{l.msg}</div>
              <div style={{ fontSize: 9, color: '#3a4a6a', fontFamily: 'monospace' }}>{l.at}</div>
            </div>
          ))}
        </div>

        {/* Fleet availability */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: '#556677', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Fleet Availability</div>
          {fleet.filter(v => v.status === 'idle').map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#8899aa', fontFamily: 'monospace' }}>{v.id}</span>
              <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}>🔋 {Math.round(v.battery)}%</span>
            </div>
          ))}
          {fleet.filter(v => v.status === 'idle').length === 0 && (
            <div style={{ fontSize: 10, color: '#3a4a6a', fontFamily: 'monospace' }}>All vehicles deployed</div>
          )}
        </div>
      </div>
    </div>
  );
}