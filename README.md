# Standalone Full-Page 3D Human Heart Conduction Visualizer

An interactive, high-fidelity 3D electrophysiology simulation of the human heart powered by **React 19, Three.js, and @react-three/fiber**. 

This application operates **entirely client-side** with **zero backend dependencies**, featuring real-time synchronized **Lead II ECG signal generation**, active conduction propagation (SA Node ➔ AV Node ➔ Bundle of His ➔ Purkinje Fibers ➔ Ventricular Systole), and seamless **dual-model switching** between realistic 3D anatomical heart models.

---

## Key Features

1. **Standalone Zero-Backend Architecture**:
   - Runs directly in any modern browser without Python, FastAPI, or external servers.
   - Built-in mathematical electrophysiology engine synthesizing authentic physiological Lead II ECG waveforms at 250 Hz.

2. **Synchronized 3D Conduction System**:
   - **Sinoatrial (SA) Node**: Pacemaker firing synchronized with the **P-wave** (atrial depolarization).
   - **Internodal Tracts & Bachmann Bundle**: Electrical impulse wavefront travels across the atrial myocardium.
   - **Atrioventricular (AV) Node**: Physiological delay (~100 ms) holding conduction during the **PR segment** to allow ventricular filling.
   - **Bundle of His & Bundle Branches (LBB / RBB)**: Rapid septal descent during the **Q-wave**.
   - **Purkinje Fiber Arborization**: Subendocardial depolarization spreading from cardiac apex to base during the **R-peak** and **S-wave**.
   - **Ventricular Systole & Ejection**: Realistic mechanical myocardial pump contraction and tissue glow during the **ST segment**.
   - **Ventricular Repolarization**: Potassium reset during the **T-wave** returning to diastole.

3. **Dual Realistic 3D Model Support**:
   - Supports two photorealistic human heart 3D models (`realistic_human_heart.glb` and `realistic_human_heart2.glb`).
   - Switchable via `ACTIVE_HEART_MODEL` in `HeartModel.jsx` or interactively via the UI header tab switcher.
   - Exact surface-snapped coordinate mapping and scale normalization for both models.

4. **Interactive Lead II ECG Oscilloscope**:
   - 60fps HTML5 Canvas medical monitor with hospital telemetry grid (5mm major / 1mm minor lines).
   - Live sweep cursor with active voltage bead and real-time millivolt readout.
   - Click & drag directly on the oscilloscope to scrub through the cardiac cycle.

5. **Clinical Controls & Telemetry**:
   - **Transport Controls**: Play, Pause, Frame Step Back/Forward, and Reset (Spacebar & Arrow key support).
   - **Conduction Stage Pipeline**: Click any stage chip (SA Node, AV Node, His, Purkinje, Systole) to jump directly to that electrical event.
   - **Dynamic Heart Rate (BPM)**: Slider (40–160 BPM) with one-click clinical presets (Bradycardia, Resting, Active, Tachycardia) and automatic recalculation of $R\text{-}R$, $P\text{-}R$, and $Q\text{-}T$ intervals.
   - **Layer Toggles**: Toggle Pacemaker Nodes, Conduction Tubes, Purkinje Mesh, 3D Labels, and Sparks.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Launch with One Command (macOS & Linux)
```bash
./run_main.sh
```

### Launch on Windows
```bat
run_main.bat
```

### Or Standard npm Commands
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Selecting the Active 3D Heart Model

In `frontend/src/HeartModel.jsx`, you can specify the default model via `ACTIVE_HEART_MODEL`:

```javascript
// Switch between 'model1' (/realistic_human_heart.glb) and 'model2' (/realistic_human_heart2.glb)
export const ACTIVE_HEART_MODEL = 'model2';
```

You can also toggle between Model 1 and Model 2 at runtime using the **Model 1 / Model 2** buttons in the top navigation header or by pressing keyboard keys `1` or `2`.
