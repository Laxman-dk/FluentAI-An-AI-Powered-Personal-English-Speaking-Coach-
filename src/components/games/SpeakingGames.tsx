import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, RefreshCw, ArrowLeft, Trophy, Star, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ScoreRing from '../ui/ScoreRing';
import { speechService } from '../../services/speechService';
import { getCoachResponse, analyzeUserSpeech, hasApiKey } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { SPEAKING_GAMES } from '../../constants';
import type { SpeakingGame } from '../../types';

const GAME_WORDS = {
  'word-challenge': ['eloquent', 'persevere', 'collaborate', 'innovative', 'meticulous', 'articulate', 'substantial', 'perspective'],
  'describe-it': ['umbrella', 'elevator', 'telescope', 'escalator', 'refrigerator', 'thermometer', 'microphone', 'compass'],
  '30-second': ['artificial intelligence', 'climate change', 'social media', 'teamwork', 'leadership', 'creativity', 'education', 'travel'],
  'story-builder': [
    ['dragon', 'library', 'midnight'],
    ['scientist', 'ocean', 'discovery'],
    ['chef', 'robot', 'forgotten recipe'],
    ['astronaut', 'old book', 'time travel'],
  ],
  'rapid-questions': [
    'What is your biggest dream?',
    'What skill would you like to learn?',
    'What is your favorite season and why?',
    'What would you do with a million dollars?',
    'What is one thing you want to change about the world?',
  ],
  'pronunciation-challenge': ['particularly', 'entrepreneurship', 'specifically', 'approximately', 'enthusiastic', 'simultaneously', 'extraordinary'],
};

function generateId() { return Math.random().toString(36).slice(2, 11); }

