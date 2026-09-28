import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RefreshCw, Check, X, BookOpen, Star, Loader2, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { speak } from '../../services/speechService';
import { generateDailyWords } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { SEED_VOCABULARY } from '../../constants';
import type { VocabWord } from '../../types';

function generateId() { return Math.random().toString(36).slice(2, 11); }

type VocabTab = 'daily' | 'learned' | 'review';

export default function VocabularyCoach() {
  const { profile, progress, addLearnedWord } = useAppStore();
  const [tab, setTab] = useState<VocabTab>('daily');
  const [dailyWords, setDailyWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [quizWord, setQuizWord] = useState<VocabWord | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  useEffect(() => {
    loadDailyWords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDailyWords() {
    if (!profile) return;
    setLoading(true);
    try {
      const words = await generateDailyWords(
        profile,
        progress.wordsLearned.map((w) => w.word)
      );
      setDailyWords(words.length > 0 ? words : getSeedWords());
    } catch {
      setDailyWords(getSeedWords());
    } finally {
      setLoading(false);
    }
  }

  function getSeedWords(): VocabWord[] {
    return SEED_VOCABULARY.map((w) => ({
      ...w,
      id: generateId(),
      addedAt: new Date().toISOString(),
      usedInConversation: false,
      timesUsed: 0,
    }));
  }

  function markLearned(word: VocabWord) {
    addLearnedWord({ ...word, learnedAt: new Date().toISOString() });
  }

  function startQuiz() {
    const words = progress.wordsLearned;
    if (words.length === 0) return;
    setQuizWord(words[Math.floor(Math.random() * words.length)]);
    setQuizRevealed(false);
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vocabulary Coach</h1>
          <p className="text-gray-400 text-sm mt-1">
            {progress.wordsLearned.length} words learned so far
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-1.5">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-semibold text-sm">{progress.wordsLearned.length} words</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['daily', 'learned', 'review'] as VocabTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {t === 'daily' ? 'Daily Words' : t === 'learned' ? 'My Words' : 'Quick Review'}
          </button>
        ))}
      </div>

      {/* DAILY WORDS */}
      {tab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Today's vocabulary — click to expand and learn.</p>
            <button onClick={loadDailyWords} className="text-gray-400 hover:text-white" title="Refresh words">
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating vocabulary for your level…
            </div>
          ) : (
            dailyWords.map((word, i) => (
              <WordCard
                key={word.id}
                word={word}
                index={i}
                expanded={expandedWord === word.id}
                onToggle={() => setExpandedWord(expandedWord === word.id ? null : word.id)}
                onLearn={() => markLearned(word)}
                isLearned={progress.wordsLearned.some((w) => w.word === word.word)}
              />
            ))
          )}
        </div>
      )}

      {/* LEARNED WORDS */}
      {tab === 'learned' && (
        <div className="space-y-3">
          {progress.wordsLearned.length === 0 ? (
            <Card variant="glass" padding="lg" className="text-center">
              <BookOpen className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No words learned yet. Visit Daily Words to start building your vocabulary!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab('daily')}>
                Go to Daily Words
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...progress.wordsLearned].reverse().map((word) => (
                <div key={word.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{word.word}</span>
                        <span className="text-gray-400 text-xs font-mono">{word.phonetic}</span>
                      </div>
                      <div className="text-gray-400 text-xs">{word.partOfSpeech}</div>
                    </div>
                    <button onClick={() => speak(word.word, { rate: 0.8 })} className="text-gray-500 hover:text-blue-400 transition-colors">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm">{word.meaning}</p>
                  <p className="text-gray-500 text-xs italic mt-1">"{word.exampleSentence}"</p>
                  {word.timesUsed > 0 && (
                    <div className="mt-2">
                      <Badge variant="green" size="sm">Used {word.timesUsed}x in conversation</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW / QUIZ */}
      {tab === 'review' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Quick quiz to reinforce your vocabulary. See the definition and recall the word.</p>

          {progress.wordsLearned.length === 0 ? (
            <Card variant="glass" padding="lg" className="text-center">
              <p className="text-gray-400">Learn some words first to start reviewing!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab('daily')}>
                Daily Words
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {!quizWord ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🧠</div>
                  <Button size="lg" onClick={startQuiz}>
                    Start Quick Quiz
                  </Button>
                  <p className="text-gray-500 text-sm mt-3">{progress.wordsLearned.length} words to review</p>
                </div>
              ) : (
                <Card variant="elevated" padding="lg" className="text-center space-y-4">
                  <Badge variant="purple">What is this word?</Badge>
                  <div className="bg-gray-800/60 rounded-xl p-5 space-y-2">
                    <div className="text-gray-400 text-sm font-medium">Definition:</div>
                    <p className="text-white text-lg">{quizWord.meaning}</p>
                    <p className="text-gray-400 text-sm italic">"{quizWord.exampleSentence}"</p>
                    <div className="text-gray-400 text-xs">{quizWord.partOfSpeech}</div>
                  </div>

                  {!quizRevealed ? (
                    <Button className="w-full" onClick={() => setQuizRevealed(true)}>
                      Reveal Word
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4">
                        <div className="text-3xl font-bold text-white">{quizWord.word}</div>
                        <div className="text-emerald-400 font-mono mt-1">{quizWord.phonetic}</div>
                        <button onClick={() => speak(quizWord.word, { rate: 0.8 })} className="mt-2 text-gray-400 hover:text-white flex items-center gap-1.5 mx-auto text-sm">
                          <Volume2 className="w-4 h-4" /> Listen
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="danger" className="flex-1" icon={<X className="w-4 h-4" />} onClick={startQuiz}>
                          Didn't know
                        </Button>
                        <Button variant="success" className="flex-1" icon={<Check className="w-4 h-4" />} onClick={startQuiz}>
                          Got it!
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Filler word alternatives */}
          <Card variant="default" padding="md">
            <h3 className="text-white font-semibold mb-3">🚫 Replace Filler Words</h3>
            <div className="space-y-2">
              {[
                { filler: '"very good"', alternatives: ['excellent', 'impressive', 'outstanding', 'remarkable'] },
                { filler: '"a lot"', alternatives: ['numerous', 'a great deal of', 'substantial', 'considerable'] },
                { filler: '"very big"', alternatives: ['enormous', 'massive', 'substantial', 'immense'] },
                { filler: '"good idea"', alternatives: ['brilliant', 'insightful', 'ingenious', 'clever'] },
              ].map((item) => (
                <div key={item.filler} className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400 text-sm">Instead of {item.filler}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.alternatives.map((alt) => (
                      <button
                        key={alt}
                        onClick={() => speak(alt)}
                        className="bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Word Card
// ─────────────────────────────────────────────

function WordCard({
  word,
  index,
  expanded,
  onToggle,
  onLearn,
  isLearned,
}: {
  word: VocabWord;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onLearn: () => void;
  isLearned: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={clsx(
        'border rounded-2xl overflow-hidden transition-all',
        isLearned ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700/50 bg-gray-800/60'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm font-mono w-5">{index + 1}.</span>
          <div>
            <span className="text-white font-bold text-lg">{word.word}</span>
            <span className="text-gray-400 text-sm ml-2 font-mono">{word.phonetic}</span>
          </div>
          <Badge variant={word.difficulty === 'easy' ? 'green' : word.difficulty === 'medium' ? 'blue' : 'purple'} size="sm">
            {word.difficulty}
          </Badge>
          {isLearned && <Badge variant="green" size="sm">✓ Learned</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); speak(word.word, { rate: 0.8 }); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <ChevronRight className={clsx('w-4 h-4 text-gray-500 transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700/50 px-5 pb-5 pt-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Meaning</div>
                <p className="text-gray-200 text-sm">{word.meaning}</p>
              </div>
              <div>
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Part of speech</div>
                <p className="text-gray-300 text-sm">{word.partOfSpeech}</p>
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Example sentence</div>
              <p className="text-blue-300 text-sm italic">"{word.exampleSentence}"</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {word.synonyms.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Synonyms</div>
                  <div className="flex flex-wrap gap-1">
                    {word.synonyms.map((s) => (
                      <span key={s} className="bg-blue-500/15 text-blue-300 text-xs px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {word.antonyms.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Antonyms</div>
                  <div className="flex flex-wrap gap-1">
                    {word.antonyms.map((a) => (
                      <span key={a} className="bg-red-500/15 text-red-300 text-xs px-2 py-0.5 rounded-md">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!isLearned && (
              <Button size="sm" variant="success" onClick={onLearn} icon={<Check className="w-4 h-4" />}>
                Mark as Learned
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
