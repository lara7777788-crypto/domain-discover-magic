// Tiny Web Audio SFX for the hero cake smash. Synthesized (no asset downloads),
// short so the drama reads premium rather than annoying.
let ctx: AudioContext | null = null;
let primed = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Unlock/warm the audio context on the first user gesture so the croak can
 * never be swallowed by a still-suspended context on iOS/Safari.
 */
export function primeAudio() {
  if (primed || typeof window === "undefined") return;
  const unlock = () => {
    const ac = getCtx();
    if (!ac) return;
    void ac.resume();
    // one inaudible tick keeps the graph awake
    const g = ac.createGain();
    g.gain.value = 0.0001;
    const o = ac.createOscillator();
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.02);
    primed = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

function quiet() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Loud two-note croak with a wobbling formant — "RIBBIT!" */
export function playRibbet(gainScale = 1) {
  const ac = getCtx();
  if (!ac) return;
  // If the context is still waking up, wait for it so the croak is never
  // silently dropped (iOS/Safari suspend audio until a gesture resolves).
  if (ac.state !== "running") {
    void ac.resume().then(() => scheduleRibbet(ac, gainScale));
    return;
  }
  scheduleRibbet(ac, gainScale);
}


function scheduleRibbet(ac: AudioContext, gainScale: number) {
  // small pad so notes never get dropped while the context is still resuming
  const t0 = ac.currentTime + 0.03;

  // shared master so the croak sits loud and forward without clipping
  const master = ac.createGain();
  master.gain.value = 1;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 8;
  master.connect(comp).connect(ac.destination);


  const croak = (
    start: number,
    f1: number,
    f2: number,
    dur: number,
    gain: number,
    opts: { bright?: boolean; open?: boolean } = {},
  ) => {
    const osc = ac.createOscillator();
    const wob = ac.createOscillator();
    const wobGain = ac.createGain();
    const filter = ac.createBiquadFilter();
    const amp = ac.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f1, start);
    osc.frequency.exponentialRampToValueAtTime(f2, start + dur);

    // throat wobble
    wob.type = "sine";
    wob.frequency.value = 46;
    wobGain.gain.value = 34;
    wob.connect(wobGain).connect(osc.frequency);

    // `open` layers keep the low body instead of a narrow bandpass, which is
    // what makes the croak actually read as LOUD on phone speakers
    filter.type = opts.open ? "lowpass" : "bandpass";
    filter.frequency.value = opts.open ? 2400 : opts.bright ? 1100 : 620;
    filter.Q.value = opts.open ? 0.7 : 5;

    const g = Math.min(0.95, gain * gainScale);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(g, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter).connect(amp).connect(master);
    osc.start(start);
    wob.start(start);
    osc.stop(start + dur + 0.02);
    wob.stop(start + dur + 0.02);
  };

  // subtle background croak
  croak(t0, 220, 150, 0.1, 0.1);
  croak(t0 + 0.14, 170, 110, 0.16, 0.09);

  // loud front layer: fat, open "RIB-BIT" right up front
  croak(t0, 150, 96, 0.13, 0.85, { open: true });
  croak(t0 + 0.15, 118, 70, 0.22, 0.82, { open: true });
  // bright harmonics so it cuts through small speakers
  croak(t0 + 0.005, 300, 205, 0.11, 0.4, { bright: true });
  croak(t0 + 0.155, 236, 150, 0.19, 0.38, { bright: true });
  croak(t0 + 0.16, 472, 300, 0.14, 0.2, { bright: true });
}



/** Impact: low thud + filtered noise burst — "smash". */
export function playSmash(lead = 0) {
  if (quiet()) return;
  const ac = getCtx();
  if (!ac) return;
  // `lead` (seconds) lets the caller fire slightly early and still have the
  // transient land exactly on the visual impact frame.
  const t0 = ac.currentTime + Math.max(0, lead);

  // body thud
  const thud = ac.createOscillator();
  const thudAmp = ac.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(150, t0);
  thud.frequency.exponentialRampToValueAtTime(38, t0 + 0.3);
  thudAmp.gain.setValueAtTime(0.0001, t0);
  thudAmp.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
  thudAmp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
  thud.connect(thudAmp).connect(ac.destination);
  thud.start(t0);
  thud.stop(t0 + 0.45);

  // splatter noise
  const len = Math.floor(ac.sampleRate * 0.35);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = "lowpass";
  hp.frequency.setValueAtTime(4200, t0);
  hp.frequency.exponentialRampToValueAtTime(700, t0 + 0.3);
  const nAmp = ac.createGain();
  nAmp.gain.setValueAtTime(0.11, t0);
  nAmp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
  noise.connect(hp).connect(nAmp).connect(ac.destination);
  noise.start(t0);
}

/** Haptic-style pulse; silently ignored where unsupported. */
export function buzz(pattern: number | number[]) {
  if (quiet()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no haptics */
  }
}
