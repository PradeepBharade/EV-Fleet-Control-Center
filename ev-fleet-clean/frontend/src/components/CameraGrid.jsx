import React, { useEffect, useRef, useState } from 'react';

const CAMERA_LABELS = ['FRONT', 'REAR', 'LEFT', 'RIGHT', 'CABIN'];

function CameraFeed({ label, vehicleId, status, active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const colors = {
      autonomous: { road: '#1a1a2e', sky: '#0d1b2a', line: '#ffcc00' },
      takeover_needed: { road: '#2e0d0d', sky: '#1a0000', line: '#ff2244' },
      manual_control: { road: '#1a2e1a', sky: '#0d1a0d', line: '#ff6b35' },
      charging: { road: '#1a1a2e', sky: '#0d0d1a', line: '#8899aa' },
      cleaning: { road: '#1a2a2e', sky: '#0d1a2e', line: '#00cfff' },
      idle: { road: '#1a1a1a', sky: '#111111', line: '#8899aa' },
    };
    const c = colors[status] || colors.idle;

    function drawFrame() {
      frameRef.current++;
      const f = frameRef.current;
      const offset = (f * (label === 'REAR' ? -1 : 1)) % 200;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      skyGrad.addColorStop(0, c.sky);
      skyGrad.addColorStop(1, c.road);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.5);

      // Road
      ctx.fillStyle = c.road;
      ctx.fillRect(0, H * 0.5, W, H * 0.5);

      // Road lanes
      if (label !== 'CABIN') {
        const vanishX = W * 0.5, vanishY = H * 0.5;
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          const laneX = vanishX + i * 40;
          ctx.beginPath();
          ctx.moveTo(vanishX + i * 5, vanishY);
          ctx.lineTo(laneX, H);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Center dashes
        for (let y = 0; y < H; y += 40) {
          const pct = (y - H * 0.5) / (H * 0.5);
          if (pct < 0) continue;
          const dashY = y + (offset % 40);
          const dashW = 3 * pct;
          ctx.fillStyle = c.line;
          ctx.globalAlpha = 0.7 * pct;
          ctx.fillRect(W / 2 - dashW / 2, dashY, dashW, 12 * pct);
          ctx.globalAlpha = 1;
        }

        // Horizon buildings
        for (let b = 0; b < 8; b++) {
          const bx = (b * 60 + (f * 0.1)) % (W + 20) - 10;
          const bh = 20 + (b * 13) % 40;
          ctx.fillStyle = `rgba(255,255,255,0.04)`;
          ctx.fillRect(bx, H * 0.5 - bh, 15, bh);
        }
      } else {
        // Cabin interior
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, W, H);
        // Seats
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(W * 0.1, H * 0.4, W * 0.35, H * 0.6);
        ctx.fillRect(W * 0.55, H * 0.4, W * 0.35, H * 0.6);
        // Headrest
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(W * 0.28, H * 0.42, 15, 0, Math.PI * 2);
        ctx.arc(W * 0.72, H * 0.42, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scan line effect
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, y, W, 1);
      }

      // HUD overlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, W, 16);
      ctx.fillRect(0, H - 16, W, 16);
      ctx.fillStyle = status === 'takeover_needed' ? '#ff2244' : '#00ff88';
      ctx.font = '8px monospace';
      ctx.fillText(`${label} CAM`, 4, 10);
      ctx.fillText(`${(f * 0.033).toFixed(1)}s`, W - 30, 10);

      // Noise grain
      if (f % 3 === 0) {
        const imageData = ctx.getImageData(0, 0, W, H);
        for (let i = 0; i < 200; i++) {
          const idx = (Math.floor(Math.random() * H) * W + Math.floor(Math.random() * W)) * 4;
          const v = Math.random() * 30;
          imageData.data[idx] += v;
          imageData.data[idx + 1] += v;
          imageData.data[idx + 2] += v;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      animRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, label, status]);

  if (!active) {
    return (
      <div style={{
        background: '#060810', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 4, aspectRatio: '16/9',
      }}>
        <div style={{ fontSize: 10, color: '#3a4a6a', fontFamily: 'monospace', textTransform: 'uppercase' }}>
          {label} — NO SIGNAL
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <canvas ref={canvasRef} width={240} height={135} style={{ display: 'block', width: '100%' }} />
      <div style={{
        position: 'absolute', bottom: 4, left: 4,
        fontSize: 9, color: '#00ff88', fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 3,
      }}>
        ● LIVE WebRTC
      </div>
    </div>
  );
}

export default function CameraGrid({ vehicle }) {
  const [activeFeeds, setActiveFeeds] = useState(['FRONT', 'REAR', 'LEFT', 'RIGHT']);

  if (!vehicle) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3a4a6a', fontFamily: 'monospace', fontSize: 13 }}>
      Select a vehicle to view camera feeds
    </div>
  );

  const isActive = (l) => activeFeeds.includes(l);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#8899aa', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
          Camera Feeds — {vehicle.id}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {CAMERA_LABELS.map(l => (
            <button key={l}
              onClick={() => setActiveFeeds(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])}
              style={{
                background: isActive(l) ? 'rgba(0,207,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive(l) ? '#00cfff44' : 'rgba(255,255,255,0.08)'}`,
                color: isActive(l) ? '#00cfff' : '#556677',
                fontSize: 9, padding: '2px 7px', borderRadius: 4,
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
        {CAMERA_LABELS.filter(l => l !== 'CABIN').map(l => (
          <CameraFeed key={l} label={l} vehicleId={vehicle.id} status={vehicle.status} active={isActive(l)} />
        ))}
      </div>
      <CameraFeed label="CABIN" vehicleId={vehicle.id} status={vehicle.status} active={isActive('CABIN')} />
    </div>
  );
}