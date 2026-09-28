/**
 * MicButton — universal recording button with built-in text fallback.
 * Works on mobile (no HTTPS needed for MediaRecorder on same-origin).
 * Shows a text input automatically if mic permission is denied or unavailable.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Keyboard, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { speechService } from '../../services/speechService';

interface MicButtonProps {
  onResult: (text: string) => void;        // called with final transcript
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  className?: string;
}

export default function MicButton({
  onResult,
  disabled = false,
  size = 'md',
  placeholder = 'Tap mic or type…',
  className,
}: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interim, setInterim] = useState('');
  const [showText, setShowText] = useState(false);
  const [typed, setTyped] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return speechService.subscribe(s => {
      if (s.interimTranscript !== undefined) setInterim(s.interimTranscript);
      if (s.audioLevel !== undefined) setAudioLevel(s.audioLevel);
      if (s.recordingState === 'idle') setRecording(false);
    });
  }, []);

  async function startRec() {
    if (!speechService.isSupported) { setShowText(true); return; }
    setError(''); setInterim('');
    try {
      await speechService.startRecording();
      setRecording(true); setTimer(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Mic error';
      // Permission denied or unavailable → show text input
      if (msg.includes('denied') || msg.includes('not allowed') || msg.includes('supported')) {
        setShowText(true);
      } else {
        setError(msg);
      }
    }
  }

  async function stopRec() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false); setProcessing(true); setInterim('');
    const text = await speechService.stopRecording();
    setProcessing(false);
    if (text.trim()) { onResult(text.trim()); }
    else { setError('No speech detected — try typing instead'); setShowText(true); }
  }

  function sendTyped() {
    if (!typed.trim()) return;
    onResult(typed.trim());
    setTyped(''); setShowText(false);
  }

  const dim = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-16 h-16' };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      {/* Waveform + timer */}
      <AnimatePresence>
        {recording && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{fmt(timer)}</span>
            <div className="flex items-end gap-0.5 h-6">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-1 bg-violet-500 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(3, audioLevel * 24 * (0.3 + Math.abs(Math.sin(Date.now() / 110 + i)) * 0.7))}px` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim transcript */}
      <AnimatePresence>
        {interim && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-gray-400 italic max-w-xs text-center truncate">
            {interim}…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main mic button */}
      <div className="relative">
        {recording && (
          <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30 pointer-events-none" />
        )}
        <motion.button
          whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
          onClick={recording ? stopRec : startRec}
          disabled={disabled || processing}
          className={clsx(
            dim[size], 'rounded-full flex items-center justify-center shadow-xl transition-all',
            processing ? 'bg-gray-700 cursor-not-allowed' :
            recording ? 'bg-gradient-to-br from-red-600 to-pink-600 shadow-red-500/40' :
            'bg-gradient-to-br from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-500/40',
            (disabled || processing) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {processing ? <Loader2 className="w-6 h-6 text-white animate-spin" /> :
           recording ? <MicOff className="w-6 h-6 text-white" /> :
           <Mic className="w-6 h-6 text-white" />}
        </motion.button>
      </div>

      {/* Error + type fallback toggle */}
      {error && !showText && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => { setShowText(true); setError(''); }}
            className="text-xs text-violet-400 underline">type instead</button>
        </div>
      )}

      {/* Keyboard toggle */}
      {!showText && !recording && (
        <button onClick={() => setShowText(true)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-0.5">
          <Keyboard className="w-3.5 h-3.5" /> type instead
        </button>
      )}

      {/* Text input fallback */}
      <AnimatePresence>
        {showText && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="w-full max-w-sm">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-2xl px-3 py-2 mt-1">
              <input
                ref={inputRef}
                value={typed}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendTyped()}
                placeholder={placeholder}
                autoFocus
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
              />
              <button onClick={sendTyped} disabled={!typed.trim()}
                className="text-violet-400 hover:text-white disabled:opacity-30 transition-colors">
                <Send className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowText(false); setTyped(''); }}
                className="text-gray-600 hover:text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
