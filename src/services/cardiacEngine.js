/**
 * ============================================================================
 * CARDIAC ELECTROPHYSIOLOGY & ECG SYNTHESIS ENGINE
 * ============================================================================
 * Standalone client-side engine that models the human cardiac conduction system:
 *   SA Node -> Atrial Conduction -> AV Node Delay -> Bundle of His ->
 *   Bundle Branches (LBB/RBB) -> Purkinje Fibers -> Ventricular Systole ->
 *   Repolarization (T-Wave) -> Diastole.
 *
 * Provides continuous mathematical Lead II ECG synthesis, phase-synchronized
 * 3D spark coordinates, myocardial deformation scales, and clinical telemetry.
 * ============================================================================
 */

export const CONDUCTION_STAGES = [
  {
    id: 'sa_node',
    key: 'atrial_activation',
    name: 'SA Node Activation',
    shortName: 'SA Node',
    title: 'P-Wave: Atrial Depolarization',
    subtitle: 'Primary Pacemaker Firing',
    description: 'Sinoatrial node spontaneously fires electrical impulses, initiating rapid depolarization across both atria via internodal tracts and Bachmann bundle.',
    color: '#fbbf24', // Amber gold
    startPhase: 0.06,
    endPhase: 0.24,
    jumpPhase: 0.12,
  },
  {
    id: 'av_node',
    key: 'av_delay',
    name: 'AV Node Delay',
    shortName: 'AV Node',
    title: 'PR Segment: Atrioventricular Pause',
    subtitle: 'Electrophysiological Gatekeeper',
    description: 'The impulse enters the Atrioventricular Node where conduction velocity slows dramatically (~0.05 m/s), creating a physiological delay for ventricular filling.',
    color: '#f59e0b', // Deep Amber
    startPhase: 0.24,
    endPhase: 0.33,
    jumpPhase: 0.28,
  },
  {
    id: 'his_bundle',
    key: 'ventricular_conduction',
    name: 'Bundle of His & Branches',
    shortName: 'His Bundle',
    title: 'Q-Wave: Septal Conduction',
    subtitle: 'Rapid Interventricular Propagation',
    description: 'The impulse accelerates into the Bundle of His and splits down the Left and Right Bundle Branches across the interventricular septum toward the cardiac apex.',
    color: '#22d3ee', // Cyan
    startPhase: 0.33,
    endPhase: 0.44,
    jumpPhase: 0.37,
  },
  {
    id: 'purkinje',
    key: 'ventricular_conduction',
    name: 'Purkinje Arborization',
    shortName: 'Purkinje Fibers',
    title: 'R-Peak & S-Wave: Ventricular Depolarization',
    subtitle: 'Subendocardial Arborization',
    description: 'Specialized Purkinje fibers conduct impulses at 4 m/s, dispersing electrical activation throughout the subendocardial myocardium from apex to base.',
    color: '#a855f7', // Purple
    startPhase: 0.44,
    endPhase: 0.54,
    jumpPhase: 0.48,
  },
  {
    id: 'systole',
    key: 'ventricular_conduction',
    name: 'Ventricular Systole',
    shortName: 'Systole Pump',
    title: 'ST Segment: Mechanical Contraction',
    subtitle: 'Myocardial Ejection Phase',
    description: 'Vigorous synchronized contraction of the ventricular myocardium builds intraventricular pressure, ejecting blood through the aortic and pulmonary valves.',
    color: '#ef4444', // Crimson Red
    startPhase: 0.54,
    endPhase: 0.68,
    jumpPhase: 0.60,
  },
  {
    id: 'repolarization',
    key: 'repolarization',
    name: 'Ventricular Repolarization',
    shortName: 'T-Wave',
    title: 'T-Wave: Myocardial Recovery',
    subtitle: 'Electrochemical Reset',
    description: 'Ventricular myocytes undergo rapid repolarization as potassium ions efflux, restoring transmembrane resting potential for the subsequent cardiac cycle.',
    color: '#38bdf8', // Sky Blue
    startPhase: 0.68,
    endPhase: 0.88,
    jumpPhase: 0.76,
  },
  {
    id: 'diastole',
    key: 'diastole',
    name: 'Ventricular Diastole',
    shortName: 'Diastole',
    title: 'TP Baseline: Resting & Ventricular Filling',
    subtitle: 'Isoelectric Relaxation Phase',
    description: 'The heart muscle fully relaxes. Atria and ventricles fill passively with venous return blood in preparation for the next sinus impulse.',
    color: '#94a3b8', // Slate Grey
    startPhase: 0.88,
    endPhase: 1.06, // wraps to 0.06
    jumpPhase: 0.94,
  },
];

