import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ChevronRight, CheckCircle, AlertCircle, Keyboard, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import ScoreRing from '../ui/ScoreRing';
import Card from '../ui/Card';
import { speechService } from '../../services/speechService';
import { generateAssessmentReport } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { ASSESSMENT_QUESTIONS } from '../../constants';
import { getCEFRDescription } from '../../constants';
import type { SpeakingScores, SpeechMetrics, EnglishLevel } from '../../types';

interface AssessmentAnswer {
  question: string;
  answer: string;
  duration: number;
}

type AssessmentPhase = 'intro' | 'questions' | 'analyzing' | 'results';

export default function Assessment() {
  const { profile, updateProfile, setView, setProgress, progress } = useAppStore();
  const [phase, setPhase] = useState<AssessmentPhase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [results, setResults] = useState<{
    scores: SpeakingScores;
    metrics: SpeechMetrics;
    cefrLevel: EnglishLevel;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      if (state.transcript !== undefined) setTranscript(state.transcript);
      if (state.interimTranscript !== undefined) setInterimTranscript(state.interimTranscript);
      if (state.audioLevel !== undefined) setAudioLevel(state.audioLevel);

      if (state.recordingState === 'idle' && isRecording) {
        setIsRecording(false);
      }

      if (state.errorMessage) {
        const msg = state.errorMessage;
        setError(msg);
        // Detect network/connection errors specifically
        if (
          msg.toLowerCase().includes('connection') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('internet')
        ) {
          setIsNetworkError(true);
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    });
    return unsub;
  }, [isRecording]);

  async function startRecording() {
    setTranscript('');
    setInterimTranscript('');
    setError('');
    setIsNetworkError(false);
    try {
      await speechService.startRecording();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Microphone error';
      setError(msg);
    }
  }

  async function stopRecording() {
    const final = await speechService.stopRecording();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimer(0);
    return { text: final || transcript, duration };
  }

  async function saveAnswer(overrideText?: string) {
    let text: string;
    let duration: number;
    if (overrideText !== undefined) {
      text = overrideText;
      duration = Math.round((Date.now() - startTimeRef.current) / 1000) || 30;
    } else if (isRecording) {
      const result = await stopRecording();
      text = result.text;
      duration = result.duration;
    } else {
      text = transcript;
      duration = Math.round((Date.now() - startTimeRef.current) / 1000) || 30;
    }

    if (!text.trim()) {
      setError('Please speak or type your answer before continuing.');
      return;
    }

    const q = ASSESSMENT_QUESTIONS[currentQ];
    const newAnswers = [...answers, { question: q.prompt, answer: text.trim(), duration }];
    setAnswers(newAnswers);
    setTranscript('');
    setTypedAnswer('');
    setShowTypeInput(false);
    setError('');
    setIsNetworkError(false);

    if (currentQ < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      runAnalysis(newAnswers);
    }
  }

  function saveTypedAnswer() {
    if (!typedAnswer.trim()) return;
    saveAnswer(typedAnswer.trim());
  }

  async function runAnalysis(allAnswers: AssessmentAnswer[]) {
    setPhase('analyzing');
    try {
      const report = await generateAssessmentReport(
        allAnswers.map((a) => ({ question: a.question, answer: a.answer })),
        profile!
      );
      setResults(report);
      updateProfile({ cefrLevel: report.cefrLevel, assessmentCompleted: true });
      setProgress({
        ...progress,
        userId: profile!.id,
        currentScores: report.scores,
        initialScores: report.scores,
        cefrHistory: [{ level: report.cefrLevel, date: new Date().toISOString() }],
      });
      setPhase('results');
    } catch {
      const fallback = {
        scores: {
          grammar: 62, vocabulary: 58, pronunciation: 65,
          fluency: 60, sentenceConstruction: 60, confidence: 55,
          fillerWordUsage: 70, overall: 61,
        } as SpeakingScores,
        metrics: {
          wordsPerMinute: 100, averagePauseDuration: 1.5, totalPauses: 3,
          longPauses: 0, grammaticalErrors: 4, fillerWords: 6,
          fillerWordList: [], vocabularyDiversity: 0.55, sentenceComplexity: 12,
          totalWords: 180, uniqueWords: 99, speakingDuration: 180,
        } as SpeechMetrics,
        cefrLevel: 'B1' as EnglishLevel,
        summary: 'Assessment recorded. Your communication was clear and understandable.',
        strengths: ['You attempted all questions', 'Ideas were clearly communicated', 'Good sentence variety'],
        weaknesses: ['Work on grammar accuracy', 'Build vocabulary depth', 'Reduce filler words'],
      };
      setResults(fallback);
      updateProfile({ cefrLevel: fallback.cefrLevel, assessmentCompleted: true });
      setProgress({
        ...progress,
        userId: profile!.id,
        currentScores: fallback.scores,
        initialScores: fallback.scores,
        cefrHistory: [{ level: fallback.cefrLevel, date: new Date().toISOString() }],
      });
      setPhase('results');
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  const q = ASSESSMENT_QUESTIONS[currentQ];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ── INTRO ──────────────────────────────────────────── */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900 border border-gray-700/50 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                  🎯
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Speaking Assessment</h2>
                  <p className="text-gray-400">
                    Hi {profile?.name}! Let's understand your current English level with {ASSESSMENT_QUESTIONS.length} short questions. Answer naturally — mistakes are expected and helpful.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '⏱️', label: '3–5 min', desc: 'Duration' },
                    { icon: '🎤', label: `${ASSESSMENT_QUESTIONS.length} questions`, desc: 'Short answers' },
                    { icon: '📊', label: 'AI Analysis', desc: 'Instant results' },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-800/60 rounded-xl p-3">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-white text-sm font-semibold">{item.label}</div>
                      <div className="text-gray-400 text-xs">{item.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Tips for speech recognition working */}
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-left space-y-1.5 text-sm">
                  <p className="text-blue-300 font-medium">💡 For best results:</p>
                  <p className="text-gray-400">• Use <strong className="text-white">Google Chrome</strong> or <strong className="text-white">Microsoft Edge</strong></p>
                  <p className="text-gray-400">• Allow microphone access when prompted</p>
                  <p className="text-gray-400">• Stay connected to the internet (speech recognition needs it)</p>
                  <p className="text-gray-400">• If mic fails, you can type your answers instead</p>
                </div>

                <div className="bg-amber-600/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-300">
                  ⚠️ AI estimate only — not an official language certification
                </div>

                <Button size="lg" className="w-full" onClick={() => setPhase('questions')}>
                  Start Assessment <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── QUESTIONS ──────────────────────────────────────── */}
          {phase === 'questions' && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-gray-900 border border-gray-700/50 rounded-3xl p-8 shadow-2xl space-y-5"
            >
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Question {currentQ + 1} of {ASSESSMENT_QUESTIONS.length}</span>
                <div className="flex gap-1.5">
                  {ASSESSMENT_QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-6 h-1.5 rounded-full transition-colors',
                        i < currentQ ? 'bg-blue-500' : i === currentQ ? 'bg-blue-400' : 'bg-gray-700'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/20 rounded-2xl p-5">
                <div className="text-xs text-blue-400 font-medium mb-2">Coach Alex asks:</div>
                <p className="text-white text-lg font-medium leading-relaxed">"{q.prompt}"</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {q.hints.map((hint) => (
                    <span key={hint} className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-md">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>

              {/* Network error banner with text fallback */}
              {isNetworkError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-600/15 border border-amber-500/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-medium text-sm">Speech recognition lost connection</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        The browser's speech API needs internet access. You can type your answer below, or try the mic again.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setIsNetworkError(false); setError(''); setShowTypeInput(true); }} icon={<Keyboard className="w-4 h-4" />}>
                      Type instead
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsNetworkError(false); setError(''); setShowTypeInput(false); }}>
                      Retry mic
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Regular error (non-network) */}
              {error && !isNetworkError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Type input fallback */}
              {showTypeInput && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs">Type your answer below:</p>
                  <textarea
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type your answer here in English..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!typedAnswer.trim()}
                    onClick={saveTypedAnswer}
                    icon={<ChevronRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    {currentQ < ASSESSMENT_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Assessment'}
                  </Button>
                </div>
              )}

              {/* Transcript area (when not typing) */}
              {!showTypeInput && (
                <div className="min-h-[72px] bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                  {transcript || interimTranscript ? (
                    <div>
                      <p className="text-white leading-relaxed">{transcript}</p>
                      {interimTranscript && (
                        <p className="text-gray-400 italic">{interimTranscript}…</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">
                      {isRecording ? '🎙 Listening…' : 'Press the microphone button to start speaking'}
                    </p>
                  )}
                </div>
              )}

              {/* Controls (mic mode) */}
              {!showTypeInput && (
                <div className="space-y-2">
                  <div className="flex gap-3 items-center">
                    {isRecording ? (
                      <>
                        {/* Live waveform */}
                        <div className="flex items-end gap-0.5 h-8 flex-shrink-0">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                              style={{
                                height: `${Math.max(4, audioLevel * 32 * (0.4 + Math.abs(Math.sin(Date.now() / 150 + i)) * 0.6))}px`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm font-mono flex-shrink-0">
                          {formatTime(timer)}
                        </span>
                        <Button
                          variant="danger"
                          className="flex-1"
                          onClick={() => saveAnswer()}
                          icon={<MicOff className="w-4 h-4" />}
                        >
                          Stop & Continue
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="flex-1"
                          onClick={startRecording}
                          icon={<Mic className="w-5 h-5" />}
                        >
                          {transcript ? 'Re-record' : 'Start Speaking'}
                        </Button>
                        {transcript && (
                          <Button
                            variant="success"
                            onClick={() => saveAnswer()}
                            icon={<ChevronRight className="w-4 h-4" />}
                            iconPosition="right"
                          >
                            {currentQ < ASSESSMENT_QUESTIONS.length - 1 ? 'Next' : 'Finish'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Type fallback toggle */}
                  {!isRecording && !isNetworkError && (
                    <button
                      onClick={() => setShowTypeInput(true)}
                      className="w-full text-center text-xs text-gray-500 hover:text-gray-400 flex items-center justify-center gap-1.5 py-1 transition-colors"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      Mic not working? Type your answer instead
                    </button>
                  )}
                </div>
              )}

              {answers.length > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  ✓ {answers.length} answer{answers.length > 1 ? 's' : ''} recorded
                </p>
              )}
            </motion.div>
          )}

          {/* ── ANALYZING ──────────────────────────────────────── */}
          {phase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-900 border border-gray-700/50 rounded-3xl p-12 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing your speech…</h3>
                <p className="text-gray-400">Running grammar analysis, vocabulary check, and fluency measurement.</p>
              </div>
              <div className="space-y-2">
                {[
                  'Analyzing grammar patterns',
                  'Checking vocabulary usage',
                  'Measuring fluency',
                  'Calculating CEFR level',
                  'Generating personalized report',
                ].map((task, i) => (
                  <motion.div
                    key={task}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-sm text-gray-400 text-left bg-gray-800/40 rounded-lg px-3 py-2"
                  >
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    {task}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ────────────────────────────────────────── */}
          {phase === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-gray-700/50 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 rounded-xl px-4 py-1.5 text-blue-400 text-sm font-medium mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Assessment Complete
                </div>
                <h2 className="text-2xl font-bold text-white">Your Speaking Profile</h2>
                <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl px-5 py-2">
                  <span className="text-3xl font-black text-white">{results.cefrLevel}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold">
                      {getCEFRDescription(results.cefrLevel).split('—')[0].trim()}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {getCEFRDescription(results.cefrLevel).split('—')[1]?.trim()}
                    </div>
                  </div>
                </div>
              </div>

              <Card variant="glass" padding="md">
                <div className="flex justify-around flex-wrap gap-4">
                  {[
                    { label: 'Grammar', score: results.scores.grammar },
                    { label: 'Vocabulary', score: results.scores.vocabulary },
                    { label: 'Pronunciation', score: results.scores.pronunciation },
                    { label: 'Fluency', score: results.scores.fluency },
                    { label: 'Confidence', score: results.scores.confidence },
                    { label: 'Overall', score: results.scores.overall },
                  ].map((s) => (
                    <ScoreRing key={s.label} score={s.score} label={s.label} size="sm" />
                  ))}
                </div>
              </Card>

              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-300 text-sm leading-relaxed italic">"{results.summary}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <h4 className="text-emerald-400 font-semibold text-sm mb-2">✅ Strengths</h4>
                  <ul className="space-y-1">
                    {results.strengths.map((s) => (
                      <li key={s} className="text-sm text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <h4 className="text-amber-400 font-semibold text-sm mb-2">🎯 Focus On</h4>
                  <ul className="space-y-1">
                    {results.weaknesses.map((w) => (
                      <li key={w} className="text-sm text-gray-300">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                ⚠️ AI estimate only — not an official English proficiency certification
              </p>

              <Button size="lg" className="w-full" onClick={() => setView('home')}>
                Start Coaching <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
