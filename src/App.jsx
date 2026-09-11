import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import {
  Heart,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Activity,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import HeartModel, { ACTIVE_HEART_MODEL } from './HeartModel';
import EcgOscilloscope from './components/EcgOscilloscope';
import {
  CONDUCTION_STAGES,
  resolveCardiacTelemetry,
  getCardiacMetrics,
} from './services/cardiacEngine';
import './App.css';

class HeartModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('HeartModel 3D Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="canvas-model-error">
            <p style={{ margin: 0, fontWeight: 700 }}>Failed to load 3D Heart Model</p>
            <small style={{ color: '#94a3b8' }}>{this.state.error?.message || 'Network or parse error'}</small>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Playback & Timing State
  const [isPlaying, setIsPlaying] = useState(true);
  const [bpm, setBpm] = useState(72);
  const [phaseRatio, setPhaseRatio] = useState(0.0);

  // Model Selection: defaults to ACTIVE_HEART_MODEL ('model2')
  const [modelChoice, setModelChoice] = useState(ACTIVE_HEART_MODEL);

  // Display toggles
  const [showNodes, setShowNodes] = useState(true);
  const [showFibers, setShowFibers] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showSparks, setShowSparks] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  // UI Panels
  const [showTelemetryDetails, setShowTelemetryDetails] = useState(true);
  const [showControlsPanel, setShowControlsPanel] = useState(true);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const controlsRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Continuous High-Precision 60fps Animation Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        const cycleDuration = 60 / bpm;
        setPhaseRatio((prev) => {
          const next = (prev + deltaSec / cycleDuration) % 1;
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, bpm]);

  // Compute live cardiac telemetry and clinical intervals
  const telemetry = useMemo(
    () => resolveCardiacTelemetry(phaseRatio),
    [phaseRatio]
  );
  const metrics = useMemo(() => getCardiacMetrics(bpm), [bpm]);

  // Current beat time in ms
  const currentBeatMs = Math.round(phaseRatio * metrics.cycleTimeMs);

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts (Space to play/pause, Left/Right to scrub, 1/2 for model)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setPhaseRatio((p) => (p + 0.025) % 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setPhaseRatio((p) => (p - 0.025 + 1) % 1);
      } else if (e.key === '1') {
        setModelChoice('model1');
      } else if (e.key === '2') {
        setModelChoice('model2');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset 3D Camera view
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="heart-app-container">
      {/* =================================================================== */}
      {/* 1. FULL-PAGE 3D THREE.JS VIEWPORT                                   */}
      {/* =================================================================== */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting Rig */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.7} />
          <directionalLight
            position={[-5, -3, -4]}
            intensity={0.65}
            color="#60a5fa"
          />
          <directionalLight
            position={[0, 5, -5]}
            intensity={1.1}
            color="#f43f5e"
          />
          <pointLight position={[0, 0, 1.8]} intensity={0.5} />

          {/* Realistic 3D Heart Model with Calibrated Conduction System */}
          <Suspense fallback={null}>
            <HeartModel
              phase={telemetry.heartPhase}
              progress={telemetry.heartProgress}
              modelChoice={modelChoice}
              showNodes={showNodes}
              showFibers={showFibers}
              showLabels={showLabels}
              showSparks={showSparks}
            />
            </Suspense>
          <Suspense
            fallback={
              <Html center>
                <div className="canvas-model-loader">
                  <div className="loader-spinner" />
                  <span className="loader-text">Loading 3D Heart Model...</span>
                </div>
              </Html>
            }
          >
            <HeartModelErrorBoundary>
              <HeartModel
                phase={telemetry.heartPhase}
                progress={telemetry.heartProgress}
                modelChoice={modelChoice}
                showNodes={showNodes}
                showFibers={showFibers}
                showLabels={showLabels}
                showSparks={showSparks}
              />
            </HeartModelErrorBoundary>
          </Suspense>

          {/* Interactive Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            minDistance={1.3}
            maxDistance={5.8}
          />
        </Canvas>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP FLOATING NAVIGATION & TELEMETRY HEADER                       */}
      {/* =================================================================== */}
      <header className="top-hud-bar">
        {/* Left: Brand & Model Switcher */}
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Heart className="brand-heart-icon" size={20} />
          </div>
          <div>
            <h1 className="brand-title">CARDIAC 3D CONDUCTION</h1>
            <p className="brand-subtitle">Electrophysiology Simulation System</p>
          </div>

          {/* Model Switcher Buttons */}
          <div className="model-switcher-tabs" title="Switch 3D Heart Model">
            <button
              className={`model-tab-btn ${modelChoice === 'model1' ? 'active' : ''}`}
              onClick={() => setModelChoice('model1')}
            >
              Model 1
            </button>
            <button
              className={`model-tab-btn ${modelChoice === 'model2' ? 'active' : ''}`}
              onClick={() => setModelChoice('model2')}
            >
              Model 2
            </button>
          </div>
        </div>

        {/* Center: Live Conduction Stage Banner */}
        <div
          className="stage-banner-pill"
          style={{
            borderColor: `${telemetry.activeStage.color}66`,
            boxShadow: `0 0 16px ${telemetry.activeStage.color}22`,
          }}
        >
          <span
            className="stage-banner-dot"
            style={{
              backgroundColor: telemetry.activeStage.color,
              boxShadow: `0 0 10px ${telemetry.activeStage.color}`,
            }}
          />
          <div className="stage-banner-text">
            <span className="stage-banner-title">
              {telemetry.activeStage.name}
            </span>
            <span className="stage-banner-sub">
              {telemetry.activeStage.title}
            </span>
          </div>
        </div>

        {/* Right: Heart Rate & Actions */}
        <div className="top-right-actions">
          {/* Pulsing Heart Rate Badge */}
          <div className="hr-badge-pill">
            <Heart
              size={18}
              className="pulse-icon"
              style={{
                color: '#ef4444',
                animationDuration: `${60 / bpm}s`,
              }}
            />
            <span className="hr-bpm-number">{bpm}</span>
            <span className="hr-bpm-unit">BPM</span>
            <span
              className="rhythm-tag"
              style={{ color: metrics.rhythmColor }}
            >
              {metrics.rhythmStatus.split(' ')[1] || 'Sinus'}
            </span>
          </div>

          {/* Toggle Telemetry HUD */}
          <button
            className={`icon-hud-btn ${showTelemetryDetails ? 'active' : ''}`}
            onClick={() => setShowTelemetryDetails((v) => !v)}
            title="Toggle Clinical Telemetry (Left Panel)"
          >
            <Info size={17} />
          </button>

          {/* Toggle Controls Panel (Right) */}
          <button
            className={`icon-hud-btn ${showControlsPanel ? 'active' : ''}`}
            onClick={() => setShowControlsPanel((v) => !v)}
            title="Toggle ECG & Playback Panel (Right Panel)"
          >
            <Sliders size={17} />
          </button>

          {/* Fullscreen Button */}
          <button
            className="icon-hud-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 3. CONDUCTION STAGE PROGRESSION PIPELINE BREADCRUMBS                 */}
      {/* =================================================================== */}
      <nav className="stage-breadcrumbs-bar">
        {CONDUCTION_STAGES.map((stage) => {
          const isActive = telemetry.activeStage.id === stage.id;
          return (
            <button
              key={stage.id}
              className={`stage-chip-btn ${isActive ? 'active' : ''}`}
              style={{
                '--stage-color': stage.color,
                borderColor: isActive ? stage.color : 'transparent',
              }}
              onClick={() => {
                setIsPlaying(false);
                setPhaseRatio(stage.jumpPhase);
              }}
              title={`Jump directly to ${stage.name}`}
            >
              <span
                className="stage-chip-dot"
                style={{
                  backgroundColor: stage.color,
                  boxShadow: isActive ? `0 0 8px ${stage.color}` : 'none',
                }}
              />
              <span className="stage-chip-name">{stage.shortName}</span>
            </button>
          );
        })}
      </nav>

      {/* =================================================================== */}
      {/* 4. CLINICAL TELEMETRY & STAGE DEEP-DIVE (Floating Left)             */}
      {/* =================================================================== */}
      {showTelemetryDetails && (
        <aside className="telemetry-floating-card">
          <div className="telemetry-header">
            <div className="telemetry-badge">
              <Activity size={14} color="#10b981" />
              <span>ELECTROPHYSIOLOGY MONITOR</span>
            </div>
            <button
              className="close-telemetry-btn"
              onClick={() => setShowTelemetryDetails(false)}
              title="Close Telemetry"
            >
              ×
            </button>
          </div>

          <p className="stage-description-text">
            {telemetry.activeStage.description}
          </p>

          <div className="telemetry-metrics-grid">
            <div className="metric-cell">
              <span className="metric-label">R-R Interval</span>
              <span className="metric-val">{metrics.cycleTimeMs} ms</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">P-R Interval</span>
              <span className="metric-val">{metrics.prIntervalMs} ms</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">QRS Width</span>
              <span className="metric-val">{metrics.qrsDurationMs} ms</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Q-T Interval</span>
              <span className="metric-val">{metrics.qtIntervalMs} ms</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Cardiac Output</span>
              <span className="metric-val">{metrics.cardiacOutputLMin} L/min</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Lead II Voltage</span>
              <span className="metric-val highlight">
                {telemetry.voltage >= 0 ? '+' : ''}
                {telemetry.voltage.toFixed(2)} mV
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* =================================================================== */}
      {/* 5. FLOATING RIGHT CONTROL PANEL (ECG + SCRUBBER + BPM + LAYERS)     */}
      {/* =================================================================== */}
      {showControlsPanel && (
        <aside className="right-control-panel">
          {/* Header */}
          <div className="panel-header">
            <div className="panel-title-badge">
              <Activity size={14} color="#38bdf8" />
              <span>LEAD II ECG & CONTROLS</span>
            </div>
            <button
              className="close-telemetry-btn"
              onClick={() => setShowControlsPanel(false)}
              title="Hide Controls"
            >
              ×
            </button>
          </div>

          {/* Section 1: Interactive Lead II ECG Oscilloscope Canvas */}
          <div className="ecg-oscilloscope-container">
            <EcgOscilloscope
              phaseRatio={phaseRatio}
              voltage={telemetry.voltage}
              height={78}
              onScrub={(ratio) => {
                setIsPlaying(false);
                setPhaseRatio(ratio);
              }}
            />
          </div>

          {/* Section 2: Conduction Timeline Scrubber */}
          <div className="scrubber-row">
            <span className="scrubber-time-label">0 ms</span>
            <div className="scrubber-track-wrap">
              <input
                type="range"
                min="0"
                max="1"
                step="0.002"
                value={phaseRatio}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPhaseRatio(parseFloat(e.target.value));
                }}
                className="conduction-slider"
              />
              {/* Stage markers along the scrub bar */}
              <div className="scrubber-indicators">
                <span style={{ left: '16%' }} title="P-Wave">P</span>
                <span style={{ left: '36%' }} title="QRS Complex">QRS</span>
                <span style={{ left: '60%' }} title="Systole">Systole</span>
                <span style={{ left: '74%' }} title="T-Wave">T</span>
              </div>
            </div>
            <span className="scrubber-time-label">
              {currentBeatMs} / {metrics.cycleTimeMs} ms
            </span>
          </div>

          {/* Section 3: Playback Transport Buttons */}
          <div className="transport-buttons-group">
            <button
              className="transport-btn"
              onClick={() => {
                setIsPlaying(false);
                setPhaseRatio((p) => (p - 0.05 + 1) % 1);
              }}
              title="Step Back 5% (Left Arrow)"
            >
              <SkipBack size={16} />
            </button>

            <button
              className="transport-play-btn"
              onClick={() => setIsPlaying((p) => !p)}
              title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="play-icon-offset" />}
            </button>

            <button
              className="transport-btn"
              onClick={() => {
                setIsPlaying(false);
                setPhaseRatio((p) => (p + 0.05) % 1);
              }}
              title="Step Forward 5% (Right Arrow)"
            >
              <SkipForward size={16} />
            </button>

            <button
              className="transport-btn"
              onClick={() => setPhaseRatio(0)}
              title="Reset Beat to Diastole"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Section 4: Heart Rate / BPM Adjuster */}
          <div className="bpm-control-group">
            <div className="bpm-header-info">
              <span className="bpm-label">HEART RATE:</span>
              <span className="bpm-val-text">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              step="1"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="bpm-slider"
            />
            {/* Quick BPM Presets */}
            <div className="bpm-presets-group">
              <button
                className={`bpm-preset-pill ${bpm === 50 ? 'active' : ''}`}
                onClick={() => setBpm(50)}
              >
                50 Brady
              </button>
              <button
                className={`bpm-preset-pill ${bpm === 72 ? 'active' : ''}`}
                onClick={() => setBpm(72)}
              >
                72 Rest
              </button>
              <button
                className={`bpm-preset-pill ${bpm === 115 ? 'active' : ''}`}
                onClick={() => setBpm(115)}
              >
                115 Active
              </button>
              <button
                className={`bpm-preset-pill ${bpm === 150 ? 'active' : ''}`}
                onClick={() => setBpm(150)}
              >
                150 Tachy
              </button>
            </div>
          </div>

          {/* Section 5: Collapsible 3D Layers & Camera Controls */}
          <div className="layers-dropdown-section">
            <button
              className="layers-dropdown-toggle"
              onClick={() => setShowLayersDropdown((v) => !v)}
            >
              <div className="layers-dropdown-title">
                <Layers size={14} />
                <span>3D Scene & Layers</span>
              </div>
              {showLayersDropdown ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showLayersDropdown && (
              <div className="layers-dropdown-content">
                <label className="drawer-toggle-row">
                  <span>SA & AV Pacemaker Nodes</span>
                  <input
                    type="checkbox"
                    checked={showNodes}
                    onChange={(e) => setShowNodes(e.target.checked)}
                  />
                </label>
                <label className="drawer-toggle-row">
                  <span>Conduction Pathways (His/BB)</span>
                  <input
                    type="checkbox"
                    checked={showFibers}
                    onChange={(e) => setShowFibers(e.target.checked)}
                  />
                </label>
                <label className="drawer-toggle-row">
                  <span>Electrical Impulse Sparks</span>
                  <input
                    type="checkbox"
                    checked={showSparks}
                    onChange={(e) => setShowSparks(e.target.checked)}
                  />
                </label>
                <label className="drawer-toggle-row">
                  <span>3D Anatomical Labels</span>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                </label>
                <label className="drawer-toggle-row">
                  <span>Auto-Rotate Camera</span>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                  />
                </label>
                <button className="drawer-action-btn" onClick={handleResetCamera}>
                  <Compass size={14} />
                  <span>Reset 3D View</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
