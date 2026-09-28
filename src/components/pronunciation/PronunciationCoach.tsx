import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, RefreshCw, ChevronRight, Search } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { speechService, speak } from '../../services/speechService';
import { getPronunciationFeedback } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';

const DIFFICULT_SOUNDS = [
  { category: 'TH sounds', words: ['think', 'this', 'three', 'that', 'through', 'weather', 'brother', 'tooth'] },
  { category: 'V vs W', words: ['very', 'village', 'voice', 'west', 'wine', 'world', 'vowel', 'wave'] },
  { category: 'R sound', words: ['right', 'really', 'write', 'road', 'rural', 'rare', 'rate'] },
  { category: 'Short vowels', words: ['bit', 'beat', 'bet', 'bat', 'but', 'boot', 'book'] },
  { category: 'Consonant clusters', words: ['strength', 'splash', 'strict', 'sprint', 'scratch', 'spring'] },
  { category: 'Silent letters', words: ['knee', 'know', 'write', 'wrong', 'psychology', 'receipt', 'island'] },
];

const TONGUE_TWISTERS = [
  { text: "She sells seashells by the seashore.", focus: 'S and SH sounds' },
  { text: "How much wood would a woodchuck chuck?", focus: 'W and CH sounds' },
  { text: "Peter Piper picked a peck of pickled peppers.", focus: 'P sound' },
  { text: "The thirty-three thieves thought that they thrilled the throne.", focus: 'TH sound' },
  { text: "Whether the weather is warm, whether the weather is hot.", focus: 'W and TH sounds' },
];

