/**
 * Tiny wrapper around Web Speech API (SpeechSynthesis) for short voice prompts.
 * - Works offline on modern browsers (Chrome, Edge, Safari, mobile WebView).
 * - Falls back silently when unsupported.
 *
 * Voice picking strategy: prefer an explicit zh-* voice when available,
 * but if the only voices are non-Chinese, leave `voice` unset and rely on
 * `lang='zh-CN'` — browsers/OS will route to the system Chinese TTS engine
 * (or fall back gracefully) instead of forcing English voice to read CJK.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceResolved = false;
let voicesLoaded = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voiceResolved) return cachedVoice;
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const zhCN = voices.find((v) => v.lang?.toLowerCase() === 'zh-cn');
  const zhAny = voices.find((v) => v.lang?.toLowerCase().startsWith('zh'));
  cachedVoice = zhCN ?? zhAny ?? null;
  voiceResolved = true;
  return cachedVoice;
}

function ensureVoicesLoaded(): void {
  if (voicesLoaded) return;
  if (typeof speechSynthesis === 'undefined') return;
  voicesLoaded = true;
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    voiceResolved = false;
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
  /** Cancel any in-flight utterance before this one. Default false — most
   * prompts are short and queueing is friendlier than chopping the previous one. */
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

  if (opts.interrupt === true) {
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
