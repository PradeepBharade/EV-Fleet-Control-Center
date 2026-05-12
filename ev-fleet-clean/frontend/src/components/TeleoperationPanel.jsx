import React, { useRef, useState, useEffect, useCallback } from 'react';

function Joystick({ onMove, label, color = '#00cfff' }) {
  const padRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const activeRef = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });
  const RADIUS = 55;
  const KNOB_R = 18;

  const getOffset = useCallback((clientX, clientY) => {
    const c = centerRef.current;
    let dx = clientX - c.x;
    let dy = clientY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > RADIUS) { dx = (dx / dist) * RADIUS; dy = (dy / dist) * RADIUS; }
    return { x: dx, y: dy };
  }, []);

  const onStart = useCallback((e) => {
    e.preventDefault();
    const rect = padRef.current.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    activeRef.current = true;
    setDragging(true);
    const touch = e.touches?.[0] || e;
    const p = getOffset(touch.clientX, touch.clientY);
    setPos(p);
    onMove?.(p.x / RADIUS, -p.y / RADIUS);
  }, [getOffset, onMove]);

  const onMove_ = useCallback((e) => {
    if (!activeRef.current) return;
    const touch = e.touches?.[0] || e;
    const p = getOffset(touch.clientX, touch.clientY);
    setPos(p);
    onMove?.(p.x / RADIUS, -p.y / RADIUS);
  }, [getOffset, onMove]);

  const onEnd = useCallback(() => {
    activeRef.current = false;
    setDragging(false);
    setPos({ x: 0, y: 0 });
    onMove?.(0, 0);
  }, [onMove]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove_);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove_, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove_);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove_);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onMove_, onEnd]);

  const pct = Math.sqrt(pos.x * pos.x + pos.y * pos.y) / RADIUS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        ref={padRef}
        onMouseDown={onStart}
        onTouchStart={onStart}
        style={{
          width: RADIUS * 2 + KNOB_R * 2,
          height: RADIUS * 2 + KNOB_R * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${color === '#00cfff' ? '0,207,255' : '255,107,53'},0.06) 0%, transparent 70%)`,
          border: `2px solid ${color}33`,
          position: 'relative',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Crosshair */}
        {[0, 90].map(deg => (
          <div key={deg} style={{
            position: 'absolute', background: `${color}22`,
            width: deg === 0 ? '100%' : 1, height: deg === 0 ? 1 : '100%',
          }} />
        ))}
        {/* Rings */}
        {[0.33, 0.66, 1].map(r => (
          <div key={r} style={{
            position: 'absolute',
            width: `${r * 100}%`, height: `${r * 100}%`,
            borderRadius: '50%', border: `1px solid ${color}${r === 1 ? '44' : '18'}`,
          }} />
        ))}
        {/* Knob */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          width: KNOB_R * 2, height: KNOB_R * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}66)`,
          boxShadow: `0 0 ${12 + pct * 16}px ${color}${Math.round(40 + pct * 80).toString(16)}`,
          border: `2px solid ${color}`,
          transition: dragging ? 'none' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
      <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</span>
    </div>
  );
}

