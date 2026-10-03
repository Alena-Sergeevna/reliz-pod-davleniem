let context;

function getContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!context) context = new AudioCtx();
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(ctx, { type, from, to, start, duration, gain }) {
  const oscillator = ctx.createOscillator();
  const amp = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(amp);
  amp.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(ctx, start, duration, gain) {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);
}

export function playAlarm(tier) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (tier === 'risk') {
      noise(ctx, now, 0.28, 0.16);
      tone(ctx, { type: 'sawtooth', from: 196, to: 62, start: now, duration: 0.48, gain: 0.07 });
      tone(ctx, { type: 'square', from: 540, to: 180, start: now + 0.12, duration: 0.22, gain: 0.04 });
      return;
    }
    tone(ctx, { type: 'triangle', from: 240, to: 120, start: now, duration: 0.32, gain: 0.05 });
  } catch {
    /* Звук необязателен для прохождения. */
  }
}

export function playClear() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    tone(ctx, { type: 'sine', from: 523, to: 523, start: now, duration: 0.12, gain: 0.03 });
    tone(ctx, { type: 'sine', from: 784, to: 784, start: now + 0.1, duration: 0.16, gain: 0.03 });
  } catch {
    /* Звук необязателен для прохождения. */
  }
}

export function motionAllowed() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
