// ─────────────────────────────────────────────
//  Core Domain Types
// ─────────────────────────────────────────────

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ProficiencyLabel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Upper Intermediate' | 'Advanced';
export type CorrectionMode = 'gentle' | 'normal' | 'strict';
export type PracticeMode =
  | 'conversation'
  | 'interview'
  | 'group-discussion'
  | 'presentation'
  | 'roleplay'
  | 'pronunciation'
  | 'assessment';

export type ConversationTopic =
  | 'daily-life'
  | 'family'
  | 'food'
  | 'travel'
  | 'technology'
  | 'sports'
  | 'movies'
  | 'hobbies'
  | 'career'
  | 'education'
  | 'workplace'
  | 'custom';

export type SpeakingGoal =
  | 'daily-conversation'
  | 'college-communication'
  | 'job-interviews'
  | 'group-discussions'
  | 'presentations'
  | 'public-speaking'
  | 'workplace-english'
  | 'travel-english'
  | 'general-fluency'
  | 'pronunciation'
  | 'vocabulary'
  | 'grammar';

export type NativeLanguage =
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Bengali'
  | 'Marathi'
  | 'Gujarati'
  | 'Punjabi'
  | 'Urdu'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Mandarin'
  | 'Japanese'
  | 'Arabic'
  | 'Portuguese'
  | 'Russian'
  | 'Other';

// ─────────────────────────────────────────────
//  User Profile
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  nativeLanguage: NativeLanguage;
  currentLevel: ProficiencyLabel;
  cefrLevel: EnglishLevel;
  goals: SpeakingGoal[];
  dailyPracticeMinutes: number;
  preferredTopics: ConversationTopic[];
  careerGoal: string;
  confidenceLevel: 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = high
  strugglingAreas: string[];
  createdAt: string;
  lastActiveAt: string;
  assessmentCompleted: boolean;
  onboardingCompleted: boolean;
  settings: UserSettings;
}

export interface UserSettings {
  correctionMode: CorrectionMode;
  voiceEnabled: boolean;
  voiceSpeed: number; // 0.5 – 2.0
  selectedVoice: string;
  showPhonetics: boolean;
  nativeLanguageExplanations: boolean;
  darkMode: boolean;
  showLiveTranscript: boolean;
  notificationsEnabled: boolean;
  dailyReminderTime: string; // "HH:MM"
}

// ─────────────────────────────────────────────
//  Scores & Analysis
// ─────────────────────────────────────────────

export interface SpeakingScores {
  grammar: number;         // 0–100
  vocabulary: number;
  pronunciation: number;
  fluency: number;
  sentenceConstruction: number;
  confidence: number;
  fillerWordUsage: number; // 100 = no fillers
  overall: number;
}

export interface SpeechMetrics {
  wordsPerMinute: number;
  averagePauseDuration: number; // seconds
  totalPauses: number;
  longPauses: number;            // pauses > 3s
  grammaticalErrors: number;
  fillerWords: number;
  fillerWordList: { word: string; count: number }[];
  vocabularyDiversity: number;   // type-token ratio 0–1
  sentenceComplexity: number;    // avg words per sentence
  totalWords: number;
  uniqueWords: number;
  speakingDuration: number;      // seconds
}

// ─────────────────────────────────────────────
//  Grammar Analysis
// ─────────────────────────────────────────────

export type GrammarErrorType =
  | 'tense'
  | 'article'
  | 'preposition'
  | 'subject-verb-agreement'
  | 'plural'
  | 'word-order'
  | 'verb-form'
  | 'missing-word'
  | 'fragment'
  | 'structure';

export interface GrammarError {
  id: string;
  type: GrammarErrorType;
  original: string;
  corrected: string;
  explanation: string;
  example: string;
  severity: 'minor' | 'moderate' | 'major';
}

// ─────────────────────────────────────────────
//  Vocabulary
// ─────────────────────────────────────────────

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
  partOfSpeech: string;
  exampleSentence: string;
  synonyms: string[];
  antonyms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  addedAt: string;
  learnedAt?: string;
  usedInConversation: boolean;
  timesUsed: number;
}

export interface VocabSuggestion {
  original: string;
  alternatives: string[];
  reason: string;
}

