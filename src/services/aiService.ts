import type {
  UserProfile,
  ConversationMessage,
  MessageAnalysis,
  GrammarError,
  VocabSuggestion,
  PronunciationError,
  SpeakingScores,
  SpeechMetrics,
  PracticeMode,
  CorrectionMode,
  EnglishLevel,
} from '../types';
import { FILLER_WORDS } from '../constants';

// ─────────────────────────────────────────────
//  OpenAI Client (lazy init with user key)
// ─────────────────────────────────────────────

let _apiKey: string | null = null;

export function setApiKey(key: string) {
  _apiKey = key;
  localStorage.setItem('coach_api_key', key);
}

export function getApiKey(): string | null {
  if (_apiKey) return _apiKey;
  _apiKey = localStorage.getItem('coach_api_key');
  return _apiKey;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

async function callOpenAI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7,
  maxTokens = 1000
): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

// ─────────────────────────────────────────────
//  System Prompts
// ─────────────────────────────────────────────

function buildCoachSystemPrompt(
  profile: UserProfile,
  mode: PracticeMode,
  correctionMode: CorrectionMode
): string {
  const levelInstructions: Record<EnglishLevel, string> = {
    A1: 'Use very short, simple sentences. Speak slowly and clearly. Use basic vocabulary only.',
    A2: 'Use short sentences and common vocabulary. Be patient and encouraging.',
    B1: 'Use natural conversational English. Moderate vocabulary and sentence complexity.',
    B2: 'Use natural English with idioms. More complex topics and vocabulary.',
    C1: 'Use advanced vocabulary, idioms, and complex discussions.',
    C2: 'Engage at native-speaker level with nuanced vocabulary and debates.',
  };

  const correctionInstructions: Record<CorrectionMode, string> = {
    gentle: 'Only correct critical grammar mistakes that block understanding. Skip minor errors. Be very encouraging.',
    normal: 'Correct important grammar, vocabulary, and pronunciation mistakes. Be balanced and supportive.',
    strict: 'Provide detailed corrections after every response. Cover all grammar, vocabulary, and pronunciation issues.',
  };

  const modeContext: Record<PracticeMode, string> = {
    conversation: 'Casual English conversation practice. Keep the conversation flowing naturally.',
    interview: 'You are a professional interviewer. Ask interview questions, then provide communication feedback.',
    'group-discussion': 'You are facilitating a group discussion. Present the topic, let the user speak, then give structured feedback.',
    presentation: 'You are an audience member and coach. The user is giving a presentation. Provide feedback on structure, delivery, and language.',
    roleplay: 'Stay in character for the roleplay scenario. Only break character to give language feedback when appropriate.',
    pronunciation: 'Focus entirely on pronunciation coaching. Give phonetic guidance and practice exercises.',
    assessment: 'You are conducting an English speaking assessment. Ask questions, analyze responses, and generate a detailed assessment report.',
  };

  return `You are an expert AI English speaking coach named "Coach Alex". 

STUDENT PROFILE:
- Name: ${profile.name}
- Native Language: ${profile.nativeLanguage}
- Current Level: ${profile.cefrLevel} (${profile.currentLevel})
- Goals: ${profile.goals.join(', ')}
- Struggling areas: ${profile.strugglingAreas.join(', ')}

LANGUAGE LEVEL GUIDANCE: ${levelInstructions[profile.cefrLevel]}
CORRECTION MODE: ${correctionInstructions[correctionMode]}
SESSION MODE: ${modeContext[mode]}

COACHING PRINCIPLES:
1. Be friendly, patient, encouraging, and professional.
2. Never be judgmental or discouraging.
3. Fluency first — keep conversation flowing even with errors.
4. For minor mistakes: note them briefly and continue.
5. For repeated/major mistakes: correct immediately with explanation.
6. Always provide a "better version" when correcting.
7. Use the student's name occasionally to feel personal.
8. End responses with a follow-up question or prompt to keep the student speaking.
9. Do NOT say "Perfect!" when there are clear mistakes. Say "Good attempt" or "That's coming along well."
10. Keep your responses concise — the student should talk MORE than you.

RESPONSE FORMAT FOR CORRECTIONS:
When correcting, use this structure:
✏️ You said: "[original]"
✅ Better: "[corrected]"
💡 Why: [brief explanation]

Always respond in English unless asked to explain in the student's native language.`;
}

// ─────────────────────────────────────────────
//  Coach Response
// ─────────────────────────────────────────────

