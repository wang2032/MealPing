/**
 * Tiny wrapper around Web Speech API (SpeechSynthesis) for short voice prompts.
 * - Works offline on modern browsers (Chrome, Edge, Safari, mobile WebView).
 * - Falls back silently when unsupported.
 * - Caches the best Chinese voice once available (voices load asynchronously).
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Prefer zh-CN, then any zh-*, then default.
  const zhCN = voices.find((v) => v.lang?.toLowerCase() === 'zh-cn');
  const zhAny = voices.find((v) => v.lang?.toLowerCase().startsWith('zh'));
  cachedVoice = zhCN ?? zhAny ?? voices[0] ?? null;
  return cachedVoice;
}

function ensureVoicesLoaded(): void {
  if (voicesLoaded) return;
  if (typeof speechSynthesis === 'undefined') return;
  voicesLoaded = true;
  // Voices may load asynchronously
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
    pickVoice();
  });
}

export interface SpeakOptions {
  /** 0.1 ~ 10, default 1 */
  rate?: number;
  /** 0 ~ 1, default 1 */
  volume?: number;
  /** 0 ~ 2, default 1 */
  pitch?: number;
  /** Cancel any in-flight utterance before this one. Default true. */
  interrupt?: boolean;
}

/**
 * Speak a short Chinese phrase. No-op when the API is unavailable or muted.
 * Browsers require a prior user gesture before the first speak() — call this
 * from a user-initiated handler (button click, etc.) the first time.
 */
export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!text || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
    return;
  }
  ensureVoicesLoaded();

  if (opts.interrupt !== false) {
    try {
      speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = opts.rate ?? 1;
  u.volume = opts.volume ?? 1;
  u.pitch = opts.pitch ?? 1;
  const voice = pickVoice();
  if (voice) u.voice = voice;

  try {
    speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

/** Try to "warm up" speech so first prompt is not delayed. Call from a click handler. */
export function primeSpeech(): void {
  if (typeof speechSynthesis === 'undefined') return;
  ensureVoicesLoaded();
  // A zero-volume empty utterance counts as a user-gesture-bound activation.
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

/** Play a short ding before speech, useful for the admin dashboard. */
export function chime(): void {
  try {
    const AudioCtx =
      (window.AudioContext as typeof AudioContext) ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    osc.onended = () => ctx.close();
  } catch {
    // ignore
  }
}