// ─────────────────────────────────────────────
//  Pronunciation
// ─────────────────────────────────────────────

export interface PronunciationError {
  id: string;
  word: string;
  userPronunciation: string;
  correctPronunciation: string;
  phonetic: string;
  tip: string;
  practicePhrase: string;
  occurrences: number;
}

// ─────────────────────────────────────────────
//  Conversation Messages
// ─────────────────────────────────────────────

export type MessageRole = 'user' | 'coach' | 'system';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
  audioUrl?: string;
  timestamp: string;
  analysis?: MessageAnalysis;
  isTyping?: boolean;
}

export interface MessageAnalysis {
  grammarErrors: GrammarError[];
  vocabSuggestions: VocabSuggestion[];
  pronunciationErrors: PronunciationError[];
  metrics: Partial<SpeechMetrics>;
  correctedText?: string;
  betterVersion?: string;
  positives: string[];
}

// ─────────────────────────────────────────────
//  Session
// ─────────────────────────────────────────────

export interface PracticeSession {
  id: string;
  userId: string;
  mode: PracticeMode;
  topic: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  messages: ConversationMessage[];
  scores: SpeakingScores;
  metrics: SpeechMetrics;
  corrections: GrammarError[];
  pronunciationErrors: PronunciationError[];
  wordsLearned: string[];
  report?: SessionReport;
}

export interface SessionReport {
  sessionId: string;
  duration: string;
  speakingSpeed: number;
  fillerWords: number;
  grammarMistakes: number;
  pronunciationIssues: number;
  wentWell: string[];
  improve: string[];
  topCorrections: { original: string; corrected: string }[];
  nextChallenge: string;
  overallScore: number;
}

// ─────────────────────────────────────────────
//  Progress
// ─────────────────────────────────────────────

export interface WeeklyProgress {
  week: string; // "2024-W01"
  grammarScore: number;
  vocabularyScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  overallScore: number;
  totalMinutes: number;
  sessionsCount: number;
}

export interface UserProgress {
  userId: string;
  currentScores: SpeakingScores;
  initialScores: SpeakingScores;
  weeklyHistory: WeeklyProgress[];
  totalSpeakingMinutes: number;
  totalSessions: number;
  totalWordsSpoken: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
  wordsLearned: VocabWord[];
  recurringErrors: RecurringError[];
  cefrHistory: { level: EnglishLevel; date: string }[];
}

export interface RecurringError {
  pattern: string;
  description: string;
  examples: string[];
  occurrences: number;
  lastSeen: string;
  exerciseSuggested: string;
}

// ─────────────────────────────────────────────
//  Daily Challenge
// ─────────────────────────────────────────────

export type ChallengeType =
  | 'speak-about'
  | 'random-question'
  | 'story'
  | 'opinion'
  | 'description'
  | 'word-challenge'
  | 'pronunciation';

export interface DailyChallenge {
  id: string;
  date: string;
  type: ChallengeType;
  title: string;
  prompt: string;
  targetDuration: number; // seconds
  targetWords?: string[];
  completed: boolean;
  score?: number;
  completedAt?: string;
}

// ─────────────────────────────────────────────
//  Roleplay Scenarios
// ─────────────────────────────────────────────

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  aiRole: string;
  userRole: string;
  setting: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  openingLine: string;
  icon: string;
}

// ─────────────────────────────────────────────
//  Speaking Games
// ─────────────────────────────────────────────

export type GameType =
  | 'word-challenge'
  | 'describe-it'
  | '30-second'
  | 'story-builder'
  | 'rapid-questions'
  | 'pronunciation-challenge';

export interface SpeakingGame {
  id: string;
  type: GameType;
  title: string;
  description: string;
  instructions: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────
//  Speech Recognition State
// ─────────────────────────────────────────────

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export interface SpeechState {
  recordingState: RecordingState;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  audioLevel: number;
  errorMessage?: string;
}

// ─────────────────────────────────────────────
//  App Navigation
// ─────────────────────────────────────────────

export type AppView =
  | 'onboarding'
  | 'assessment'
  | 'home'
  | 'conversation'
  | 'practice'
  | 'pronunciation'
  | 'vocabulary'
  | 'dashboard'
  | 'challenges'
  | 'games'
  | 'settings'
  | 'tutor'
  | 'session-report';
