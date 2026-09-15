# 🫀 3D Human Heart Conduction & Lead II ECG Simulation

An interactive, high-fidelity 3D electrophysiology and conduction simulation of the human heart built with **React 19, Three.js, and @react-three/fiber**.
<p align="center">
  <img
    src="./assets/HeartAnimation-smaller.gif"
    alt="3D Human Heart Conduction Simulation"
    width="850"
  >
</p>

<p align="center">
  <a href="https://shadmansshuvo.github.io/HeartAnimation/">
    🔴 Live Demo
  </a>
</p>

<!-- 🔗 **Live Demo:** [https://shadmansshuvo.github.io/HeartAnimation/](https://shadmansshuvo.github.io/HeartAnimation/) -->

---

## 🌟 Overview

This application operates **entirely client-side** with **zero backend dependencies**, featuring real-time synchronized **Lead II ECG signal generation**, active conduction impulse propagation through cardiac anatomy (SA Node ➔ AV Node ➔ Bundle of His ➔ Purkinje Fibers ➔ Ventricular Systole), and seamless **dual-model switching** between two photorealistic 3D anatomical heart models.

The user interface is designed with a non-obstructive dual-panel HUD layout:
- **Left Panel:** Clinical Electrophysiology Monitor showing real-time intervals ($R\text{-}R$, $P\text{-}R$, $QRS$, $Q\text{-}T$, Cardiac Output).
- **Center Canvas:** Completely unobstructed 3D human heart with 360° OrbitControls, showing the full organ from aortic branches to the cardiac apex.
- **Right Panel:** Floating Lead II ECG Oscilloscope, Conduction Scrubber, Playback Transport Controls, BPM Controller, and 3D Scene Layer Toggles.

---

## ⚡ Key Features

### 1. Standalone Zero-Backend Electrophysiology Engine
- Runs directly in any modern browser without Python, FastAPI, or external servers.
- Built-in mathematical electrophysiology engine synthesizing authentic Lead II ECG waveforms at $250\text{ Hz}$ with Gaussian morphing:
  - **P-Wave**: Atrial depolarization triggered by the SA node.
  - **PR Segment**: Atrioventricular pause holding conduction for ventricular filling.
  - **QRS Complex**: Rapid septal descent down the Bundle of His and Purkinje arborization.
  - **ST Segment & Systole**: Myocardial contraction pump and mechanical ejection.
  - **T-Wave & Diastole**: Ventricular repolarization and myocardial relaxation.

### 2. Dual Realistic 3D Heart Models with Auto-Coordinate Mapping
- Supports two distinct photorealistic human heart 3D models (`realistic_human_heart.glb` and `realistic_human_heart2.glb`).
- Independent surface-snapped coordinate mapping and scale normalization for both models.
- Switchable in code via `ACTIVE_HEART_MODEL` in [`src/HeartModel.jsx`](src/HeartModel.jsx), or at runtime via UI buttons and keyboard shortcuts (`1` / `2`).

### 3. Interactive Lead II ECG Oscilloscope
- 60fps HTML5 Canvas medical monitor with hospital telemetry grid ($5\text{ mm}$ major / $1\text{ mm}$ minor lines).
- Live sweep cursor with active voltage bead and real-time millivolt readout.
- Click & drag directly on the oscilloscope to scrub through the cardiac cycle.

### 4. Interactive Transport & Playback
- **Transport Controls**: Play, Pause, Frame Step Back/Forward ($-5\%$ / $+5\%$), and Reset to beat start.
- **Cycle Scrubber**: Continuous range slider with anatomical phase markers ($P$, $QRS$, $\text{Systole}$, $T$) and real-time millisecond readout ($t / \text{cycleTime}$).
- **Conduction Stage Pipeline**: Click any stage chip (`SA Node`, `AV Node`, `His Bundle`, `Purkinje Fibers`, `Systole Pump`, `T-Wave`, `Diastole`) to jump directly to that electrophysiological event.
- **Heart Rate Controller**: BPM slider ($40$ to $160\text{ BPM}$) with one-click clinical presets (`50 Brady`, `72 Rest`, `115 Active`, `150 Tachy`).

### 5. 3D Scene & Visualization Layers
- Toggle visibility for:
  - Sinoatrial (SA) & Atrioventricular (AV) Pacemaker Nodes
  - Conduction Pathways (Internodal Tracts, Bachmann Bundle, Bundle of His, LBB, RBB)
  - Purkinje Fiber Network
  - Electrical Impulse Sparks
  - 3D Anatomical Labels
  - Auto-Rotate Camera & Reset 3D View

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / Pause cardiac playback |
| <kbd>→</kbd> (Right Arrow) | Step forward $5\%$ in the cardiac cycle |
| <kbd>←</kbd> (Left Arrow) | Step backward $5\%$ in the cardiac cycle |
| <kbd>1</kbd> | Switch to **Heart Model 1** |
| <kbd>2</kbd> | Switch to **Heart Model 2** |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Launch
```bash
# 1. Clone repository
git clone https://github.com/ShadmanSShuvo/HeartAnimation.git
cd HeartAnimation

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:5173/HeartAnimation/](http://localhost:5173/HeartAnimation/) in your browser.

---

## 🛠️ Automated GitHub Pages Deployment

The repository includes a GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that builds and publishes the application automatically on every push to `main`.

To enable automated deployment on your own fork:
1. Go to your repository on GitHub: `Settings` ➔ `Pages`.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Push to `main`:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```
4. Your site will automatically build and publish to `https://<username>.github.io/<repo-name>/`.

---

## 📁 Project Structure

```text
HeartAnimation/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── public/
│   ├── favicon.svg                 # Application favicon
│   ├── icons.svg                   # SVG assets
│   ├── realistic_human_heart.glb   # 3D Heart Model 1
│   └── realistic_human_heart2.glb  # 3D Heart Model 2
├── src/
│   ├── components/
│   │   └── EcgOscilloscope.jsx     # 60fps HTML5 Canvas Lead II ECG monitor
│   ├── services/
│   │   └── cardiacEngine.js        # Mathematical electrophysiology & telemetry engine
│   ├── App.css                     # Responsive glassmorphism styling
│   ├── App.jsx                     # Main HUD, 3D Canvas, and controls
│   ├── HeartModel.jsx              # Three.js 3D heart, calibrated nodes & conduction pathways
│   ├── index.css                   # Minimal full-screen reset
│   └── main.jsx                    # React entrypoint
├── index.html                      # HTML template
├── package.json                    # Project dependencies & scripts
├── vite.config.js                  # Vite configuration with base path support
└── README.md                       # Project documentation
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
