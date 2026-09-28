import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Mic, Globe, Target, Clock, Brain, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import type { UserProfile, NativeLanguage, ProficiencyLabel, SpeakingGoal, ConversationTopic } from '../../types';
import {
  NATIVE_LANGUAGES,
  PROFICIENCY_LEVELS,
  SPEAKING_GOALS,
  CONVERSATION_TOPICS,
  PROFICIENCY_TO_CEFR,
} from '../../constants';
import { useAppStore } from '../../store/useAppStore';

// ─────────────────────────────────────────────
//  Step definitions
// ─────────────────────────────────────────────

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Mic },
  { id: 'basic', title: 'About You', icon: Globe },
  { id: 'level', title: 'Your Level', icon: Brain },
  { id: 'goals', title: 'Your Goals', icon: Target },
  { id: 'topics', title: 'Topics', icon: Globe },
  { id: 'schedule', title: 'Schedule', icon: Clock },
  { id: 'ready', title: 'All Set', icon: CheckCircle },
];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

// ─────────────────────────────────────────────
//  Onboarding Component
// ─────────────────────────────────────────────

export default function Onboarding() {
  const { setProfile, setView, generateDailyChallenge } = useAppStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    nativeLanguage: 'Hindi' as NativeLanguage,
    currentLevel: 'Intermediate' as ProficiencyLabel,
    goals: [] as SpeakingGoal[],
    topics: [] as ConversationTopic[],
    dailyMinutes: 15,
    careerGoal: '',
    confidenceLevel: 3 as 1 | 2 | 3 | 4 | 5,
    strugglingAreas: [] as string[],
  });

  const STRUGGLING = [
    'Grammar', 'Pronunciation', 'Vocabulary', 'Fluency',
    'Confidence', 'Sentence formation', 'Listening', 'Filler words',
  ];

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function canProceed() {
    if (step === 1) return form.name.trim().length >= 2;
    if (step === 3) return form.goals.length >= 1;
    if (step === 4) return form.topics.length >= 1;
    return true;
  }

  function finish() {
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: generateId(),
      name: form.name.trim(),
      nativeLanguage: form.nativeLanguage,
      currentLevel: form.currentLevel,
      cefrLevel: PROFICIENCY_TO_CEFR[form.currentLevel],
      goals: form.goals,
      dailyPracticeMinutes: form.dailyMinutes,
      preferredTopics: form.topics as ConversationTopic[],
      careerGoal: form.careerGoal,
      confidenceLevel: form.confidenceLevel,
      strugglingAreas: form.strugglingAreas,
      createdAt: now,
      lastActiveAt: now,
      assessmentCompleted: false,
      onboardingCompleted: true,
      settings: {
        correctionMode: 'normal',
        voiceEnabled: true,
        voiceSpeed: 1.0,
        selectedVoice: '',
        showPhonetics: true,
        nativeLanguageExplanations: false,
        darkMode: true,
        showLiveTranscript: true,
        notificationsEnabled: true,
        dailyReminderTime: '09:00',
      },
    };
    setProfile(profile);
    generateDailyChallenge();
    setView('assessment');
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress bar */}
        {step > 0 && step < STEPS.length - 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.slice(1, -1).map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                      i + 1 < step
                        ? 'bg-blue-600 text-white'
                        : i + 1 === step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                        : 'bg-gray-700 text-gray-400'
                    )}
                  >
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 3 && (
                    <div className={clsx('h-0.5 w-8 sm:w-16 mx-1', i + 1 < step ? 'bg-blue-600' : 'bg-gray-700')} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="bg-gray-900 border border-gray-700/50 rounded-3xl p-8 shadow-2xl"
          >
            {/* STEP 0 — Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-lg shadow-blue-600/30">
                  🎙️
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-3">
                    AI English Speaking Coach
                  </h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Your personal 24/7 English speaking coach. Practice conversations, improve pronunciation, master grammar, and build confidence.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { icon: '🎯', text: 'Personalized lessons based on your level' },
                    { icon: '📊', text: 'Real-time grammar & pronunciation feedback' },
                    { icon: '🏆', text: 'Track progress with detailed reports' },
                    { icon: '🎭', text: 'Interview, roleplay & presentation practice' },
                  ].map((item) => (
                    <div key={item.text} className="bg-gray-800/60 rounded-xl p-3 flex gap-2">
                      <span className="text-xl flex-shrink-0">{item.icon}</span>
                      <span className="text-gray-300 text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="w-full" onClick={() => setStep(1)}>
                  Get Started <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* STEP 1 — Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Tell us about you</h2>
                  <p className="text-gray-400">This helps us personalize your coaching experience.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Native language
                    </label>
                    <select
                      value={form.nativeLanguage}
                      onChange={(e) => update('nativeLanguage', e.target.value as NativeLanguage)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {NATIVE_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Career / education goal <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.careerGoal}
                      onChange={(e) => update('careerGoal', e.target.value)}
                      placeholder="e.g. Software engineer, MBA student, Doctor..."
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Level */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Your English level</h2>
                  <p className="text-gray-400">Pick the level that best describes you right now.</p>
                </div>
                <div className="space-y-3">
                  {PROFICIENCY_LEVELS.map((level) => {
                    const descriptions: Record<ProficiencyLabel, string> = {
                      Beginner: 'I know very basic words and simple sentences.',
                      Elementary: 'I can handle simple, familiar situations.',
                      Intermediate: 'I can manage most everyday conversations.',
                      'Upper Intermediate': 'I can discuss a wide range of topics fluently.',
                      Advanced: 'I speak with fluency, accuracy, and confidence.',
                    };
                    return (
                      <button
                        key={level}
                        onClick={() => update('currentLevel', level)}
                        className={clsx(
                          'w-full text-left px-4 py-4 rounded-xl border transition-all',
                          form.currentLevel === level
                            ? 'border-blue-500 bg-blue-600/15 text-white'
                            : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{level}</div>
                            <div className="text-sm text-gray-400">{descriptions[level]}</div>
                          </div>
                          {form.currentLevel === level && (
                            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Confidence level when speaking English
                  </label>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => update('confidenceLevel', n)}
                        className={clsx(
                          'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all',
                          form.confidenceLevel === n
                            ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        )}
                      >
                        {['😰', '😟', '😐', '🙂', '😄'][n - 1]}
                        <div className="text-xs mt-1">{['Very low', 'Low', 'OK', 'Good', 'High'][n - 1]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Goals */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Your speaking goals</h2>
                  <p className="text-gray-400">Select all that apply — you can have multiple goals.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {SPEAKING_GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => update('goals', toggleArray(form.goals, g.value) as SpeakingGoal[])}
                      className={clsx(
                        'text-left px-3 py-3 rounded-xl border transition-all',
                        form.goals.includes(g.value)
                          ? 'border-blue-500 bg-blue-600/15 text-white'
                          : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <div className="text-sm font-medium mt-1">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 — Topics */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Preferred topics</h2>
                  <p className="text-gray-400">What would you like to talk about?</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CONVERSATION_TOPICS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => update('topics', toggleArray(form.topics, t.value) as ConversationTopic[])}
                      className={clsx(
                        'text-left px-3 py-3 rounded-xl border transition-all',
                        form.topics.includes(t.value)
                          ? 'border-blue-500 bg-blue-600/15 text-white'
                          : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                      )}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div className="text-sm font-medium mt-1">{t.label}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    What do you struggle with most?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STRUGGLING.map((s) => (
                      <button
                        key={s}
                        onClick={() => update('strugglingAreas', toggleArray(form.strugglingAreas, s))}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          form.strugglingAreas.includes(s)
                            ? 'border-purple-500 bg-purple-600/15 text-purple-300'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — Schedule */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Daily practice time</h2>
                  <p className="text-gray-400">How many minutes can you practice each day?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15, 20, 30, 45].map((min) => (
                    <button
                      key={min}
                      onClick={() => update('dailyMinutes', min)}
                      className={clsx(
                        'py-4 rounded-xl border font-semibold text-lg transition-all',
                        form.dailyMinutes === min
                          ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                      )}
                    >
                      {min}
                      <div className="text-xs font-normal text-gray-400">min</div>
                    </button>
                  ))}
                </div>
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-300 text-sm">
                    💡 Even <strong>10 minutes per day</strong> of consistent practice will lead to noticeable improvement within 4 weeks.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 6 — Ready */}
            {step === 6 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-lg">
                  🚀
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    You're all set, {form.name}!
                  </h2>
                  <p className="text-gray-400">
                    We've customized your coaching plan. Let's start with a quick speaking assessment to understand your current level.
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 text-left space-y-2">
                  <div className="text-sm text-gray-300 font-medium mb-3">Your profile:</div>
                  {[
                    { label: 'Level', value: form.currentLevel },
                    { label: 'Goals', value: `${form.goals.length} selected` },
                    { label: 'Topics', value: `${form.topics.length} selected` },
                    { label: 'Daily practice', value: `${form.dailyMinutes} minutes` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400 bg-gray-800/40 rounded-xl p-3">
                  📋 The assessment takes 3–5 minutes. You'll speak about a few simple topics and we'll analyze your English level.
                </div>
                <Button size="lg" className="w-full" onClick={finish}>
                  Start Speaking Assessment <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Navigation buttons */}
            {step > 0 && step < STEPS.length - 1 && (
              <div className="flex gap-3 mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  icon={<ChevronLeft className="w-4 h-4" />}
                  className="flex-shrink-0"
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canProceed()}
                  onClick={() => setStep((s) => s + 1)}
                  iconPosition="right"
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  {step === STEPS.length - 2 ? 'Finish' : 'Continue'}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
