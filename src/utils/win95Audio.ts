/**
 * Efeitos Sonoros Retrô do Windows 95 via Web Audio API
 * Sintetizador dos sons clássicos (Tada, Ding, Chord e Startup de Brian Eno)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Clippy pop / chirp sonoro nostálgico
 */
export function playClippyPop(volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore
  }
}

/**
 * Clássico Windows 95 "Ding.wav" (Sino agudo)
 */
export function playWin95Ding(volume: number = 0.28) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc2.frequency.setValueAtTime(2093.0, now); // C7

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch {
    // ignore
  }
}

/**
 * Clássico Windows 95 "Tada.wav" (Fanfarra triunfante)
 */
export function playWin95Tada(volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(volume, now);
    master.connect(ctx.destination);

    // Fanfarra C4 -> E4 -> G4 -> C5
    const sequence = [
      { freq: 261.63, start: 0.0, dur: 0.12 },  // C4
      { freq: 329.63, start: 0.12, dur: 0.12 }, // E4
      { freq: 392.00, start: 0.24, dur: 0.14 }, // G4
      { freq: 523.25, start: 0.38, dur: 0.65 }, // C5 final sustentado
      { freq: 261.63, start: 0.38, dur: 0.65 }, // C4 harmônico base
      { freq: 659.25, start: 0.40, dur: 0.60 }, // E5 harmônico
    ];

    sequence.forEach((n) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square'; // timbre característico dos chips Sound Blaster 16
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      // Filtro para suavizar a onda quadrada vintage
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now + n.start);

      g.gain.setValueAtTime(0.001, now + n.start);
      g.gain.linearRampToValueAtTime(0.2, now + n.start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch {
    // ignore
  }
}

/**
 * Beep autêntico de PC Speaker 8253 PIT do IBM PC XT / AT (Windows 1.0 - 1985)
 */
export function playPCSpeakerBeep(frequency: number = 880, duration: number = 0.12, volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Pura onda quadrada de 1-bit do PC Speaker de 1985
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.setValueAtTime(volume, now + duration - 0.005);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // ignore
  }
}