export async function getCoachResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  profile: UserProfile,
  mode: PracticeMode,
  correctionMode: CorrectionMode
): Promise<string> {
  const systemPrompt = buildCoachSystemPrompt(profile, mode, correctionMode);

  const historyMessages = conversationHistory.slice(-10).map((msg) => ({
    role: (msg.role === 'coach' ? 'assistant' : msg.role) as 'user' | 'assistant' | 'system',
    content: msg.text,
  }));

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...historyMessages,
    { role: 'user' as const, content: userMessage },
  ];

  return callOpenAI(messages, 0.75, 600);
}

// ─────────────────────────────────────────────
//  Speech Analysis
// ─────────────────────────────────────────────

export async function analyzeUserSpeech(
  transcript: string,
  profile: UserProfile,
  correctionMode: CorrectionMode
): Promise<MessageAnalysis> {
  if (!transcript.trim()) {
    return {
      grammarErrors: [],
      vocabSuggestions: [],
      pronunciationErrors: [],
      metrics: {},
      positives: [],
    };
  }

  const prompt = `Analyze this English spoken text from a ${profile.cefrLevel} level speaker whose native language is ${profile.nativeLanguage}.

TEXT: "${transcript}"

Correction mode: ${correctionMode} (gentle=only critical errors, normal=important errors, strict=all errors)

Return a JSON object with this exact structure:
{
  "grammarErrors": [
    {
      "id": "g1",
      "type": "tense|article|preposition|subject-verb-agreement|plural|word-order|verb-form|missing-word|fragment|structure",
      "original": "the wrong phrase",
      "corrected": "the correct phrase",
      "explanation": "brief why",
      "example": "practice sentence",
      "severity": "minor|moderate|major"
    }
  ],
  "vocabSuggestions": [
    {
      "original": "basic word",
      "alternatives": ["better word 1", "better word 2"],
      "reason": "why these are better"
    }
  ],
  "pronunciationNotes": ["word that might be mispronounced based on native language"],
  "correctedText": "the full corrected version of the input",
  "betterVersion": "a more natural/fluent version of the same meaning",
  "positives": ["what was done well - 1-2 things"],
  "overallQuality": "good|fair|needs-work"
}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await callOpenAI(
      [{ role: 'user', content: prompt }],
      0.3,
      800
    );

    const cleaned = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // compute local metrics
    const metrics = computeLocalMetrics(transcript);

    return {
      grammarErrors: parsed.grammarErrors || [],
      vocabSuggestions: parsed.vocabSuggestions || [],
      pronunciationErrors: (parsed.pronunciationNotes || []).map(
        (w: string, i: number): PronunciationError => ({
          id: `p${i}`,
          word: w,
          userPronunciation: '',
          correctPronunciation: w,
          phonetic: '',
          tip: `Pay attention to the pronunciation of "${w}"`,
          practicePhrase: `Practice saying: "${w}"`,
          occurrences: 1,
        })
      ),
      metrics,
      correctedText: parsed.correctedText,
      betterVersion: parsed.betterVersion,
      positives: parsed.positives || [],
    };
  } catch {
    // If API fails or parsing fails, return local-only analysis
    return {
      grammarErrors: [],
      vocabSuggestions: [],
      pronunciationErrors: [],
      metrics: computeLocalMetrics(transcript),
      positives: ['Keep practicing — every sentence counts!'],
    };
  }
}

// ─────────────────────────────────────────────
//  Local Metrics (no API needed)
// ─────────────────────────────────────────────

export function computeLocalMetrics(transcript: string): Partial<SpeechMetrics> {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s']/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const uniqueWords = new Set(words);
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 2);

  const fillerWordList: { word: string; count: number }[] = [];
  FILLER_WORDS.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = transcript.match(regex);
    if (matches && matches.length > 0) {
      fillerWordList.push({ word: filler, count: matches.length });
    }
  });

  const totalFillers = fillerWordList.reduce((acc, f) => acc + f.count, 0);

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    vocabularyDiversity: words.length > 0 ? uniqueWords.size / words.length : 0,
    sentenceComplexity: sentences.length > 0 ? words.length / sentences.length : 0,
    fillerWords: totalFillers,
    fillerWordList,
    grammaticalErrors: 0, // set by AI
  };
}

// ─────────────────────────────────────────────
//  Assessment
// ─────────────────────────────────────────────

export async function generateAssessmentReport(
  responses: { question: string; answer: string }[],
  profile: UserProfile
): Promise<{ scores: SpeakingScores; metrics: SpeechMetrics; cefrLevel: EnglishLevel; summary: string; strengths: string[]; weaknesses: string[] }> {
  const allText = responses.map((r) => r.answer).join(' ');
  const localMetrics = computeLocalMetrics(allText);

  const prompt = `You are an expert English language assessor. Analyze these spoken English responses from a person whose native language is ${profile.nativeLanguage}.

RESPONSES:
${responses.map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`).join('\n\n')}

TOTAL WORD COUNT: ${localMetrics.totalWords}
VOCABULARY DIVERSITY: ${((localMetrics.vocabularyDiversity ?? 0) * 100).toFixed(0)}%
FILLER WORDS DETECTED: ${JSON.stringify(localMetrics.fillerWordList)}

Provide a comprehensive assessment. Return ONLY valid JSON:
{
  "scores": {
    "grammar": 0-100,
    "vocabulary": 0-100,
    "pronunciation": 0-100,
    "fluency": 0-100,
    "sentenceConstruction": 0-100,
    "confidence": 0-100,
    "fillerWordUsage": 0-100,
    "overall": 0-100
  },
  "cefrLevel": "A1|A2|B1|B2|C1|C2",
  "estimatedWPM": number,
  "summary": "2-3 sentence honest assessment summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "topGrammarIssues": ["issue 1", "issue 2"],
  "vocabularyLevel": "basic|intermediate|advanced",
  "recommendation": "personalized next step advice"
}`;

  try {
    const response = await callOpenAI([{ role: 'user', content: prompt }], 0.3, 800);
    const cleaned = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const metrics: SpeechMetrics = {
      ...localMetrics as SpeechMetrics,
      wordsPerMinute: parsed.estimatedWPM || 100,
      averagePauseDuration: 1.5,
      totalPauses: 0,
      longPauses: 0,
      grammaticalErrors: 0,
      speakingDuration: 0,
    };

    return {
      scores: parsed.scores,
      metrics,
      cefrLevel: parsed.cefrLevel,
      summary: parsed.summary,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
    };
  } catch {
    // Fallback scores based on local analysis
    const diversity = localMetrics.vocabularyDiversity ?? 0;
    const baseScore = Math.min(80, Math.max(30, Math.round(diversity * 150)));
    return {
      scores: {
        grammar: baseScore,
        vocabulary: baseScore + 5,
        pronunciation: baseScore + 10,
        fluency: baseScore - 5,
        sentenceConstruction: baseScore,
        confidence: baseScore + 5,
        fillerWordUsage: Math.max(40, 100 - (localMetrics.fillerWords ?? 0) * 10),
        overall: baseScore,
      },
      metrics: { ...localMetrics as SpeechMetrics, wordsPerMinute: 100, averagePauseDuration: 1.5, totalPauses: 0, longPauses: 0, grammaticalErrors: 0, speakingDuration: 0 },
      cefrLevel: 'B1',
      summary: 'Assessment complete. Keep practicing to improve your English speaking skills.',
      strengths: ['You attempted all questions', 'You communicated your ideas'],
      weaknesses: ['Continue working on grammar accuracy', 'Expand your vocabulary'],
    };
  }
}

// ─────────────────────────────────────────────
//  Session Report
// ─────────────────────────────────────────────

export async function generateSessionReport(
  messages: ConversationMessage[],
  profile: UserProfile,
  durationSeconds: number
): Promise<{ scores: SpeakingScores; report: import('../types').SessionReport }> {
  const userMessages = messages.filter((m) => m.role === 'user');
  const allUserText = userMessages.map((m) => m.text).join(' ');
  const localMetrics = computeLocalMetrics(allUserText);
  const wpm = durationSeconds > 0
    ? Math.round(((localMetrics.totalWords ?? 0) / durationSeconds) * 60)
    : 0;

  const allErrors = userMessages.flatMap((m) => m.analysis?.grammarErrors ?? []);
  const topCorrections = allErrors.slice(0, 5).map((e) => ({
    original: e.original,
    corrected: e.corrected,
  }));

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationStr = `${minutes}m ${seconds}s`;

  const fillerCount = localMetrics.fillerWords ?? 0;
  const grammarCount = allErrors.length;
  const pronCount = userMessages.reduce(
    (acc, m) => acc + (m.analysis?.pronunciationErrors?.length ?? 0),
    0
  );

  // Compute rough scores
  const grammarScore = Math.max(30, 100 - grammarCount * 5);
  const fluencyScore = Math.min(100, Math.max(30, 100 - fillerCount * 3));
  const vocabScore = Math.min(100, Math.round((localMetrics.vocabularyDiversity ?? 0.3) * 120));
  const overallScore = Math.round((grammarScore + fluencyScore + vocabScore) / 3);

  const scores: SpeakingScores = {
    grammar: grammarScore,
    vocabulary: vocabScore,
    pronunciation: Math.max(50, 100 - pronCount * 8),
    fluency: fluencyScore,
    sentenceConstruction: Math.max(40, grammarScore - 5),
    confidence: Math.min(100, 50 + (userMessages.length * 5)),
    fillerWordUsage: fluencyScore,
    overall: overallScore,
  };

  const report: import('../types').SessionReport = {
    sessionId: '',
    duration: durationStr,
    speakingSpeed: wpm,
    fillerWords: fillerCount,
    grammarMistakes: grammarCount,
    pronunciationIssues: pronCount,
    wentWell: [
      userMessages.length > 3 ? 'You kept the conversation going' : 'You made an effort to speak',
      vocabScore > 60 ? 'Good vocabulary usage' : 'You expressed your ideas',
      grammarScore > 70 ? 'Generally good grammar' : 'Your meaning was understandable',
    ],
    improve: [
      grammarCount > 3 ? 'Work on grammar accuracy' : 'Continue refining grammar',
      fillerCount > 5 ? `Reduce filler words (used ${fillerCount} times)` : 'Maintain natural flow',
      wpm < 80 ? 'Try to speak a bit faster for natural flow' : wpm > 160 ? 'Slow down slightly for clarity' : 'Good speaking pace',
    ],
    topCorrections,
    nextChallenge: getNextChallenge(profile.cefrLevel),
    overallScore,
  };

  return { scores, report };
}

function getNextChallenge(level: EnglishLevel): string {
  const challenges: Record<EnglishLevel, string> = {
    A1: 'Practice introducing yourself for 30 seconds.',
    A2: 'Describe your daily routine for 60 seconds.',
    B1: 'Talk about your weekend plans for 90 seconds.',
    B2: 'Give your opinion on a current news topic for 2 minutes.',
    C1: 'Discuss the pros and cons of remote work for 3 minutes.',
    C2: 'Deliver a mini-presentation on a topic of your choice for 5 minutes.',
  };
  return challenges[level];
}

// ─────────────────────────────────────────────
//  Vocabulary Word Generator
// ─────────────────────────────────────────────

export async function generateDailyWords(
  profile: UserProfile,
  existingWords: string[]
): Promise<import('../types').VocabWord[]> {
  const prompt = `Generate 5 English vocabulary words appropriate for a ${profile.cefrLevel} level learner whose native language is ${profile.nativeLanguage}.
Goals: ${profile.goals.join(', ')}.
Avoid these words already learned: ${existingWords.slice(-20).join(', ')}.

Return ONLY valid JSON array:
[
  {
    "word": "word",
    "meaning": "clear definition",
    "phonetic": "/phonetic/",
    "partOfSpeech": "noun/verb/adjective/adverb",
    "exampleSentence": "natural example sentence",
    "synonyms": ["syn1", "syn2"],
    "antonyms": ["ant1"],
    "difficulty": "easy|medium|hard",
    "category": "category name"
  }
]`;

  try {
    const response = await callOpenAI([{ role: 'user', content: prompt }], 0.5, 600);
    const cleaned = response.replace(/```json|```/g, '').trim();
    const words = JSON.parse(cleaned);
    const now = new Date().toISOString();
    return words.map((w: Omit<import('../types').VocabWord, 'id' | 'addedAt' | 'usedInConversation' | 'timesUsed'>) => ({
      ...w,
      id: Math.random().toString(36).slice(2),
      addedAt: now,
      usedInConversation: false,
      timesUsed: 0,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
//  Pronunciation Feedback
// ─────────────────────────────────────────────

export async function getPronunciationFeedback(
  word: string,
  nativeLanguage: string
): Promise<{ phonetic: string; tips: string[]; commonMistakes: string; practiceWords: string[] }> {
  const prompt = `Give pronunciation guidance for the English word "${word}" for a ${nativeLanguage} speaker.
Return ONLY valid JSON:
{
  "phonetic": "/IPA notation/",
  "tips": ["tip 1", "tip 2"],
  "commonMistakes": "what ${nativeLanguage} speakers often say wrong",
  "practiceWords": ["similar word 1", "similar word 2", "similar word 3"]
}`;

  try {
    const response = await callOpenAI([{ role: 'user', content: prompt }], 0.3, 300);
    const cleaned = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      phonetic: `/${word}/`,
      tips: [`Focus on each syllable of "${word}"`, 'Practice slowly, then speed up'],
      commonMistakes: 'Pay attention to stress and vowel sounds',
      practiceWords: [],
    };
  }
}