/**
 * Lead II ECG Voltage Synthesis (in millivolts mV)
 * Realistic Gaussian sum with physiological morphology:
 * - P-wave: peak at 0.16
 * - Q-wave: dip at 0.33
 * - R-peak: sharp spike at 0.36
 * - S-wave: dip at 0.39
 * - T-wave: asymmetric dome at 0.72
 */
export function getEcgVoltage(phaseRatio) {
  // Wrap phase into [0, 1)
  let p = phaseRatio % 1;
  if (p < 0) p += 1;

  // Baseline zero
  let v = 0;

  // P-wave (Atrial depolarization)
  const pCenter = 0.16;
  const pWidth = 0.032;
  const pAmp = 0.22;
  v += pAmp * Math.exp(-Math.pow((p - pCenter) / pWidth, 2));

  // Q-wave (Septal depolarization)
  const qCenter = 0.335;
  const qWidth = 0.010;
  const qAmp = -0.15;
  v += qAmp * Math.exp(-Math.pow((p - qCenter) / qWidth, 2));

  // R-peak (Massive ventricular depolarization)
  const rCenter = 0.360;
  const rWidth = 0.014;
  const rAmp = 1.35;
  v += rAmp * Math.exp(-Math.pow((p - rCenter) / rWidth, 2));

  // S-wave (Basal ventricular depolarization)
  const sCenter = 0.388;
  const sWidth = 0.013;
  const sAmp = -0.28;
  v += sAmp * Math.exp(-Math.pow((p - sCenter) / sWidth, 2));

  // T-wave (Ventricular repolarization - slightly skewed toward later phase)
  const tCenter = 0.72;
  const tWidth = (p < tCenter) ? 0.055 : 0.075;
  const tAmp = 0.34;
  v += tAmp * Math.exp(-Math.pow((p - tCenter) / tWidth, 2));

  // Subtle U-wave (Purkinje repolarization)
  const uCenter = 0.85;
  const uWidth = 0.035;
  const uAmp = 0.035;
  v += uAmp * Math.exp(-Math.pow((p - uCenter) / uWidth, 2));

  return v;
}

/**
 * Map progress value within sub-range [start, end] to [0, 1]
 */
function mapSubProgress(p, start, end) {
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / (end - start);
}

/**
 * Smooth bell pulse [0 -> 1 -> 0]
 */
function bellPulse(t) {
  const c = Math.max(0, Math.min(1, t));
  return Math.pow(Math.sin(c * Math.PI), 0.8);
}

/**
 * Resolves all anatomical, electrical, and telemetry properties for a given phase ratio [0, 1).
 */
