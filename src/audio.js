// Tiny synthesized soundscape: an original door chime, fridge hum, register
// beeps, footsteps and UI blips. Everything runs through one master volume.
export function createAudio() {
  let ctx = null, master = null, humGain = null, volume = 0.8;

  function start() {
    if (ctx) return;
    try { ctx = new AudioContext(); } catch { return; }
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    // brown noise → low-pass = refrigeration hum
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const hum = ctx.createBufferSource();
    hum.buffer = buf;
    hum.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    humGain = ctx.createGain();
    humGain.gain.value = 0;
    hum.connect(lp).connect(humGain).connect(master);
    hum.start();
  }

  function tone(freq, t0, dur, vol = 0.12, type = 'sine') {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noise(dur, freq, vol, type = 'bandpass') {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(master);
    s.start();
  }

  return {
    start,
    setVolume(v) { volume = v; if (master) master.gain.value = v; },
    // an original little "hop" motif — four rising notes and a settle
    chime(short = false) {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05;
      const notes = short ? [987.8, 1318.5] : [659.3, 784.0, 987.8, 1318.5, 1174.7];
      notes.forEach((f, i) => {
        tone(f, t + i * 0.16, 0.9, 0.09);
        tone(f * 2, t + i * 0.16, 0.4, 0.015, 'triangle');
      });
    },
    beep() { if (ctx) tone(2093, ctx.currentTime, 0.09, 0.05, 'square'); },
    ding() { if (ctx) { tone(1760, ctx.currentTime, 1.2, 0.08); tone(2637, ctx.currentTime, 0.8, 0.03); } },
    blip() { if (ctx) tone(1567.98, ctx.currentTime, 0.18, 0.05, 'triangle'); },
    step(inside) { noise(0.07, inside ? 1800 : 900, inside ? 0.05 : 0.08); },
    rustle() { noise(0.18, 3500, 0.25, 'highpass'); },
    update(inside, doorAmt) {
      if (!humGain) return;
      const target = inside ? 0.05 : 0.008 + doorAmt * 0.012;
      humGain.gain.value += (target - humGain.gain.value) * 0.05;
    },
  };
}
