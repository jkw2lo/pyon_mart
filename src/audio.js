// Tiny synthesized soundscape: an original door chime, fridge hum, UI blips.
export function createAudio() {
  let ctx = null, hum = null, humGain = null;

  function start() {
    if (ctx) return;
    try { ctx = new AudioContext(); } catch { return; }
    // brown noise → low-pass = refrigeration hum
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    hum = ctx.createBufferSource();
    hum.buffer = buf;
    hum.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    humGain = ctx.createGain();
    humGain.gain.value = 0;
    hum.connect(lp).connect(humGain).connect(ctx.destination);
    hum.start();
  }

  function tone(freq, t0, dur, vol = 0.12, type = 'sine') {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  return {
    start,
    // an original little "hop" motif — four rising notes and a settle
    chime() {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05;
      [659.3, 784.0, 987.8, 1318.5, 1174.7].forEach((f, i) => {
        tone(f, t + i * 0.16, 0.9, 0.09);
        tone(f * 2, t + i * 0.16, 0.4, 0.015, 'triangle');
      });
    },
    blip() { if (ctx) tone(1567.98, ctx.currentTime, 0.18, 0.05, 'triangle'); },
    rustle() {
      if (!ctx) return;
      const len = ctx.sampleRate * 0.18;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.25;
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      s.connect(hp).connect(ctx.destination);
      s.start();
    },
    update(inside, doorAmt) {
      if (!humGain) return;
      const target = inside ? 0.05 : 0.008 + doorAmt * 0.012;
      humGain.gain.value += (target - humGain.gain.value) * 0.05;
    },
  };
}