export default function SpeakingGames() {
  const { profile } = useAppStore();
  const [activeGame, setActiveGame] = useState<SpeakingGame | null>(null);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'processing' | 'result'>('setup');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  const timerIntervalRef = { current: null as ReturnType<typeof setInterval> | null };

  useEffect(() => {
    return speechService.subscribe((state) => {
      if (state.transcript !== undefined) setTranscript(state.transcript);
      if (state.audioLevel !== undefined) setAudioLevel(state.audioLevel);
    });
  }, []);

  function pickPrompt(game: SpeakingGame): string {
    switch (game.type) {
      case 'word-challenge': {
        const words = GAME_WORDS['word-challenge'];
        return words[Math.floor(Math.random() * words.length)];
      }
      case 'describe-it': {
        const things = GAME_WORDS['describe-it'];
        return things[Math.floor(Math.random() * things.length)];
      }
      case '30-second': {
        const topics = GAME_WORDS['30-second'];
        return topics[Math.floor(Math.random() * topics.length)];
      }
      case 'story-builder': {
        const sets = GAME_WORDS['story-builder'];
        const set = sets[Math.floor(Math.random() * sets.length)] as string[];
        return set.join(', ');
      }
      case 'rapid-questions':
        return GAME_WORDS['rapid-questions'][0];
      case 'pronunciation-challenge': {
        const words = GAME_WORDS['pronunciation-challenge'];
        return words[Math.floor(Math.random() * words.length)];
      }
      default:
        return '';
    }
  }

  function startGame(game: SpeakingGame) {
    setActiveGame(game);
    setCurrentPrompt(pickPrompt(game));
    setGamePhase('setup');
    setTranscript('');
    setCoachFeedback('');
    setTimer(0);
    setQuestionIndex(0);
  }

  async function beginRecording() {
    setTranscript('');
    await speechService.startRecording();
    setIsRecording(true);
    timerIntervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    setGamePhase('playing');
  }

  async function endRecording() {
    const final = await speechService.stopRecording();
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGamePhase('processing');

    const text = final || transcript;
    if (!text.trim() || !profile || !activeGame) {
      setGamePhase('setup');
      return;
    }

    try {
      let feedback = '';
      let finalScore = 70;

      if (hasApiKey()) {
        const systemContext = getGameContext(activeGame, currentPrompt);
        feedback = await getCoachResponse(text, [], { ...profile }, activeGame.type as any, 'normal');
        const analysis = await analyzeUserSpeech(text, profile, 'normal');
        const errors = analysis.grammarErrors?.length ?? 0;
        const wordCount = text.split(/\s+/).length;
        finalScore = Math.min(100, Math.max(40, 90 - errors * 5 + Math.min(20, wordCount / 5)));
      } else {
        feedback = getFallbackFeedback(activeGame, text, currentPrompt);
        finalScore = 65;
      }

      setCoachFeedback(feedback);
      setScore(Math.round(finalScore));
      setGamePhase('result');
    } catch {
      setCoachFeedback('Great effort! Keep practicing — the more you speak, the better you get.');
      setScore(65);
      setGamePhase('result');
    }
  }

  function getGameContext(game: SpeakingGame, prompt: string): string {
    const contexts: Record<string, string> = {
      'word-challenge': `The student was asked to use the word "${prompt}" in a meaningful sentence. Evaluate if they used it correctly, naturally, and in the right context.`,
      'describe-it': `The student was asked to describe "${prompt}" without saying the word. Evaluate their description skills, vocabulary, and creativity.`,
      '30-second': `The student spoke about "${prompt}" for 30+ seconds. Evaluate their fluency, vocabulary, and ability to sustain speech on the topic.`,
      'story-builder': `The student built a story using the words: ${prompt}. Evaluate their creativity, grammar, storytelling, and if they used all three words.`,
      'rapid-questions': `The student answered the question: "${prompt}". Evaluate the quality, clarity, and grammar of their response.`,
      'pronunciation-challenge': `The student was asked to pronounce "${prompt}" correctly. Evaluate their pronunciation based on the transcript.`,
    };
    return contexts[game.type] || '';
  }

  function getFallbackFeedback(game: SpeakingGame, text: string, prompt: string): string {
    const wordCount = text.split(/\s+/).length;
    return `Good job attempting the ${game.title}! You spoke ${wordCount} words. ${wordCount > 20 ? 'Great effort keeping the response detailed!' : 'Try to speak a bit more next time.'} Add your OpenAI API key in Settings for detailed AI feedback.`;
  }

  function nextQuestion() {
    if (activeGame?.type === 'rapid-questions') {
      const questions = GAME_WORDS['rapid-questions'];
      const next = (questionIndex + 1) % questions.length;
      setQuestionIndex(next);
      setCurrentPrompt(questions[next]);
    } else {
      setCurrentPrompt(pickPrompt(activeGame!));
    }
    setGamePhase('setup');
    setTranscript('');
    setCoachFeedback('');
    setTimer(0);
  }

  if (!activeGame) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Speaking Games</h1>
          <p className="text-gray-400 text-sm mt-1">Fun, challenging activities to build your English speaking confidence.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SPEAKING_GAMES.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => startGame(game)}
              className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/40 rounded-2xl p-5 transition-all group"
            >
              <div className="text-3xl mb-3">{game.icon}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-bold">{game.title}</span>
                <Badge
                  variant={game.difficulty === 'easy' ? 'green' : game.difficulty === 'medium' ? 'yellow' : 'red'}
                  size="sm"
                >
                  {game.difficulty}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">{game.description}</p>
              <div className="flex items-center gap-1 text-blue-400 text-xs mt-4 group-hover:gap-2 transition-all">
                Play now →
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => setActiveGame(null)}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </button>

      {/* Game header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{activeGame.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-white">{activeGame.title}</h2>
          <p className="text-gray-400 text-sm">{activeGame.description}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SETUP */}
        {gamePhase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card variant="elevated" padding="lg" className="text-center space-y-4">
              <div className="text-sm text-gray-400">{activeGame.instructions}</div>

              {/* The prompt */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-2">
                  {activeGame.type === 'word-challenge' ? 'Use this word:'
                    : activeGame.type === 'describe-it' ? 'Describe this (without saying the word):'
                    : activeGame.type === '30-second' ? 'Speak about this topic:'
                    : activeGame.type === 'story-builder' ? 'Build a story with:'
                    : activeGame.type === 'rapid-questions' ? 'Answer this question:'
                    : 'Pronounce this word:'}
                </div>
                <div className="text-2xl font-black text-white">
                  {activeGame.type === 'story-builder'
                    ? currentPrompt.split(', ').map((w) => `"${w}"`).join(' + ')
                    : `"${currentPrompt}"`}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={beginRecording}
                  icon={<Mic className="w-5 h-5" />}
                >
                  Start Speaking
                </Button>
                <button
                  onClick={() => setCurrentPrompt(pickPrompt(activeGame))}
                  className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  title="Different prompt"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* PLAYING */}
        {gamePhase === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card variant="elevated" padding="lg" className="space-y-4">
              {/* Timer */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-mono font-black text-white">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>

              {/* Waveform */}
              <div className="flex items-end justify-center gap-0.5 h-12 bg-gray-700/40 rounded-xl px-3">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(3, audioLevel * 48 * (0.2 + Math.abs(Math.sin(Date.now() / 100 + i)) * 0.8))}px` }}
                  />
                ))}
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="bg-gray-800/60 rounded-xl p-3 text-sm text-gray-300 max-h-24 overflow-y-auto">
                  {transcript}
                </div>
              )}

              <Button variant="danger" className="w-full" size="lg" onClick={endRecording} icon={<MicOff className="w-5 h-5" />}>
                Stop & Get Feedback
              </Button>
            </Card>
          </motion.div>
        )}

        {/* PROCESSING */}
        {gamePhase === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
            <p className="text-gray-400">Analyzing your response…</p>
          </motion.div>
        )}

        {/* RESULT */}
        {gamePhase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <ScoreRing score={score} label="Game Score" size="lg" />
            </div>

            {coachFeedback && (
              <Card variant="glass" padding="md">
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">🎙️</span>
                  <p className="text-gray-200 text-sm leading-relaxed">{coachFeedback}</p>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={nextQuestion} icon={<RefreshCw className="w-4 h-4" />}>
                Try Another
              </Button>
              <Button className="flex-1" onClick={() => setActiveGame(null)} icon={<Trophy className="w-4 h-4" />}>
                All Games
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
