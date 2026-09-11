import React, { useRef, useEffect, useState } from 'react';
import { getEcgVoltage } from '../services/cardiacEngine';

/**
 * High-performance HTML5 Canvas Lead II ECG Oscilloscope
 * Features:
 * - Hospital telemetry dark grid (5mm major / 1mm minor lines)
 * - Full synthesized Lead II waveform curve with phosphorescent glow
 * - Dynamic sweep cursor with active voltage bead
 * - Click & drag scrubbing directly on the ECG graph
 * - Responsive auto-sizing to parent container
 */
export default function EcgOscilloscope({
  phaseRatio = 0,
  voltage = 0,
  width,
  height = 80,
  onScrub,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [measuredWidth, setMeasuredWidth] = useState(width || 310);

  // Auto-measure container width
  useEffect(() => {
    if (width) {
      setMeasuredWidth(width);
      return;
    }
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setMeasuredWidth(w);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width]);

  // Draw ECG strip on every phaseRatio or width change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = measuredWidth;
    const h = height;
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution matching device pixel ratio for retina sharpness
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 1. Background
    ctx.fillStyle = '#0a0f17';
    ctx.fillRect(0, 0, w, h);

    // 2. Telemetry Medical Grid
    const minorStep = 10;
    const majorStep = 50;

    // Minor grid lines
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.beginPath();
    for (let x = 0; x < w; x += minorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += minorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Major grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.beginPath();
    for (let x = 0; x < w; x += majorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += majorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Baseline is at 62% of height
    const baseY = h * 0.62;
    // Scale: 1.0 mV occupies ~38% of canvas height
    const mvScale = h * 0.38;

    // Center baseline line
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    // 3. Draw full Lead II ECG Waveform
    const sampleCount = 300;
    ctx.beginPath();
    for (let i = 0; i <= sampleCount; i++) {
      const p = i / sampleCount;
      const x = p * w;
      const v = getEcgVoltage(p);
      const y = baseY - v * mvScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Glow effect
    ctx.save();
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Highlight path up to current phase
    ctx.beginPath();
    for (let i = 0; i <= sampleCount; i++) {
      const p = i / sampleCount;
      if (p > phaseRatio) break;
      const x = p * w;
      const v = getEcgVoltage(p);
      const y = baseY - v * mvScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // 4. Draw Cursor & Active Indicator Bead
    const curX = phaseRatio * w;
    const curY = baseY - voltage * mvScale;

    // Vertical sweep cursor line
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Cursor Bead
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(curX, curY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curX, curY, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Annotations
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('LEAD II  25mm/s  10mm/mV', 8, 13);

    // Current Voltage readout
    const sign = voltage >= 0 ? '+' : '';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${sign}${voltage.toFixed(2)} mV`, Math.max(160, w - 75), 13);

  }, [phaseRatio, voltage, measuredWidth, height]);

  // Handle direct scrubbing on canvas
  const handlePointer = (e) => {
    if (!onScrub || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = x / rect.width;
    onScrub(ratio);
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    handlePointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current) {
      handlePointer(e);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.05)',
        cursor: 'crosshair',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      title="Click or drag to scrub the ECG signal"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: `${measuredWidth}px`,
          height: `${height}px`,
        }}
      />
    </div>
  );
}
