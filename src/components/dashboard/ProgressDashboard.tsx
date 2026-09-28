import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Clock, MessageSquare, BookOpen, Flame, TrendingUp,
  Trophy, AlertTriangle, Download, Trash2,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';
import Card from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { getCEFRDescription } from '../../constants';
import { format } from 'date-fns';

export default function ProgressDashboard() {
  const { profile, progress, sessions, clearProfile } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!profile) return null;

  const scores = progress.currentScores;
  const initial = progress.initialScores;

  // Radar data
  const radarData = [
    { subject: 'Grammar', A: scores.grammar, B: initial.grammar },
    { subject: 'Vocabulary', A: scores.vocabulary, B: initial.vocabulary },
    { subject: 'Pronunciation', A: scores.pronunciation, B: initial.pronunciation },
    { subject: 'Fluency', A: scores.fluency, B: initial.fluency },
    { subject: 'Confidence', A: scores.confidence, B: initial.confidence },
    { subject: 'Sentences', A: scores.sentenceConstruction, B: initial.sentenceConstruction },
  ];

  // Weekly progress chart data
  const chartData = progress.weeklyHistory.length > 0
    ? progress.weeklyHistory.slice(-8).map((w) => ({
        week: w.week.replace(/^\d{4}-/, 'W'),
        Grammar: w.grammarScore,
        Vocabulary: w.vocabularyScore,
        Fluency: w.fluencyScore,
        Overall: w.overallScore,
      }))
    : generateMockHistory();

  // Recent sessions
  const recentSessions = sessions.slice(0, 5);

  function generateMockHistory() {
    return Array.from({ length: 6 }, (_, i) => ({
      week: `W${i + 1}`,
      Grammar: Math.round(40 + i * 5 + Math.random() * 10),
      Vocabulary: Math.round(38 + i * 4 + Math.random() * 8),
      Fluency: Math.round(42 + i * 4 + Math.random() * 9),
      Overall: Math.round(40 + i * 5 + Math.random() * 8),
    }));
  }

  function exportData() {
    const data = {
      profile: { name: profile?.name, level: profile?.cefrLevel, goals: profile?.goals },
      scores,
      progress: {
        totalSessions: progress.totalSessions,
        totalMinutes: progress.totalSpeakingMinutes,
        streak: progress.currentStreak,
        wordsLearned: progress.wordsLearned.length,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'english-coach-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Track your English speaking journey.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportData} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* CEFR Level */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-white">{profile.cefrLevel}</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">{profile.currentLevel}</div>
              <div className="text-gray-400 text-sm">{getCEFRDescription(profile.cefrLevel)}</div>
              {progress.cefrHistory.length > 1 && (
                <Badge variant="green" className="mt-1">
                  Level up from {progress.cefrHistory[0].level}!
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Overall Score</div>
            <div className="text-4xl font-black text-white">{Math.round(scores.overall || 0)}</div>
            <div className="text-gray-400 text-xs">/ 100</div>
          </div>
        </div>
      </div>

      {/* Score rings */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-white font-semibold mb-5">Your Skill Scores</h3>
        <div className="flex flex-wrap justify-around gap-6">
          {[
            { label: 'Grammar', score: scores.grammar, initial: initial.grammar },
            { label: 'Vocabulary', score: scores.vocabulary, initial: initial.vocabulary },
            { label: 'Pronunciation', score: scores.pronunciation, initial: initial.pronunciation },
            { label: 'Fluency', score: scores.fluency, initial: initial.fluency },
            { label: 'Confidence', score: scores.confidence, initial: initial.confidence },
            { label: 'Sentences', score: scores.sentenceConstruction, initial: initial.sentenceConstruction },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <ScoreRing score={s.score || 0} label={s.label} size="md" />
              {s.initial > 0 && (
                <div className={`text-xs ${(s.score || 0) >= s.initial ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(s.score || 0) >= s.initial ? '▲' : '▼'} {Math.abs((s.score || 0) - s.initial)}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: 'Practice Time', value: `${Math.floor(progress.totalSpeakingMinutes / 60)}h ${progress.totalSpeakingMinutes % 60}m`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: MessageSquare, label: 'Sessions', value: progress.totalSessions.toString(), color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: BookOpen, label: 'Words Spoken', value: progress.totalWordsSpoken.toLocaleString(), color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { icon: Flame, label: 'Best Streak', value: `${progress.longestStreak} days`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${stat.bg} border border-gray-700/50 rounded-2xl p-4`}
            >
              <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-white font-bold text-lg leading-tight">{stat.value}</div>
              <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress chart */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-white font-semibold mb-4">Score Progression</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="grammarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Area type="monotone" dataKey="Grammar" stroke="#3b82f6" fill="url(#grammarGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Fluency" stroke="#8b5cf6" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="Overall" stroke="#10b981" fill="url(#overallGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          {[{ label: 'Grammar', color: '#3b82f6' }, { label: 'Fluency', color: '#8b5cf6' }, { label: 'Overall', color: '#10b981' }].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-3 h-0.5 rounded" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Radar chart */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-white font-semibold mb-4">Skills Radar</h3>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Radar name="Now" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            {initial.overall > 0 && (
              <Radar name="Start" dataKey="B" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} strokeDasharray="4 4" />
            )}
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded bg-blue-600/50 border border-blue-500" />
            Current
          </div>
          {initial.overall > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-3 h-3 rounded bg-gray-600/50 border border-gray-500 border-dashed" />
              Initial
            </div>
          )}
        </div>
      </Card>

      {/* Recurring Errors */}
      {progress.recurringErrors.length > 0 && (
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-semibold">Recurring Patterns to Fix</h3>
          </div>
          <div className="space-y-3">
            {progress.recurringErrors.map((err) => (
              <div key={err.pattern} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-sm">{err.pattern}</span>
                  <Badge variant="yellow" size="sm">{err.occurrences}x</Badge>
                </div>
                <p className="text-gray-400 text-xs">{err.description}</p>
                {err.examples.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {err.examples.slice(0, 2).map((ex) => (
                      <p key={ex} className="text-xs text-red-400 font-mono">"{ex}"</p>
                    ))}
                  </div>
                )}
                {err.exerciseSuggested && (
                  <p className="text-blue-400 text-xs mt-1.5">💡 {err.exerciseSuggested}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <Card variant="elevated" padding="md">
          <h3 className="text-white font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm">
                    {session.mode === 'interview' ? '💼' : session.mode === 'roleplay' ? '🎭' : '💬'}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium capitalize">{session.mode.replace(/-/g, ' ')}</div>
                    <div className="text-gray-400 text-xs">
                      {format(new Date(session.startedAt), 'MMM d, yyyy')} •
                      {' '}{Math.floor(session.durationSeconds / 60)}m
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{Math.round(session.scores?.overall || 0)}</div>
                  <div className="text-gray-400 text-xs">score</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data privacy */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h3 className="text-white font-semibold text-sm">Privacy Controls</h3>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          All your learning data is stored locally in your browser. You can delete it at any time.
        </p>
        {!showDeleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete All Learning Data
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-red-400 text-sm font-medium">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={clearProfile}>
                Yes, delete everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