export default function PronunciationCoach() {
  const { profile } = useAppStore();
  const [searchWord, setSearchWord] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    phonetic: string;
    tips: string[];
    commonMistakes: string;
    practiceWords: string[];
  } | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedWord, setRecordedWord] = useState('');
  const [practiceTranscript, setPracticeTranscript] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeTwister, setActiveTwister] = useState(0);

  async function lookupWord(word: string) {
    if (!word.trim() || !profile) return;
    setSelectedWord(word);
    setFeedback(null);
    setLoadingFeedback(true);
    try {
      const result = await getPronunciationFeedback(word, profile.nativeLanguage);
      setFeedback(result);
    } catch {
      setFeedback({
        phonetic: `/${word}/`,
        tips: ['Focus on each syllable', 'Practice slowly then speed up'],
        commonMistakes: 'Pay attention to vowel sounds',
        practiceWords: [],
      });
    } finally {
      setLoadingFeedback(false);
    }
  }

  async function startRecordingPractice() {
    setPracticeTranscript('');
    await speechService.startRecording();
    setIsRecording(true);
  }

  async function stopRecordingPractice() {
    const text = await speechService.stopRecording();
    setIsRecording(false);
    setPracticeTranscript(text || practiceTranscript);
  }

  function speakWord(word: string) {
    speak(word, { rate: 0.7 });
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pronunciation Coach</h1>
        <p className="text-gray-400 text-sm mt-1">Master English sounds, practice difficult words, and eliminate common pronunciation errors.</p>
      </div>

      {/* Word Lookup */}
      <Card variant="elevated" padding="md">
        <h3 className="text-white font-semibold mb-3">🔍 Word Pronunciation Guide</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookupWord(searchWord)}
            placeholder="Type any English word..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <Button onClick={() => lookupWord(searchWord)} icon={<Search className="w-4 h-4" />} disabled={!searchWord.trim()}>
            Analyze
          </Button>
        </div>

        <AnimatePresence>
          {selectedWord && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {loadingFeedback ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Analyzing pronunciation…
                </div>
              ) : feedback ? (
                <div className="space-y-3">
                  {/* Word + phonetic */}
                  <div className="flex items-center gap-4 bg-gray-700/40 rounded-xl p-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{selectedWord}</div>
                      <div className="text-blue-400 font-mono text-lg">{feedback.phonetic}</div>
                    </div>
                    <button
                      onClick={() => speakWord(selectedWord)}
                      className="w-10 h-10 bg-blue-600/20 hover:bg-blue-600/40 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Volume2 className="w-5 h-5 text-blue-400" />
                    </button>
                  </div>

                  {/* Common mistakes */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="text-red-400 text-xs font-semibold mb-1">⚠️ Common mistake for {profile?.nativeLanguage} speakers</div>
                    <p className="text-gray-300 text-sm">{feedback.commonMistakes}</p>
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    {feedback.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
                        {tip}
                      </div>
                    ))}
                  </div>

                  {/* Practice similar words */}
                  {feedback.practiceWords.length > 0 && (
                    <div>
                      <div className="text-gray-400 text-xs font-medium mb-2">Practice with similar sounds:</div>
                      <div className="flex flex-wrap gap-2">
                        {feedback.practiceWords.map((w) => (
                          <button
                            key={w}
                            onClick={() => speakWord(w)}
                            className="flex items-center gap-1.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Record yourself */}
                  <div className="bg-gray-700/30 rounded-xl p-4 space-y-3">
                    <div className="text-gray-300 text-sm font-medium">🎤 Record yourself saying "{selectedWord}"</div>
                    <div className="flex gap-2">
                      <Button
                        variant={isRecording ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={isRecording ? stopRecordingPractice : startRecordingPractice}
                        icon={isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      >
                        {isRecording ? 'Stop Recording' : 'Record'}
                      </Button>
                    </div>
                    {practiceTranscript && (
                      <div className="text-sm">
                        <span className="text-gray-400">You said: </span>
                        <span className={clsx(
                          'font-medium',
                          practiceTranscript.toLowerCase().includes(selectedWord.toLowerCase())
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        )}>
                          "{practiceTranscript}"
                        </span>
                        {practiceTranscript.toLowerCase().includes(selectedWord.toLowerCase()) ? (
                          <div className="text-emerald-400 text-xs mt-1">✓ Recognized correctly!</div>
                        ) : (
                          <div className="text-amber-400 text-xs mt-1">Practice more and try again.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Difficult Sounds */}
      <Card variant="elevated" padding="md">
        <h3 className="text-white font-semibold mb-3">🔊 Common Difficult Sounds</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {DIFFICULT_SOUNDS.map((cat, i) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(i)}
              className={clsx(
                'text-xs px-3 py-1.5 rounded-lg transition-all',
                activeCategory === i ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {cat.category}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULT_SOUNDS[activeCategory].words.map((word) => (
            <button
              key={word}
              onClick={() => { speakWord(word); lookupWord(word); setSearchWord(word); }}
              className="flex items-center gap-1.5 bg-gray-700/60 hover:bg-blue-600/20 hover:border-blue-500/40 border border-gray-600 text-gray-300 hover:text-blue-300 text-sm px-3 py-2 rounded-xl transition-all"
            >
              <Volume2 className="w-3 h-3 flex-shrink-0" />
              {word}
            </button>
          ))}
        </div>
      </Card>

      {/* Tongue Twisters */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">👅 Tongue Twisters</h3>
          <button
            onClick={() => setActiveTwister((t) => (t + 1) % TONGUE_TWISTERS.length)}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-gradient-to-r from-purple-600/15 to-blue-600/15 border border-purple-500/20 rounded-xl p-5 text-center space-y-3">
          <p className="text-white text-lg font-medium leading-relaxed">
            "{TONGUE_TWISTERS[activeTwister].text}"
          </p>
          <Badge variant="purple">Focus: {TONGUE_TWISTERS[activeTwister].focus}</Badge>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => speak(TONGUE_TWISTERS[activeTwister].text, { rate: 0.75 })}
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              <Volume2 className="w-4 h-4" />
              Slow
            </button>
            <button
              onClick={() => speak(TONGUE_TWISTERS[activeTwister].text, { rate: 1.1 })}
              className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300"
            >
              <Volume2 className="w-4 h-4" />
              Normal
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {TONGUE_TWISTERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTwister(i)}
              className={clsx('w-2 h-2 rounded-full transition-colors', i === activeTwister ? 'bg-blue-500' : 'bg-gray-600')}
            />
          ))}
        </div>
      </Card>

      {/* Minimal Pairs */}
      <Card variant="elevated" padding="md">
        <h3 className="text-white font-semibold mb-4">👂 Minimal Pairs Practice</h3>
        <p className="text-gray-400 text-sm mb-4">Listen to the difference between similar-sounding words.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['ship', 'sheep'], ['bit', 'beat'], ['full', 'fool'],
            ['think', 'sink'], ['live', 'leave'], ['bad', 'bed'],
          ].map(([w1, w2]) => (
            <div key={`${w1}-${w2}`} className="bg-gray-700/40 rounded-xl p-3 flex items-center gap-2">
              <button onClick={() => speak(w1, { rate: 0.8 })} className="flex-1 text-center text-white font-medium text-sm hover:text-blue-400 transition-colors">
                {w1}
              </button>
              <span className="text-gray-500 text-xs">vs</span>
              <button onClick={() => speak(w2, { rate: 0.8 })} className="flex-1 text-center text-white font-medium text-sm hover:text-blue-400 transition-colors">
                {w2}
              </button>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-3 text-center">Click a word to hear its pronunciation</p>
      </Card>
    </div>
  );
}
