/**
 * EVM Audio Beep Synthesizer using Web Audio API
 * Generates the authentic electronic voting machine confirmation sound
 */

let audioCtx = null;
let soundEnabled = true;

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  return soundEnabled;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function playEvmBeep() {
  if (!soundEnabled) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // Crisp electronic tone
    osc.frequency.setValueAtTime(1050, audioCtx.currentTime); // ~1050Hz signature EVM tone

    // Volume envelope: smooth onset, steady hold, slight fade-out
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.setValueAtTime(0.25, now + 0.65);
    gain.gain.linearRampToValueAtTime(0, now + 0.75);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  } catch (err) {
    console.warn('Web Audio playback failed or blocked:', err);
  }
}
