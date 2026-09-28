/**
 * speechService.ts — Mobile-first audio recording
 * Android Chrome: MediaRecorder → Whisper API
 * iOS Safari: ScriptProcessor WAV → Whisper API
 * Fallback: Web Speech API interim transcripts only
 */
import type { SpeechState } from '../types';
import { getApiKey } from './aiService';

type CB = (s: Partial<SpeechState>) => void;

// ── WSR types ────────────────────────────────────────────────────
interface WSRResult { [i: number]: { transcript: string; confidence: number }; isFinal: boolean; length: number }
interface WSRResultList { [i: number]: WSRResult; length: number }
interface WSREvent { results: WSRResultList; resultIndex: number }
interface WSRInstance {
  continuous: boolean; interimResults: boolean; lang: string; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: WSREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => WSRInstance;
    webkitSpeechRecognition?: new () => WSRInstance;
  }
}

// ── Whisper API ───────────────────────────────────────────────────
async function whisper(blob: Blob): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');
  const mime = blob.type || 'audio/webm';
  const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', blob, `audio.${ext}`);
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('response_format', 'text');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Whisper ${res.status}`); }
  return (await res.text()).trim();
}

// ── Best MIME ─────────────────────────────────────────────────────
function bestMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
  return list.find(m => m === '' || MediaRecorder.isTypeSupported(m)) ?? '';
}

// ── iOS detection ─────────────────────────────────────────────────
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// ── WAV encoding ──────────────────────────────────────────────────
function encodeWav(samples: Float32Array, sr: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const s = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true);
  s(8, 'WAVE'); s(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, 'data'); v.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (const x of samples) { const val = Math.max(-1, Math.min(1, x)); v.setInt16(off, val < 0 ? val * 0x8000 : val * 0x7FFF, true); off += 2; }
  return buf;
}

// ── iOS WAV recorder ─────────────────────────────────────────────
class IosRecorder {
  private ctx: AudioContext | null = null;
  private proc: ScriptProcessorNode | null = null;
  private src: MediaStreamAudioSourceNode | null = null;
  private samples: Float32Array[] = [];

  async start(stream: MediaStream) {
    this.samples = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC() as AudioContext;
    this.proc = this.ctx.createScriptProcessor(4096, 1, 1);
    this.src = this.ctx.createMediaStreamSource(stream);
    this.proc.onaudioprocess = (e: AudioProcessingEvent) => {
      this.samples.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    this.src.connect(this.proc);
    if (this.ctx) this.proc.connect(this.ctx.destination);
  }

  stop(): Blob {
    if (this.proc) { this.proc.disconnect(); }
    if (this.src) { this.src.disconnect(); }
    const sr = this.ctx?.sampleRate ?? 44100;
    this.ctx?.close();
    const total = this.samples.reduce((a, b) => a + b.length, 0);
    const merged = new Float32Array(total);
    let off = 0;
    for (const s of this.samples) { merged.set(s, off); off += s.length; }
    return new Blob([encodeWav(merged, sr)], { type: 'audio/wav' });
  }
}

// ════════════════════════════════════════════════════════════════
class SpeechService {
  private cbs: CB[] = [];
  private isActive = false;

  // MediaRecorder
  private mr: MediaRecorder | null = null;
  private mrStream: MediaStream | null = null;
  private chunks: Blob[] = [];

  // iOS
  private iosRec: IosRecorder | null = null;
  private iosStream: MediaStream | null = null;

  // WSR
  private wsr: WSRInstance | null = null;
  private wsrText = '';
  private wsrRetries = 0;
  private wsrTimer: ReturnType<typeof setTimeout> | null = null;

  // Visualizer
  private visCtx: AudioContext | null = null;
  private visAnalyser: AnalyserNode | null = null;
  private visFrame: number | null = null;

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices !== 'undefined';
  }

  subscribe(cb: CB) {
    this.cbs.push(cb);
    return () => { this.cbs = this.cbs.filter(c => c !== cb); };
  }

  private emit(s: Partial<SpeechState>) { this.cbs.forEach(c => c(s)); }

  async startRecording(): Promise<void> {
    if (!this.isSupported) throw new Error('Microphone not available in this browser.');
    this.isActive = true;
    this.chunks = [];
    this.wsrText = '';
    this.emit({ transcript: '', interimTranscript: '', confidence: 0, recordingState: 'recording', errorMessage: undefined });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.startVis(stream);

    if (isIOS()) {
      this.iosStream = stream;
      this.iosRec = new IosRecorder();
      await this.iosRec.start(stream);
    } else {
      this.mrStream = stream;
      const mime = bestMime();
      try {
        this.mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        this.mr = new MediaRecorder(stream);
      }
      this.mr.ondataavailable = e => { if (e.data?.size > 0) this.chunks.push(e.data); };
      this.mr.start(300);
    }
    this.startWSR();
  }

  stopRecording(): Promise<string> {
    return new Promise(resolve => {
      this.isActive = false;
      this.stopWSR();
      this.stopVis();

      if (isIOS() && this.iosRec) {
        const blob = this.iosRec.stop();
        this.iosStream?.getTracks().forEach(t => t.stop());
        this.iosStream = null; this.iosRec = null;
        this.emit({ recordingState: 'processing' });
        this.transcribe(blob, resolve);
        return;
      }

      if (!this.mr || this.mr.state === 'inactive') {
        this.cleanupMr();
        this.emit({ recordingState: 'processing' });
        this.transcribe(null, resolve);
        return;
      }

      this.mr.onstop = () => {
        const mime = this.mr?.mimeType ?? 'audio/webm';
        const blob = new Blob(this.chunks, { type: mime });
        this.chunks = [];
        this.cleanupMr();
        this.emit({ recordingState: 'processing' });
        this.transcribe(blob, resolve);
      };
      this.mr.stop();
    });
  }

  private async transcribe(blob: Blob | null, resolve: (s: string) => void) {
    if (blob && blob.size > 500 && getApiKey()) {
      try {
        const text = await whisper(blob);
        if (text) { this.emit({ transcript: text, confidence: 0.95, recordingState: 'idle' }); resolve(text); return; }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg !== 'NO_API_KEY') console.warn('Whisper failed:', msg);
      }
    }
    const fb = this.wsrText.trim();
    this.emit({ transcript: fb, recordingState: 'idle' });
    resolve(fb);
  }

  abortRecording() {
    this.isActive = false;
    this.stopWSR(); this.stopVis();
    if (this.iosRec) { try { this.iosRec.stop(); } catch { /* ok */ } this.iosRec = null; }
    if (this.iosStream) { this.iosStream.getTracks().forEach(t => t.stop()); this.iosStream = null; }
    if (this.mr && this.mr.state !== 'inactive') { try { this.mr.stop(); } catch { /* ok */ } }
    this.cleanupMr();
    this.chunks = []; this.wsrText = '';
    this.emit({ recordingState: 'idle', transcript: '', interimTranscript: '' });
  }

  private startWSR() {
    const API = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!API) return;
    this.wsr = new API();
    this.wsr.continuous = true;
    this.wsr.interimResults = true;
    this.wsr.lang = 'en-US';
    this.wsr.maxAlternatives = 1;
    this.wsr.onstart = () => {};
    this.wsr.onresult = (e: WSREvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) { this.wsrText += r[0].transcript + ' '; this.emit({ transcript: this.wsrText.trim() }); }
        else interim = r[0].transcript;
      }
      this.emit({ interimTranscript: interim });
    };
    this.wsr.onerror = () => {
      if (this.isActive && this.wsrRetries < 2) { this.wsrRetries++; this.wsrTimer = setTimeout(() => this.restartWSR(), 1200); }
    };
    this.wsr.onend = () => {
      if (this.isActive && this.wsrRetries < 3) { this.wsrRetries++; this.wsrTimer = setTimeout(() => this.restartWSR(), 400); }
    };
    try { this.wsr.start(); } catch { /* ok */ }
  }

  private restartWSR() {
    if (!this.isActive || !this.wsr) return;
    try { this.wsr.abort(); } catch { /* ok */ }
    setTimeout(() => { if (this.isActive) try { this.wsr?.start(); } catch { /* ok */ } }, 80);
  }

  private stopWSR() {
    if (this.wsrTimer) { clearTimeout(this.wsrTimer); this.wsrTimer = null; }
    if (this.wsr) { try { this.wsr.abort(); } catch { /* ok */ } this.wsr = null; }
    this.wsrRetries = 0;
  }

  private startVis(stream: MediaStream) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.visCtx = new AC() as AudioContext;
      this.visAnalyser = this.visCtx.createAnalyser();
      this.visAnalyser.fftSize = 256;
      this.visCtx.createMediaStreamSource(stream).connect(this.visAnalyser);
      const buf = new Uint8Array(this.visAnalyser.frequencyBinCount);
      const tick = () => {
        if (!this.visAnalyser || !this.isActive) return;
        this.visAnalyser.getByteFrequencyData(buf);
        this.emit({ audioLevel: Math.min(1, buf.reduce((a, b) => a + b, 0) / buf.length / 80) });
        this.visFrame = requestAnimationFrame(tick);
      };
      this.visFrame = requestAnimationFrame(tick);
    } catch { /* non-critical */ }
  }

  private stopVis() {
    if (this.visFrame !== null) { cancelAnimationFrame(this.visFrame); this.visFrame = null; }
    if (this.visCtx) { this.visCtx.close().catch(() => {}); this.visCtx = null; }
    this.visAnalyser = null;
    this.emit({ audioLevel: 0 });
  }

  private cleanupMr() {
    this.mrStream?.getTracks().forEach(t => t.stop());
    this.mrStream = null; this.mr = null;
  }
}

export const speechService = new SpeechService();

// ── TTS ───────────────────────────────────────────────────────────
export function speak(text: string, opts: { rate?: number; voice?: string; onEnd?: () => void } = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.95; u.pitch = 1; u.volume = 1; u.lang = 'en-US';
  const assign = () => {
    const vs = window.speechSynthesis.getVoices();
    const pick = (opts.voice ? vs.find(v => v.name === opts.voice) : null)
      ?? vs.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Natural')))
      ?? vs.find(v => v.lang.startsWith('en'));
    if (pick) u.voice = pick;
  };
  window.speechSynthesis.getVoices().length ? assign() : window.speechSynthesis.addEventListener('voiceschanged', assign, { once: true });
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() { window.speechSynthesis?.cancel(); }
export function isSpeaking() { return window.speechSynthesis?.speaking ?? false; }
export function getAvailableVoices() { return window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('en')) ?? []; }
