import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Mic, Target, Flame, Clock, BookOpen,
  TrendingUp, Play, ChevronRight, Star, Zap, Trophy,
} from 'lucide-react';
import Card from '../ui/Card';
import ScoreRing from '../ui/ScoreRing';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAppStore } from '../../store/useAppStore';
import { ROLEPLAY_SCENARIOS, SPEAKING_GAMES } from '../../constants';
import { format } from 'date-fns';

export default function Home() {
  const { profile, progress, dailyChallenge, generateDailyChallenge, setView } = useAppStore();

  useEffect(() => {
    generateDailyChallenge();
  }, [generateDailyChallenge]);

  if (!profile) return null;

  const scores = progress.currentScores;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const quickActions = [
    { label: 'Free Conversation', icon: MessageSquare, view: 'conversation' as const, color: 'from-blue-600 to-blue-700', desc: 'Chat with your coach' },
    { label: 'Pronunciation', icon: Mic, view: 'pronunciation' as const, color: 'from-purple-600 to-purple-700', desc: 'Fix your sounds' },
    { label: 'Practice Modes', icon: BookOpen, view: 'practice' as const, color: 'from-teal-600 to-teal-700', desc: 'Interview, GD, roleplay' },
    { label: 'Daily Challenge', icon: Target, view: 'challenges' as const, color: 'from-amber-600 to-orange-600', desc: dailyChallenge?.completed ? '✓ Completed' : 'Try today\'s challenge' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <p className="text-gray-400 text-sm">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.name} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="blue">{profile.cefrLevel} — {profile.currentLevel}</Badge>
            {progress.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-sm">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{progress.currentStreak} day streak</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{format(new Date(), 'EEE, MMM d')}</div>
          <div className="text-2xl font-black text-white">{Math.round(scores.overall || 0)}</div>
          <div className="text-xs text-gray-400">Overall score</div>
        </div>
      </motion.div>

      {/* Daily Challenge Banner */}
      {dailyChallenge && !dailyChallenge.completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setView('challenges')}
            className="w-full text-left bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center text-xl">🎯</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Daily Challenge</span>
                    <Badge variant="yellow" size="sm">New</Badge>
                  </div>
                  <p className="text-white font-medium">{dailyChallenge.title}</p>
                  <p className="text-gray-400 text-sm truncate max-w-xs">{dailyChallenge.prompt}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Start</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setView(action.view)}
                className={`bg-gradient-to-br ${action.color} hover:opacity-90 active:scale-95 transition-all rounded-2xl p-4 text-left shadow-lg group`}
              >
                <Icon className="w-6 h-6 text-white/80 mb-3" />
                <div className="text-white font-semibold text-sm">{action.label}</div>
                <div className="text-white/60 text-xs mt-0.5">{action.desc}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Scores + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score rings */}
        <Card variant="elevated" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Your Scores</h3>
            <button onClick={() => setView('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Full report <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex justify-around flex-wrap gap-4">
            {[
              { label: 'Grammar', score: scores.grammar },
              { label: 'Vocabulary', score: scores.vocabulary },
              { label: 'Pronunciation', score: scores.pronunciation },
              { label: 'Fluency', score: scores.fluency },
              { label: 'Confidence', score: scores.confidence },
              { label: 'Overall', score: scores.overall },
            ].map((s) => (
              <ScoreRing key={s.label} score={s.score || 0} label={s.label} size="sm" />
            ))}
          </div>
        </Card>

        {/* Stats */}
        <Card variant="elevated">
          <h3 className="text-white font-semibold mb-4">Your Progress</h3>
          <div className="space-y-3">
            {[
              { icon: Clock, label: 'Speaking time', value: `${progress.totalSpeakingMinutes}m`, color: 'text-blue-400' },
              { icon: Star, label: 'Sessions', value: progress.totalSessions.toString(), color: 'text-purple-400' },
              { icon: Zap, label: 'Words spoken', value: progress.totalWordsSpoken.toLocaleString(), color: 'text-teal-400' },
              { icon: Trophy, label: 'Longest streak', value: `${progress.longestStreak} days`, color: 'text-amber-400' },
              { icon: BookOpen, label: 'Words learned', value: progress.wordsLearned.length.toString(), color: 'text-emerald-400' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-700/60 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-400 text-xs">{stat.label}</div>
                    <div className="text-white font-semibold text-sm">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recurring Errors */}
      {progress.recurringErrors.length > 0 && (
        <Card variant="default">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <h3 className="text-white font-semibold text-sm">Areas to Focus On</h3>
          </div>
          <div className="space-y-2">
            {progress.recurringErrors.slice(0, 3).map((err) => (
              <div key={err.pattern} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-3 py-2">
                <div>
                  <div className="text-white text-sm font-medium">{err.pattern}</div>
                  <div className="text-gray-400 text-xs">{err.description}</div>
                </div>
                <Badge variant="red" size="sm">{err.occurrences}x</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Roleplay suggestions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Popular Scenarios</h2>
          <button onClick={() => setView('practice')} className="text-xs text-blue-400 hover:text-blue-300">
            See all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLEPLAY_SCENARIOS.slice(0, 4).map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setView('practice')}
              className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{scenario.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm">{scenario.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{scenario.description}</div>
                  <Badge
                    variant={scenario.difficulty === 'beginner' ? 'green' : scenario.difficulty === 'intermediate' ? 'blue' : 'purple'}
                    size="sm"
                    className="mt-2"
                  >
                    {scenario.difficulty}
                  </Badge>
                </div>
                <Play className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Games strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Speaking Games</h2>
          <button onClick={() => setView('games')} className="text-xs text-blue-400 hover:text-blue-300">
            Play all
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {SPEAKING_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setView('games')}
              className="flex-shrink-0 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl p-3 text-center w-32 transition-all"
            >
              <div className="text-2xl mb-1">{game.icon}</div>
              <div className="text-white text-xs font-medium">{game.title}</div>
              <Badge
                variant={game.difficulty === 'easy' ? 'green' : game.difficulty === 'medium' ? 'yellow' : 'red'}
                size="sm"
                className="mt-1"
              >
                {game.difficulty}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Vocab teaser */}
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold text-sm">Words Learned</h3>
          </div>
          <Button size="xs" variant="outline" onClick={() => setView('vocabulary')}>
            Study Words
          </Button>
        </div>
        {progress.wordsLearned.length === 0 ? (
          <p className="text-gray-400 text-sm">Start a conversation or visit the Vocabulary section to build your word bank.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {progress.wordsLearned.slice(-8).map((w) => (
              <span key={w.id} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-lg">
                {w.word}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
