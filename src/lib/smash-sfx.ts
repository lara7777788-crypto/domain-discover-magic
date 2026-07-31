// Tiny Web Audio SFX for the hero cake smash. Synthesized (no asset downloads),
// low-gain and short so the drama reads premium rather than annoying.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function quiet() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Short two-note croak with a wobbling formant — "ribbet". */
export function playRibbet() {
  if (quiet()) return;
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;

  const croak = (start: number, f1: number, f2: number, dur: number, gain: number) => {
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
    wob.frequency.value = 42;
    wobGain.gain.value = 28;
    wob.connect(wobGain).connect(osc.frequency);

    filter.type = "bandpass";
    filter.frequency.value = 620;
    filter.Q.value = 5;

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter).connect(amp).connect(ac.destination);
    osc.start(start);
    wob.start(start);
    osc.stop(start + dur + 0.02);
    wob.stop(start + dur + 0.02);
  };

  croak(t0, 220, 150, 0.1, 0.09); // "rib"
  croak(t0 + 0.14, 170, 110, 0.16, 0.075); // "bet"
}

/** Impact: low thud + filtered noise burst — "smash". */
export function playSmash() {
  if (quiet()) return;
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;

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
