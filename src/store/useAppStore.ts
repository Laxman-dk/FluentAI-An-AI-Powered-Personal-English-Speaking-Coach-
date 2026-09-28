import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserProfile,
  UserProgress,
  PracticeSession,
  ConversationMessage,
  DailyChallenge,
  AppView,
  SpeakingScores,
  SpeechMetrics,
  VocabWord,
  RecurringError,
  WeeklyProgress,
} from '../types';
import { CHALLENGE_PROMPTS } from '../constants';
import { format } from 'date-fns';

// ─────────────────────────────────────────────
//  Default Values
// ─────────────────────────────────────────────

const defaultScores: SpeakingScores = {
  grammar: 0,
  vocabulary: 0,
  pronunciation: 0,
  fluency: 0,
  sentenceConstruction: 0,
  confidence: 0,
  fillerWordUsage: 0,
  overall: 0,
};

const defaultMetrics: SpeechMetrics = {
  wordsPerMinute: 0,
  averagePauseDuration: 0,
  totalPauses: 0,
  longPauses: 0,
  grammaticalErrors: 0,
  fillerWords: 0,
  fillerWordList: [],
  vocabularyDiversity: 0,
  sentenceComplexity: 0,
  totalWords: 0,
  uniqueWords: 0,
  speakingDuration: 0,
};

const defaultProgress: UserProgress = {
  userId: '',
  currentScores: defaultScores,
  initialScores: defaultScores,
  weeklyHistory: [],
  totalSpeakingMinutes: 0,
  totalSessions: 0,
  totalWordsSpoken: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  wordsLearned: [],
  recurringErrors: [],
  cefrHistory: [],
};

// ─────────────────────────────────────────────
//  Store Interface
// ─────────────────────────────────────────────

interface AppStore {
  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // User
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  clearProfile: () => void;

  // Progress
  progress: UserProgress;
  setProgress: (progress: UserProgress) => void;
  updateScores: (scores: SpeakingScores) => void;
  addSession: (session: PracticeSession) => void;
  addWeeklyProgress: (week: WeeklyProgress) => void;
  addLearnedWord: (word: VocabWord) => void;
  addRecurringError: (error: RecurringError) => void;
  updateStreak: () => void;

  // Sessions
  sessions: PracticeSession[];
  activeSession: PracticeSession | null;
  startSession: (session: Omit<PracticeSession, 'messages' | 'scores' | 'metrics' | 'corrections' | 'pronunciationErrors' | 'wordsLearned'>) => void;
  endSession: (data: Partial<PracticeSession>) => void;
  addMessage: (message: ConversationMessage) => void;

  // Daily Challenge
  dailyChallenge: DailyChallenge | null;
  generateDailyChallenge: () => void;
  completeChallenge: (score: number) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  lastSessionId: string | null;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function generateChallenge(): DailyChallenge {
  const template = CHALLENGE_PROMPTS[Math.floor(Math.random() * CHALLENGE_PROMPTS.length)];
  return {
    ...template,
    id: generateId(),
    date: todayStr(),
    completed: false,
  };
}

// ─────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Navigation ──
      currentView: 'onboarding',
      setView: (view) => set({ currentView: view }),

