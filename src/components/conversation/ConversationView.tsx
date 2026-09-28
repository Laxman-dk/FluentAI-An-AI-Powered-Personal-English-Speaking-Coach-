import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, VolumeX, RotateCcw, ChevronRight,
  X, Info, AlertCircle, Loader2, WifiOff,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { speechService, speak, stopSpeaking, isSpeaking } from '../../services/speechService';
import { getCoachResponse, analyzeUserSpeech, hasApiKey } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import type { ConversationMessage, PracticeMode, CorrectionMode } from '../../types';
import ApiKeyModal from '../settings/ApiKeyModal';

interface ConversationViewProps {
  mode?: PracticeMode;
  topic?: string;
  openingMessage?: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

// ─────────────────────────────────────────────
//  Message bubble
// ─────────────────────────────────────────────

function MessageBubble({
  message,
  voiceEnabled,
  onSpeak,
}: {
  message: ConversationMessage;
  voiceEnabled: boolean;
  onSpeak: (text: string) => void;
}) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const isUser = message.role === 'user';
  const isCoach = message.role === 'coach';
  const analysis = message.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-1',
        isCoach ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-gray-700 text-white'
      )}>
        {isCoach ? '🎙' : '👤'}
      </div>

      <div className={clsx('flex-1 space-y-2', isUser ? 'items-end flex flex-col' : '')}>
        {/* Main bubble */}
        <div className={clsx(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%]',
          isCoach
            ? 'bg-gray-800 border border-gray-700/50 text-gray-100'
            : 'bg-blue-600 text-white',
          message.isTyping && 'animate-pulse'
        )}>
          {message.isTyping ? (
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>

        {/* Action bar */}
        {!message.isTyping && (
          <div className={clsx('flex items-center gap-2', isUser ? 'flex-row-reverse' : '')}>
            {isCoach && voiceEnabled && (
              <button
                onClick={() => onSpeak(message.text)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Listen"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            {isUser && analysis && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                {(analysis.grammarErrors?.length ?? 0)} corrections
              </button>
            )}
            <span className="text-gray-600 text-[10px]">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Analysis panel */}
        <AnimatePresence>
          {showAnalysis && analysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-lg"
            >
              <Card variant="glass" padding="sm" className="border border-blue-500/20 space-y-3 text-xs">
                {/* Corrections */}
                {(analysis.grammarErrors?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    {analysis.grammarErrors!.map((err) => (
                      <div key={err.id} className="bg-gray-800/60 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-400 line-through">{err.original}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-emerald-400 font-medium">{err.corrected}</span>
                          <Badge
                            variant={err.severity === 'major' ? 'red' : err.severity === 'moderate' ? 'yellow' : 'gray'}
                            size="sm"
                          >
                            {err.type}
                          </Badge>
                        </div>
                        <p className="text-gray-400">{err.explanation}</p>
                        {err.example && (
                          <p className="text-blue-400 italic">Practice: "{err.example}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Better version */}
                {analysis.betterVersion && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                    <div className="text-emerald-400 font-semibold mb-1">✅ More natural version</div>
                    <p className="text-gray-300 italic">"{analysis.betterVersion}"</p>
                  </div>
                )}

                {/* Vocab suggestions */}
                {(analysis.vocabSuggestions?.length ?? 0) > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
                    <div className="text-purple-400 font-semibold mb-1.5">📚 Vocabulary suggestions</div>
                    {analysis.vocabSuggestions!.map((v) => (
                      <div key={v.original} className="flex flex-wrap gap-1 items-center">
                        <span className="text-gray-400">Instead of <span className="text-white">"{v.original}"</span>, try:</span>
                        {v.alternatives.map((alt) => (
                          <span key={alt} className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                            {alt}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Positives */}
                {(analysis.positives?.length ?? 0) > 0 && (
                  <div className="text-gray-400 flex flex-wrap gap-1">
                    {analysis.positives!.map((p) => (
                      <span key={p} className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Waveform
// ─────────────────────────────────────────────

function Waveform({ level, active }: { level: number; active: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className={clsx('w-1 rounded-full transition-all duration-75', active ? 'bg-blue-500' : 'bg-gray-600')}
          style={{
            height: active
              ? `${Math.max(4, level * 32 * (0.3 + Math.abs(Math.sin(Date.now() / 120 + i * 0.7)) * 0.7))}px`
              : '4px',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Conversation Component
// ─────────────────────────────────────────────

export default function ConversationView({
  mode = 'conversation',
  topic = 'General English conversation',
  openingMessage,
}: ConversationViewProps) {
  const { profile, addMessage, activeSession, startSession, endSession, updateStreak } = useAppStore();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>(
    profile?.settings.correctionMode ?? 'normal'
  );
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [showApiModal, setShowApiModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [speechError, setSpeechError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef(Date.now());

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration(Math.round((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, []);

  // Speech service subscription
  useEffect(() => {
    return speechService.subscribe((state) => {
      if (state.interimTranscript !== undefined) setInterimTranscript(state.interimTranscript);
      if (state.audioLevel !== undefined) setAudioLevel(state.audioLevel);
      if (state.recordingState === 'idle' && isRecording) setIsRecording(false);
      if (state.errorMessage) {
        const msg = state.errorMessage;
        setSpeechError(msg);
        const isNet = msg.toLowerCase().includes('connection') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('internet');
        setIsNetworkError(isNet);
        if (isNet) {
          setIsRecording(false);
        }
      }
    });
  }, [isRecording]);

  // Opening message
  useEffect(() => {
    const opening = openingMessage || getDefaultOpening(mode, profile?.name ?? 'there');
    const msg: ConversationMessage = {
      id: generateId(),
      role: 'coach',
      text: opening,
      timestamp: new Date().toISOString(),
    };
    setMessages([msg]);
    if (voiceEnabled) speak(opening, { rate: profile?.settings.voiceSpeed ?? 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getDefaultOpening(m: PracticeMode, name: string): string {
    const openings: Record<PracticeMode, string> = {
      conversation: `Hi ${name}! I'm Coach Alex, your personal English speaking coach. Let's have a natural conversation today. How are you doing, and what's been on your mind lately?`,
      interview: `Good morning! Thank you for coming in today. I'm the hiring manager. Please have a seat. To start, could you tell me about yourself and what drew you to apply for this position?`,
      'group-discussion': `Welcome to today's group discussion. The topic is: "${topic}". Please take a moment to gather your thoughts, then share your opening perspective. Go ahead whenever you're ready.`,
      presentation: `Welcome! I'm your audience and coach today. Please begin your presentation on "${topic}" whenever you're ready. Take a deep breath — you've got this!`,
      roleplay: openingMessage || `Let's begin the roleplay scenario. Stay in character and respond naturally. I'll start us off.`,
      pronunciation: `Let's work on your pronunciation today. I'll give you words and phrases to practice. Don't worry about perfection — we're building muscle memory. Ready to start?`,
      assessment: `Hi ${name}! Let's begin your speaking assessment. I'll ask you a few questions. Just answer naturally in English. First question: Can you tell me about yourself?`,
    };
    return openings[m];
  }

  async function handleStartRecording() {
    setSpeechError('');
    setIsNetworkError(false);
    try {
      await speechService.startRecording();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTimer((t) => t + 1), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Microphone error';
      setSpeechError(msg);
    }
  }

  async function handleStopRecording() {
    setIsRecording(false);
    setRecordingTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    setInterimTranscript('');

    const finalText = await speechService.stopRecording();

    const text = finalText || '';
    if (!text.trim()) {
      setSpeechError('No speech detected. Please try again.');
      return;
    }

    await processUserMessage(text.trim());
  }

  const processUserMessage = useCallback(async (text: string) => {
    if (!profile) return;
    setIsProcessing(true);

    // Add user message immediately
    const userMsg: ConversationMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Typing indicator
    const typingMsg: ConversationMessage = {
      id: 'typing',
      role: 'coach',
      text: '',
      timestamp: new Date().toISOString(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      if (!hasApiKey()) {
        setShowApiModal(true);
        setMessages((prev) => prev.filter((m) => m.id !== 'typing'));
        setIsProcessing(false);
        return;
      }

      // Parallel: get coach response + analyze speech
      const [coachText, analysis] = await Promise.all([
        getCoachResponse(text, messages, profile, mode, correctionMode),
        analyzeUserSpeech(text, profile, correctionMode),
      ]);

      // Update user message with analysis
      const analyzedUserMsg: ConversationMessage = { ...userMsg, analysis };

      const coachMsg: ConversationMessage = {
        id: generateId(),
        role: 'coach',
        text: coachText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'typing' && m.id !== userMsg.id),
        analyzedUserMsg,
        coachMsg,
      ]);

      if (voiceEnabled) {
        speak(coachText, { rate: profile.settings.voiceSpeed ?? 1 });
      }

      updateStreak();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      setMessages((prev) => prev.filter((m) => m.id !== 'typing'));

      if (msg === 'NO_API_KEY' || msg.includes('NO_API_KEY')) {
        setShowApiModal(true);
      } else {
        const errMsg: ConversationMessage = {
          id: generateId(),
          role: 'coach',
          text: `I'm having trouble connecting right now. Please check your API key in Settings and try again. (${msg})`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        toast.error('AI response failed. Check your API key.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [profile, messages, mode, correctionMode, voiceEnabled, updateStreak]);

  function handleSpeak(text: string) {
    if (isSpeaking()) { stopSpeaking(); return; }
    speak(text, { rate: profile?.settings.voiceSpeed ?? 1 });
  }

  function clearSession() {
    stopSpeaking();
    const opening = getDefaultOpening(mode, profile?.name ?? 'there');
    const msg: ConversationMessage = {
      id: generateId(),
      role: 'coach',
      text: opening,
      timestamp: new Date().toISOString(),
    };
    setMessages([msg]);
    if (voiceEnabled) speak(opening);
  }

  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const userMessages = messages.filter((m) => m.role === 'user');

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* API key modal */}
      <ApiKeyModal open={showApiModal} onClose={() => setShowApiModal(false)} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-sm">
            🎙️
          </div>
          <div>
            <div className="text-white font-semibold text-sm capitalize">
              {mode === 'group-discussion' ? 'Group Discussion' : mode.replace(/-/g, ' ')}
            </div>
            <div className="text-gray-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {minutes}:{seconds.toString().padStart(2, '0')} • {userMessages.length} responses
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Correction mode */}
          <select
            value={correctionMode}
            onChange={(e) => setCorrectionMode(e.target.value as CorrectionMode)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="gentle">Gentle</option>
            <option value="normal">Normal</option>
            <option value="strict">Strict</option>
          </select>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              voiceEnabled ? 'text-blue-400 bg-blue-500/15' : 'text-gray-500 bg-gray-800'
            )}
            title={voiceEnabled ? 'Mute coach voice' : 'Enable coach voice'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={clearSession}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 bg-gray-800 transition-colors"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            voiceEnabled={voiceEnabled}
            onSpeak={handleSpeak}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Live transcript */}
      <AnimatePresence>
        {(isRecording && interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 italic">
              {interimTranscript}…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {speechError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-2"
          >
            {isNetworkError ? (
              <div className="bg-amber-600/15 border border-amber-500/30 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-sm font-medium">
                  <WifiOff className="w-4 h-4 flex-shrink-0" />
                  Speech recognition lost connection — retrying automatically…
                </div>
                <p className="text-gray-400 text-xs">
                  The browser sends audio to Google's servers for transcription — a brief internet hiccup can cause this.
                  It will retry on its own. If it keeps failing, check your connection or refresh the page.
                </p>
                <button
                  onClick={() => { setSpeechError(''); setIsNetworkError(false); }}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {speechError}
                <button onClick={() => { setSpeechError(''); setIsNetworkError(false); }} className="ml-auto">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="px-4 pb-6 pt-2 bg-gray-950 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          {/* Waveform / timer */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isRecording && (
              <span className="text-sm text-gray-400 font-mono min-w-[2.5rem]">
                {Math.floor(recordingTimer / 60)}:{(recordingTimer % 60).toString().padStart(2, '0')}
              </span>
            )}
            <Waveform level={audioLevel} active={isRecording} />
          </div>

          {/* Mic button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            className={clsx(
              'relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0',
              isProcessing
                ? 'bg-gray-700 cursor-not-allowed'
                : isRecording
                ? 'bg-red-600 shadow-red-600/40 animate-glow'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40'
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </motion.button>

          {/* Hint text */}
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-xs">
              {isProcessing
                ? 'Analyzing your response…'
                : isRecording
                ? 'Tap to stop recording'
                : 'Tap the mic to speak'}
            </p>
            {!isRecording && !isProcessing && (
              <p className="text-gray-600 text-xs mt-0.5">
                Mode: <span className="text-gray-500 capitalize">{correctionMode} corrections</span>
              </p>
            )}
          </div>

          {/* Useful phrases button */}
          <button
            onClick={() => toast('📚 Useful phrases coming up! Try: "I would like to add..." or "From my perspective..."', { duration: 4000 })}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
            title="Useful phrases"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!speechService.isSupported && (
          <p className="text-center text-xs text-amber-400 mt-2">
            ⚠️ Speech recognition not supported in this browser. Try Chrome or Edge.
          </p>
        )}
      </div>
    </div>
  );
}
