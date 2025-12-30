const AudioContextClass = (window.AudioContext ??
  (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
let audioCtx: AudioContext | null = null;
let explosionBuffer: AudioBuffer | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createExplosionBuffer = () => {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const playExplosion = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  if (!explosionBuffer) {
    explosionBuffer = createExplosionBuffer();
  }
  if (!explosionBuffer) return;

  const noise = audioCtx.createBufferSource();
  noise.buffer = explosionBuffer;

  const gain = audioCtx.createGain();
  
  // Lowpass filter for "boom"
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  // Envelope
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

  noise.start(now);
  noise.stop(now + 1);
};

export const playLaunch = () => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
};