      // ── User ──
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) => {
        const current = get().profile;
        if (current) set({ profile: { ...current, ...partial } });
      },
      clearProfile: () =>
        set({
          profile: null,
          progress: defaultProgress,
          sessions: [],
          activeSession: null,
          dailyChallenge: null,
          currentView: 'onboarding',
        }),

      // ── Progress ──
      progress: defaultProgress,
      setProgress: (progress) => set({ progress }),
      updateScores: (scores) => {
        const p = get().progress;
        set({ progress: { ...p, currentScores: scores } });
      },
      addSession: (session) => {
        const { sessions, progress } = get();
        const newSessions = [session, ...sessions].slice(0, 100); // keep last 100
        const totalMin = progress.totalSpeakingMinutes + Math.floor(session.durationSeconds / 60);
        const totalWords = progress.totalWordsSpoken + (session.metrics?.totalWords ?? 0);
        set({
          sessions: newSessions,
          progress: {
            ...progress,
            totalSessions: progress.totalSessions + 1,
            totalSpeakingMinutes: totalMin,
            totalWordsSpoken: totalWords,
          },
        });
      },
      addWeeklyProgress: (week) => {
        const p = get().progress;
        const history = [...p.weeklyHistory.filter((w) => w.week !== week.week), week];
        set({ progress: { ...p, weeklyHistory: history } });
      },
      addLearnedWord: (word) => {
        const p = get().progress;
        if (p.wordsLearned.find((w) => w.word === word.word)) return;
        set({ progress: { ...p, wordsLearned: [...p.wordsLearned, word] } });
      },
      addRecurringError: (error) => {
        const p = get().progress;
        const existing = p.recurringErrors.find((e) => e.pattern === error.pattern);
        if (existing) {
          const updated = p.recurringErrors.map((e) =>
            e.pattern === error.pattern
              ? { ...e, occurrences: e.occurrences + 1, lastSeen: error.lastSeen }
              : e
          );
          set({ progress: { ...p, recurringErrors: updated } });
        } else {
          set({ progress: { ...p, recurringErrors: [...p.recurringErrors, error] } });
        }
      },
      updateStreak: () => {
        const { progress } = get();
        const today = todayStr();
        if (progress.lastPracticeDate === today) return;

        const yesterday = format(
          new Date(Date.now() - 86400000),
          'yyyy-MM-dd'
        );
        const isConsecutive = progress.lastPracticeDate === yesterday;
        const newStreak = isConsecutive ? progress.currentStreak + 1 : 1;
        const longestStreak = Math.max(newStreak, progress.longestStreak);

        set({
          progress: {
            ...progress,
            currentStreak: newStreak,
            longestStreak,
            lastPracticeDate: today,
          },
        });
      },

      // ── Sessions ──
      sessions: [],
      activeSession: null,
      lastSessionId: null,
      startSession: (session) => {
        const full: PracticeSession = {
          ...session,
          messages: [],
          scores: defaultScores,
          metrics: defaultMetrics,
          corrections: [],
          pronunciationErrors: [],
          wordsLearned: [],
        };
        set({ activeSession: full });
      },
      endSession: (data) => {
        const { activeSession, sessions, progress } = get();
        if (!activeSession) return;
        const completed: PracticeSession = {
          ...activeSession,
          ...data,
          endedAt: new Date().toISOString(),
        };
        set({
          activeSession: null,
          sessions: [completed, ...sessions].slice(0, 100),
          lastSessionId: completed.id,
          progress: {
            ...progress,
            totalSessions: progress.totalSessions + 1,
            totalSpeakingMinutes:
              progress.totalSpeakingMinutes + Math.floor(completed.durationSeconds / 60),
            totalWordsSpoken: progress.totalWordsSpoken + (completed.metrics?.totalWords ?? 0),
          },
        });
      },
      addMessage: (message) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: {
            ...activeSession,
            messages: [...activeSession.messages, message],
          },
        });
      },

      // ── Daily Challenge ──
      dailyChallenge: null,
      generateDailyChallenge: () => {
        const existing = get().dailyChallenge;
        const today = todayStr();
        if (existing && existing.date === today) return;
        set({ dailyChallenge: generateChallenge() });
      },
      completeChallenge: (score) => {
        const challenge = get().dailyChallenge;
        if (!challenge) return;
        set({
          dailyChallenge: {
            ...challenge,
            completed: true,
            score,
            completedAt: new Date().toISOString(),
          },
        });
        get().updateStreak();
      },

      // ── UI ──
      isSidebarOpen: true,
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    }),
    {
      name: 'ai-coach-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        progress: state.progress,
        sessions: state.sessions,
        dailyChallenge: state.dailyChallenge,
        currentView: state.currentView,
        lastSessionId: state.lastSessionId,
      }),
    }
  )
);