export function resolveCardiacTelemetry(phaseRatio) {
  let p = phaseRatio % 1;
  if (p < 0) p += 1;

  // Determine active stage
  let activeStage = CONDUCTION_STAGES[CONDUCTION_STAGES.length - 1];
  let activeStageIndex = CONDUCTION_STAGES.length - 1;

  for (let i = 0; i < CONDUCTION_STAGES.length; i++) {
    const stage = CONDUCTION_STAGES[i];
    if (stage.endPhase > 1.0) {
      // Wraps around boundary
      if (p >= stage.startPhase || p < (stage.endPhase - 1.0)) {
        activeStage = stage;
        activeStageIndex = i;
        break;
      }
    } else if (p >= stage.startPhase && p < stage.endPhase) {
      activeStage = stage;
      activeStageIndex = i;
      break;
    }
  }

  // 1. SA Node & Atrial conduction
  // SA node fires at 0.06 -> 0.24
  const saProgress = mapSubProgress(p, 0.06, 0.24);
  const saIntensity = (p >= 0.06 && p <= 0.24) ? bellPulse(saProgress) : 0.05;
  const atrialSparkProgress = (p >= 0.08 && p <= 0.24) ? mapSubProgress(p, 0.08, 0.24) : 0;

  // 2. AV Node delay
  // AV node delays at 0.24 -> 0.33
  const avProgress = mapSubProgress(p, 0.24, 0.33);
  const avIntensity = (p >= 0.24 && p <= 0.33) ? bellPulse(avProgress) : 0.05;

  // 3. His Bundle conduction
  // His fires at 0.33 -> 0.40
  const hisProgress = (p >= 0.33 && p <= 0.40) ? mapSubProgress(p, 0.33, 0.40) : 0;

  // 4. Bundle Branches (RBB / LBB)
  // Bundle branches fire at 0.37 -> 0.46
  const bundleProgress = (p >= 0.37 && p <= 0.46) ? mapSubProgress(p, 0.37, 0.46) : 0;

  // 5. Purkinje Network & Ventricular excitation
  // Purkinje arborization at 0.42 -> 0.54
  const purkinjeProgress = (p >= 0.42 && p <= 0.54) ? mapSubProgress(p, 0.42, 0.54) : 0;
  const purkinjeIntensity = (p >= 0.42 && p <= 0.56) ? bellPulse(mapSubProgress(p, 0.42, 0.56)) : 0.15;

  // 6. Ventricular Systole & mechanical contraction pump
  // Contraction starts around 0.46, peaks at 0.60, relaxes by 0.70
  let pumpScale = 1.0;
  let muscleGlow = 0.02;
  if (p >= 0.44 && p <= 0.70) {
    const systoleProg = mapSubProgress(p, 0.44, 0.70);
    const pumpCurve = Math.sin(systoleProg * Math.PI);
    pumpScale = 1.0 - (pumpCurve * 0.11); // 11% radial contraction
    muscleGlow = 0.02 + pumpCurve * 0.35;
  } else if (p > 0.70 && p <= 0.85) {
    // T-wave relaxation glow
    const repolProg = mapSubProgress(p, 0.70, 0.85);
    muscleGlow = 0.02 + (1 - repolProg) * 0.10;
  }

  // 7. Map to HeartModel props (for backward and direct compatibility)
  let heartPhase = 'diastole';
  let heartProgress = 0;

  if (p >= 0.06 && p < 0.24) {
    heartPhase = 'atrial_activation';
    heartProgress = mapSubProgress(p, 0.06, 0.24);
  } else if (p >= 0.24 && p < 0.33) {
    heartPhase = 'av_delay';
    heartProgress = mapSubProgress(p, 0.24, 0.33);
  } else if (p >= 0.33 && p < 0.68) {
    heartPhase = 'ventricular_conduction';
    heartProgress = mapSubProgress(p, 0.33, 0.68);
  } else if (p >= 0.68 && p < 0.88) {
    heartPhase = 'repolarization';
    heartProgress = mapSubProgress(p, 0.68, 0.88);
  } else {
    heartPhase = 'diastole';
    heartProgress = 0;
  }

  const voltage = getEcgVoltage(p);

  return {
    phaseRatio: p,
    voltage,
    activeStage,
    activeStageIndex,
    // Model props
    heartPhase,
    heartProgress,
    // Individual telemetry intensities
    saProgress,
    saIntensity,
    atrialSparkProgress,
    avProgress,
    avIntensity,
    hisProgress,
    bundleProgress,
    purkinjeProgress,
    purkinjeIntensity,
    pumpScale,
    muscleGlow,
  };
}

/**
 * Generates an array of sample points across one full cardiac cycle (0.0 to 1.0)
 * Ideal for rendering the static ECG oscilloscope template or spark trail.
 */
export function generateEcgCycle(sampleCount = 300) {
  const points = [];
  for (let i = 0; i < sampleCount; i++) {
    const phase = i / sampleCount;
    const voltage = getEcgVoltage(phase);
    points.push({
      phase,
      voltage,
    });
  }
  return points;
}

/**
 * Calculate clinical telemetry metrics based on BPM (Beats Per Minute)
 */
export function getCardiacMetrics(bpm = 72) {
  const clampedBpm = Math.max(30, Math.min(220, bpm));
  const cycleTimeMs = Math.round((60 / clampedBpm) * 1000);

  // Clinical interval approximations based on Bazett formula & standard physiology
  const prIntervalMs = Math.round(160 * Math.sqrt(72 / clampedBpm)); // Normal: 120-200ms
  const qrsDurationMs = 88; // Normal: 80-100ms
  const qtIntervalMs = Math.round(390 * Math.sqrt(60 / clampedBpm)); // Normal QTc: ~400-440ms
  const strokeVolumeMl = 70; // Average resting adult stroke volume
  const cardiacOutputLMin = ((clampedBpm * strokeVolumeMl) / 1000).toFixed(1);

  let rhythmStatus = 'Normal Sinus Rhythm';
  let rhythmColor = '#10b981'; // Green
  if (clampedBpm < 60) {
    rhythmStatus = 'Sinus Bradycardia';
    rhythmColor = '#38bdf8'; // Blue
  } else if (clampedBpm > 100) {
    rhythmStatus = 'Sinus Tachycardia';
    rhythmColor = '#f59e0b'; // Amber
  }

  return {
    bpm: clampedBpm,
    cycleTimeMs,
    prIntervalMs,
    qrsDurationMs,
    qtIntervalMs,
    cardiacOutputLMin,
    rhythmStatus,
    rhythmColor,
  };
}