export default function TeleoperationPanel({ vehicle, onControlCmd, onRelease }) {
  const [steer, setSteer] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [lights, setLights] = useState(false);
  const [horn, setHorn] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(vehicle?.heading || 0);
  const cmdRef = useRef(null);

  const isActive = vehicle?.status === 'manual_control';

  useEffect(() => {
    if (!isActive) return;
    clearInterval(cmdRef.current);
    cmdRef.current = setInterval(() => {
      const newSpeed = Math.max(0, Math.min(80, speed + throttle * 3 - speed * 0.1));
      const newHeading = (heading + steer * 4 + 360) % 360;
      setSpeed(newSpeed);
      setHeading(newHeading);
      onControlCmd?.(vehicle.id, { speed: newSpeed, heading: newHeading });
    }, 100);
    return () => clearInterval(cmdRef.current);
  }, [isActive, steer, throttle, speed, heading, vehicle?.id, onControlCmd]);

  useEffect(() => {
    if (!isActive) { setSpeed(0); setSteer(0); setThrottle(0); }
  }, [isActive]);

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;
    const keys = {};
    const onKey = (e, down) => {
      keys[e.key] = down;
      setSteer(keys['ArrowLeft'] || keys['a'] ? -1 : keys['ArrowRight'] || keys['d'] ? 1 : 0);
      setThrottle(keys['ArrowUp'] || keys['w'] ? 1 : keys['ArrowDown'] || keys['s'] ? -0.5 : 0);
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    return () => {
      window.removeEventListener('keydown', e => onKey(e, true));
      window.removeEventListener('keyup', e => onKey(e, false));
    };
  }, [isActive]);

  if (!vehicle) return null;

  return (
    <div style={{
      background: 'rgba(6,8,20,0.97)',
      border: `1px solid ${isActive ? '#ff6b3555' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#ff6b35' : '#3a4a6a', boxShadow: isActive ? '0 0 10px #ff6b35' : 'none', animation: isActive ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5, color: isActive ? '#ff6b35' : '#556677' }}>
            {isActive ? `Manual Control — ${vehicle.id}` : 'Teleoperation Standby'}
          </span>
        </div>
        {isActive && (
          <button onClick={() => onRelease(vehicle.id)} style={{
            background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8844',
            color: '#00ff88', padding: '4px 12px', borderRadius: 6, fontSize: 10,
            fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 0.5,
          }}>↩ RELEASE AUTO</button>
        )}
      </div>

      {!isActive ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a4a6a', fontSize: 12, fontFamily: 'monospace' }}>
          Takeover vehicle to enable controls
        </div>
      ) : (
        <>
          {/* Speedometer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Speed', value: `${Math.round(speed)}`, unit: 'km/h', color: '#00ff88' },
              { label: 'Heading', value: `${Math.round(heading)}°`, unit: '', color: '#00cfff' },
              { label: 'Throttle', value: `${Math.round(throttle * 100)}`, unit: '%', color: throttle > 0 ? '#ffcc00' : '#ff6b35' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#556677', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>
                  {m.value}<span style={{ fontSize: 9, color: '#556677', marginLeft: 2 }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Joysticks */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Joystick
              label="Steer / Reverse"
              color="#ff6b35"
              onMove={(x, y) => { setSteer(x); setThrottle(prev => y !== 0 ? y : prev); }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Quick action buttons */}
              {[
                { label: '🚨 HORN', active: horn, color: '#ffcc00', onClick: () => setHorn(h => !h) },
                { label: lights ? '💡 LIGHTS ON' : '💡 LIGHTS OFF', active: lights, color: '#00cfff', onClick: () => setLights(l => !l) },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{
                  background: b.active ? `${b.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${b.active ? b.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  color: b.active ? b.color : '#556677',
                  padding: '8px 14px', borderRadius: 8, fontSize: 10,
                  fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 0.5, width: 120,
                }}>{b.label}</button>
              ))}
            </div>
            <Joystick
              label="Throttle / Speed"
              color="#00cfff"
              onMove={(x, y) => setThrottle(y)}
            />
          </div>

          {/* Speed bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 9, color: '#556677', fontFamily: 'monospace' }}>
              <span>SPEED</span><span>MAX 80 km/h</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${(speed / 80) * 100}%`, height: '100%', borderRadius: 3,
                background: speed > 60 ? '#ff2244' : speed > 40 ? '#ffcc00' : '#00ff88',
                transition: 'width 0.1s, background 0.3s',
              }} />
            </div>
          </div>

          {/* Keyboard hint */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {['W', 'A', 'S', 'D', '↑', '↓', '←', '→'].map(k => (
              <kbd key={k} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                borderBottom: '2px solid rgba(255,255,255,0.08)', borderRadius: 4,
                padding: '2px 6px', fontSize: 9, color: '#8899aa', fontFamily: 'monospace',
              }}>{k}</kbd>
            ))}
          </div>
        </>
      )}
    </div>
  );
}