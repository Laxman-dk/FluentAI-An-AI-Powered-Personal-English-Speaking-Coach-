import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Calendar, Clock, Mic, MicOff, CheckCircle, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ScoreRing from '../ui/ScoreRing';
import { speechService } from '../../services/speechService';
import { analyzeUserSpeech } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { CHALLENGE_PROMPTS } from '../../constants';
import type { DailyChallenge } from '../../types';

function generateId() { return Math.random().toString(36).slice(2, 11); }

export default function DailyChallenges() {
  const { profile, progress, dailyChallenge, generateDailyChallenge, completeChallenge } = useAppStore();
  const [phase, setPhase] = useState<'ready' | 'recording' | 'processing' | 'result'>('ready');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const timerRef = { current: null as ReturnType<typeof setInterval> | null };

  // Subscribe to speech service
  useState(() => {
    return speechService.subscribe((state) => {
      if (state.transcript !== undefined) setTranscript(state.transcript);
      if (state.interimTranscript !== undefined) setInterimTranscript(state.interimTranscript);
      if (state.audioLevel !== undefined) setAudioLevel(state.audioLevel);
    });
  });

  async function startChallenge() {
    setTranscript('');
    setInterimTranscript('');
    await speechService.startRecording();
    setPhase('recording');
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  }

  async function stopChallenge() {
    const final = await speechService.stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('processing');

    const text = final || transcript;
    if (!text.trim() || !profile) {
      setPhase('ready');
      return;
    }

    try {
      const analysis = await analyzeUserSpeech(text, profile, 'normal');
      const wordCount = text.split(/\s+/).length;
      const wpm = timer > 0 ? Math.round((wordCount / timer) * 60) : 0;
      const grammarErrors = analysis.grammarErrors?.length ?? 0;
      const fillerWords = analysis.metrics?.fillerWords ?? 0;

      const grammarScore = Math.max(40, 100 - grammarErrors * 8);
      const fluencyScore = Math.max(40, 100 - fillerWords * 5);
      const contentScore = Math.min(100, (wordCount / ((dailyChallenge?.targetDuration ?? 60) / 60 * 80)) * 100);
      const finalScore = Math.round((grammarScore + fluencyScore + contentScore) / 3);

      setScore(finalScore);
      setFeedback([
        `${wordCount} words spoken at ~${wpm} WPM`,
        `${grammarErrors} grammar ${grammarErrors === 1 ? 'issue' : 'issues'} detected`,
        `${fillerWords} filler ${fillerWords === 1 ? 'word' : 'words'} used`,
        finalScore >= 75 ? 'Great effort! Keep it up.' : 'Good attempt. Practice daily to improve.',
      ]);

      completeChallenge(finalScore);
      setPhase('result');
    } catch {
      setScore(65);
      setFeedback(['Challenge completed!', 'Keep practicing every day.']);
      completeChallenge(65);
      setPhase('result');
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  const targetPercent = dailyChallenge
    ? Math.min(100, (timer / dailyChallenge.targetDuration) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Challenges</h1>
          <p className="text-gray-400 text-sm mt-1">One challenge per day keeps your streak alive.</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Flame className="w-5 h-5" />
            <span className="text-xl font-black">{progress.currentStreak}</span>
          </div>
          <div className="text-gray-400 text-xs">day streak</div>
        </div>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: 'Current streak', value: `${progress.currentStreak} days`, color: 'text-orange-400' },
          { icon: Trophy, label: 'Longest streak', value: `${progress.longestStreak} days`, color: 'text-amber-400' },
          { icon: Target, label: 'Challenges done', value: progress.totalSessions.toString(), color: 'text-blue-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="elevated" padding="sm" className="text-center">
              <Icon className={clsx('w-5 h-5 mx-auto mb-1', stat.color)} />
              <div className="text-white font-bold">{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Today's Challenge */}
      {dailyChallenge && (
        <Card variant="elevated" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-600/20 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-amber-400 font-semibold">Today's Challenge</div>
                <div className="text-white font-bold">{dailyChallenge.title}</div>
              </div>
            </div>
            {dailyChallenge.completed ? (
              <Badge variant="green">✓ Completed</Badge>
            ) : (
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {dailyChallenge.targetDuration}s target
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-white leading-relaxed">"{dailyChallenge.prompt}"</p>
          </div>

          {/* Completed state */}
          {dailyChallenge.completed && phase !== 'recording' ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-white font-bold">Challenge Complete!</div>
              {dailyChallenge.score !== undefined && (
                <div className="text-gray-400 text-sm">Score: <span className="text-white font-semibold">{dailyChallenge.score}/100</span></div>
              )}
              <p className="text-gray-400 text-sm">Come back tomorrow for a new challenge!</p>
            </div>
          ) : (
            <>
              {/* Recording phase */}
              {phase === 'recording' && (
                <div className="space-y-3">
                  {/* Progress arc */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Speaking time</span>
                    <span className="text-white font-mono font-bold">{formatTime(timer)} / {formatTime(dailyChallenge.targetDuration)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={clsx('h-2 rounded-full transition-all', targetPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                      style={{ width: `${Math.min(100, targetPercent)}%` }}
                    />
                  </div>
                  {targetPercent >= 100 && (
                    <p className="text-emerald-400 text-sm font-medium">✓ Target reached! You can stop or keep going.</p>
                  )}

                  {/* Waveform */}
                  <div className="flex items-end justify-center gap-0.5 h-10 bg-gray-800/60 rounded-xl">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, audioLevel * 40 * (0.3 + Math.abs(Math.sin(Date.now() / 100 + i)) * 0.7))}px` }}
                      />
                    ))}
                  </div>

                  {/* Interim transcript */}
                  {(transcript || interimTranscript) && (
                    <div className="bg-gray-800/60 rounded-xl p-3 text-sm">
                      <p className="text-white">{transcript}</p>
                      {interimTranscript && <p className="text-gray-400 italic">{interimTranscript}…</p>}
                    </div>
                  )}

                  <Button variant="danger" className="w-full" onClick={stopChallenge} icon={<MicOff className="w-4 h-4" />}>
                    Stop & Submit
                  </Button>
                </div>
              )}

              {/* Processing */}
              {phase === 'processing' && (
                <div className="flex items-center justify-center gap-3 py-6 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  Analyzing your response…
                </div>
              )}

              {/* Result */}
              {phase === 'result' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <ScoreRing score={score} label="Challenge Score" size="lg" />
                  </div>
                  <div className="space-y-2">
                    {feedback.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2 text-sm text-gray-300">
                        <span className="text-blue-400">•</span> {f}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setPhase('ready')}>
                    Try Again
                  </Button>
                </div>
              )}

              {/* Ready state */}
              {phase === 'ready' && (
                <Button className="w-full" size="lg" onClick={startChallenge} icon={<Mic className="w-5 h-5" />}>
                  Start Speaking
                </Button>
              )}
            </>
          )}
        </Card>
      )}

      {/* Past challenges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-300 font-semibold text-sm">More Challenges</h3>
          <button onClick={generateDailyChallenge} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {CHALLENGE_PROMPTS.slice(0, 5).map((c, i) => (
            <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {c.type === 'speak-about' ? '🎤' : c.type === 'opinion' ? '💭' : c.type === 'story' ? '📖' : '🎯'}
                  </span>
                  <div>
                    <div className="text-white text-sm font-medium">{c.title}</div>
                    <div className="text-gray-400 text-xs">{c.targetDuration}s target</div>
                  </div>
                </div>
                <Badge variant="gray" size="sm" className="capitalize">{c.type.replace('-', ' ')}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
