import type {
  ProficiencyLabel,
  EnglishLevel,
  SpeakingGoal,
  NativeLanguage,
  RoleplayScenario,
  SpeakingGame,
  ConversationTopic,
  DailyChallenge,
} from '../types';

// ─────────────────────────────────────────────
//  Level Mappings
// ─────────────────────────────────────────────

export const CEFR_TO_PROFICIENCY: Record<EnglishLevel, ProficiencyLabel> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
  C2: 'Advanced',
};

export const PROFICIENCY_TO_CEFR: Record<ProficiencyLabel, EnglishLevel> = {
  Beginner: 'A1',
  Elementary: 'A2',
  Intermediate: 'B1',
  'Upper Intermediate': 'B2',
  Advanced: 'C1',
};

export const PROFICIENCY_LEVELS: ProficiencyLabel[] = [
  'Beginner',
  'Elementary',
  'Intermediate',
  'Upper Intermediate',
  'Advanced',
];

export const ENGLISH_LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// ─────────────────────────────────────────────
//  Goals
// ─────────────────────────────────────────────

export const SPEAKING_GOALS: { value: SpeakingGoal; label: string; icon: string }[] = [
  { value: 'daily-conversation', label: 'Daily Conversation', icon: '💬' },
  { value: 'college-communication', label: 'College Communication', icon: '🎓' },
  { value: 'job-interviews', label: 'Job Interviews', icon: '💼' },
  { value: 'group-discussions', label: 'Group Discussions', icon: '👥' },
  { value: 'presentations', label: 'Presentations', icon: '📊' },
  { value: 'public-speaking', label: 'Public Speaking', icon: '🎤' },
  { value: 'workplace-english', label: 'Workplace English', icon: '🏢' },
  { value: 'travel-english', label: 'Travel English', icon: '✈️' },
  { value: 'general-fluency', label: 'General Fluency', icon: '🌊' },
  { value: 'pronunciation', label: 'Pronunciation', icon: '🔊' },
  { value: 'vocabulary', label: 'Vocabulary Building', icon: '📚' },
  { value: 'grammar', label: 'Grammar Improvement', icon: '✏️' },
];

export const NATIVE_LANGUAGES: NativeLanguage[] = [
  'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu',
  'Spanish', 'French', 'German', 'Mandarin', 'Japanese',
  'Arabic', 'Portuguese', 'Russian', 'Other',
];

export const CONVERSATION_TOPICS: { value: ConversationTopic; label: string; icon: string }[] = [
  { value: 'daily-life', label: 'Daily Life', icon: '☀️' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'food', label: 'Food & Cooking', icon: '🍕' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'movies', label: 'Movies & Music', icon: '🎬' },
  { value: 'hobbies', label: 'Hobbies', icon: '🎨' },
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'workplace', label: 'Workplace', icon: '🏢' },
];

// ─────────────────────────────────────────────
//  Filler Words
// ─────────────────────────────────────────────

export const FILLER_WORDS = [
  'um', 'uh', 'like', 'actually', 'basically', 'you know',
  'so', 'right', 'literally', 'honestly', 'obviously',
  'i mean', 'kind of', 'sort of', 'you see',
];

// ─────────────────────────────────────────────
//  Assessment Questions
// ─────────────────────────────────────────────

export const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    prompt: 'Tell me about yourself — your name, where you\'re from, and what you do.',
    targetDuration: 60,
    hints: ['Name', 'Location', 'Occupation/Studies'],
  },
  {
    id: 'q2',
    prompt: 'What did you do yesterday? Tell me about your day from morning to evening.',
    targetDuration: 60,
    hints: ['Morning routine', 'Main activities', 'Evening'],
  },
  {
    id: 'q3',
    prompt: 'What are your hobbies and interests? Why do you enjoy them?',
    targetDuration: 45,
    hints: ['Hobbies', 'Why you enjoy them', 'How often'],
  },
  {
    id: 'q4',
    prompt: 'What are your career goals? Where do you see yourself in five years?',
    targetDuration: 60,
    hints: ['Short-term goals', 'Long-term goals', 'Plan to achieve them'],
  },
  {
    id: 'q5',
    prompt: 'Tell me about a recent challenge you faced and how you dealt with it.',
    targetDuration: 60,
    hints: ['The situation', 'What you did', 'Outcome'],
  },
];

// ─────────────────────────────────────────────
//  Roleplay Scenarios
// ─────────────────────────────────────────────

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'rs1',
    title: 'Ordering Food',
    description: 'Practice ordering at a restaurant',
    aiRole: 'Waiter at a restaurant',
    userRole: 'Customer',
    setting: 'A casual restaurant',
    difficulty: 'beginner',
    category: 'Daily Life',
    openingLine: 'Good evening! Welcome to The Garden Bistro. My name is Alex, and I\'ll be your server tonight. Can I start you off with something to drink?',
    icon: '🍽️',
  },
  {
    id: 'rs2',
    title: 'Job Interview',
    description: 'Practice a job interview at a tech company',
    aiRole: 'Hiring Manager at a tech company',
    userRole: 'Job Applicant',
    setting: 'A formal office interview',
    difficulty: 'advanced',
    category: 'Professional',
    openingLine: 'Good morning! Thank you for coming in today. I\'m Sarah, the hiring manager. Please have a seat. Before we begin, can you tell me a little about yourself and what drew you to apply for this position?',
    icon: '💼',
  },
  {
    id: 'rs3',
    title: 'Meeting a New Colleague',
    description: 'Practice introducing yourself at a new workplace',
    aiRole: 'Friendly colleague at your new workplace',
    userRole: 'New Employee',
    setting: 'Office kitchen / break room',
    difficulty: 'beginner',
    category: 'Workplace',
    openingLine: 'Oh hi! You must be the new person joining the marketing team! I\'m Priya. Welcome to the company! How\'s your first day going so far?',
    icon: '🤝',
  },
  {
    id: 'rs4',
    title: 'Talking to a Professor',
    description: 'Ask your professor about an assignment',
    aiRole: 'University professor',
    userRole: 'Student',
    setting: 'Professor\'s office during office hours',
    difficulty: 'intermediate',
    category: 'Education',
    openingLine: 'Come in! Oh, you\'re from the Thursday morning class, right? Have a seat. What can I help you with today?',
    icon: '🎓',
  },
  {
    id: 'rs5',
    title: 'Customer Support Call',
    description: 'Practice calling customer support about a product issue',
    aiRole: 'Customer support representative',
    userRole: 'Customer with a problem',
    setting: 'Phone call to a company',
    difficulty: 'intermediate',
    category: 'Daily Life',
    openingLine: 'Thank you for calling TechSupport. My name is James, and I\'m here to help. Can I please have your account number or email address to get started?',
    icon: '📞',
  },
  {
    id: 'rs6',
    title: 'Airport Conversation',
    description: 'Navigate an airport — check-in, security, boarding',
    aiRole: 'Airport check-in staff',
    userRole: 'Traveler',
    setting: 'International airport check-in counter',
    difficulty: 'intermediate',
    category: 'Travel',
    openingLine: 'Good morning! Welcome to Sunrise Airlines. May I see your passport and booking reference, please?',
    icon: '✈️',
  },
  {
    id: 'rs7',
    title: 'Team Meeting',
    description: 'Participate in a workplace team meeting',
    aiRole: 'Team lead running a project update meeting',
    userRole: 'Team member giving a status update',
    setting: 'Conference room',
    difficulty: 'advanced',
    category: 'Workplace',
    openingLine: 'Alright everyone, let\'s get started. We\'re here to go over last week\'s project progress. [Your name], can you kick us off with an update on the feature development?',
    icon: '📋',
  },
  {
    id: 'rs8',
    title: 'Asking for Directions',
    description: 'Ask a stranger for directions in a new city',
    aiRole: 'Local resident',
    userRole: 'Tourist',
    setting: 'Street in an unfamiliar city',
    difficulty: 'beginner',
    category: 'Travel',
    openingLine: 'Oh, you look a bit lost! Can I help you find something?',
    icon: '🗺️',
  },
];

// ─────────────────────────────────────────────
//  Speaking Games
// ─────────────────────────────────────────────

export const SPEAKING_GAMES: SpeakingGame[] = [
  {
    id: 'g1',
    type: 'word-challenge',
    title: 'Word Challenge',
    description: 'Use a given word naturally in a sentence',
    instructions: 'I\'ll give you a new vocabulary word. Use it in a meaningful sentence to show you understand its meaning.',
    icon: '📝',
    difficulty: 'easy',
  },
  {
    id: 'g2',
    type: 'describe-it',
    title: 'Describe It',
    description: 'Describe an object without saying its name',
    instructions: 'I\'ll give you a word. Describe the object or concept to me WITHOUT saying the word itself. I\'ll guess what it is!',
    icon: '🎯',
    difficulty: 'medium',
  },
  {
    id: 'g3',
    type: '30-second',
    title: '30-Second Sprint',
    description: 'Speak continuously for 30 seconds on a topic',
    instructions: 'I\'ll give you a topic. Speak about it continuously for 30 seconds without stopping or going silent for more than 3 seconds.',
    icon: '⏱️',
    difficulty: 'medium',
  },
  {
    id: 'g4',
    type: 'story-builder',
    title: 'Story Builder',
    description: 'Build a story using 3 random words',
    instructions: 'I\'ll give you 3 random words. Create a short story (at least 5 sentences) that uses all three words naturally.',
    icon: '📖',
    difficulty: 'hard',
  },
  {
    id: 'g5',
    type: 'rapid-questions',
    title: 'Rapid Fire Questions',
    description: 'Answer quick questions without hesitation',
    instructions: 'I\'ll ask you 5 questions rapidly. Answer each one within 10 seconds. Focus on speaking naturally, not perfection!',
    icon: '⚡',
    difficulty: 'hard',
  },
  {
    id: 'g6',
    type: 'pronunciation-challenge',
    title: 'Pronunciation Challenge',
    description: 'Practice tricky English sounds and tongue twisters',
    instructions: 'I\'ll give you words and phrases with difficult sounds. Repeat them and I\'ll give feedback on your pronunciation.',
    icon: '🔊',
    difficulty: 'medium',
  },
];

// ─────────────────────────────────────────────
//  Sample Daily Challenges
// ─────────────────────────────────────────────

export const CHALLENGE_PROMPTS: Omit<DailyChallenge, 'id' | 'date' | 'completed' | 'score' | 'completedAt'>[] = [
  {
    type: 'speak-about',
    title: 'Introduce Yourself',
    prompt: 'Speak for 60 seconds about yourself — your background, interests, and goals.',
    targetDuration: 60,
  },
  {
    type: 'random-question',
    title: 'Travel Dreams',
    prompt: 'If you could travel anywhere in the world, where would you go and why? Speak for 90 seconds.',
    targetDuration: 90,
  },
  {
    type: 'opinion',
    title: 'Technology & Society',
    prompt: 'Is social media beneficial or harmful for students? Share your opinion with reasons and examples.',
    targetDuration: 120,
  },
  {
    type: 'description',
    title: 'Describe Your Hometown',
    prompt: 'Describe your hometown — its location, culture, food, and what makes it special.',
    targetDuration: 90,
  },
  {
    type: 'story',
    title: 'Unexpected Moment',
    prompt: 'Tell me a story about something unexpected or funny that happened to you recently.',
    targetDuration: 120,
  },
  {
    type: 'speak-about',
    title: 'Favorite Technology',
    prompt: 'Speak for 2 minutes about your favorite technology — what it is, how you use it, and why you like it.',
    targetDuration: 120,
  },
  {
    type: 'opinion',
    title: 'AI & Jobs',
    prompt: 'Do you think artificial intelligence is creating more jobs or taking them away? Explain your view.',
    targetDuration: 120,
  },
];

// ─────────────────────────────────────────────
//  Vocabulary Words (Seed Data)
// ─────────────────────────────────────────────

export const SEED_VOCABULARY = [
  {
    word: 'Eloquent',
    meaning: 'Fluent and persuasive in speaking or writing',
    phonetic: '/ˈɛləkwənt/',
    partOfSpeech: 'adjective',
    exampleSentence: 'She gave an eloquent speech that moved the entire audience.',
    synonyms: ['articulate', 'fluent', 'expressive'],
    antonyms: ['inarticulate', 'tongue-tied'],
    difficulty: 'hard' as const,
    category: 'Communication',
  },
  {
    word: 'Elaborate',
    meaning: 'To explain something in greater detail',
    phonetic: '/ɪˈlæbəreɪt/',
    partOfSpeech: 'verb / adjective',
    exampleSentence: 'Could you elaborate on your plan for the project?',
    synonyms: ['explain', 'expand', 'detail'],
    antonyms: ['simplify', 'summarize'],
    difficulty: 'medium' as const,
    category: 'Communication',
  },
  {
    word: 'Substantial',
    meaning: 'Of considerable importance, size, or worth',
    phonetic: '/səbˈstænʃ(ə)l/',
    partOfSpeech: 'adjective',
    exampleSentence: 'There has been a substantial improvement in her pronunciation.',
    synonyms: ['significant', 'considerable', 'notable'],
    antonyms: ['minor', 'insignificant', 'trivial'],
    difficulty: 'medium' as const,
    category: 'General',
  },
  {
    word: 'Perspective',
    meaning: 'A particular attitude toward or way of regarding something',
    phonetic: '/pəˈspɛktɪv/',
    partOfSpeech: 'noun',
    exampleSentence: 'From my perspective, communication skills are more important than technical skills.',
    synonyms: ['viewpoint', 'standpoint', 'outlook'],
    antonyms: [],
    difficulty: 'medium' as const,
    category: 'Discussion',
  },
  {
    word: 'Consequently',
    meaning: 'As a result; therefore',
    phonetic: '/ˈkɒnsɪkwəntli/',
    partOfSpeech: 'adverb',
    exampleSentence: 'He studied hard; consequently, he passed with distinction.',
    synonyms: ['therefore', 'as a result', 'hence'],
    antonyms: [],
    difficulty: 'easy' as const,
    category: 'Transitions',
  },
];

// ─────────────────────────────────────────────
//  GD Topics
// ─────────────────────────────────────────────

export const GD_TOPICS = [
  'Is artificial intelligence creating more jobs than it is replacing?',
  'Should social media platforms be regulated by governments?',
  'Is online education as effective as traditional classroom learning?',
  'Should the voting age be lowered to 16?',
  'Is technology making us more or less social?',
  'Should work from home become the permanent norm?',
  'Is climate change the biggest challenge of our generation?',
  'Should college education be free for everyone?',
  'Does success require higher education?',
  'Is social media responsible for the rise of mental health issues?',
];

// ─────────────────────────────────────────────
//  Interview Questions by Category
// ─────────────────────────────────────────────

export const INTERVIEW_QUESTIONS = {
  general: [
    'Tell me about yourself.',
    'What are your greatest strengths?',
    'What is your biggest weakness?',
    'Why should we hire you?',
    'Where do you see yourself in five years?',
    'Why are you interested in this role?',
    'Describe a challenge you faced and how you overcame it.',
    'What are your career goals?',
  ],
  behavioral: [
    'Tell me about a time you worked in a team.',
    'Describe a situation where you had to meet a tight deadline.',
    'Give an example of a time you showed leadership.',
    'Tell me about a mistake you made and what you learned from it.',
    'Describe a time you had to handle a difficult person.',
  ],
  technical: [
    'What technical skills do you have that are relevant to this role?',
    'Describe a project you are most proud of.',
    'How do you stay updated with new developments in your field?',
    'What tools and technologies are you most comfortable with?',
  ],
};

// ─────────────────────────────────────────────
//  Useful Phrases for GD / Presentations
// ─────────────────────────────────────────────

export const USEFUL_PHRASES = {
  opening: [
    'I would like to begin by saying...',
    'First and foremost...',
    'To start with...',
    'The topic I want to address is...',
  ],
  adding: [
    'I would also like to add...',
    'Furthermore...',
    'In addition to that...',
    'Another important point is...',
  ],
  disagreeing: [
    'I understand your point, but I have a different perspective...',
    'While that may be true, I believe...',
    'I respectfully disagree because...',
    'That\'s an interesting view, however...',
  ],
  concluding: [
    'To conclude...',
    'In summary...',
    'To wrap up...',
    'My final point is...',
  ],
  fillerAlternatives: [
    { instead: 'um / uh', use: 'a brief pause (silence is better)' },
    { instead: 'like', use: 'such as / for example' },
    { instead: 'actually', use: 'in fact / to be honest' },
    { instead: 'basically', use: 'essentially / in simple terms' },
    { instead: 'you know', use: 'as you may be aware / if you think about it' },
  ],
};

// ─────────────────────────────────────────────
//  Score Feedback
// ─────────────────────────────────────────────

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-500' };
  if (score >= 75) return { label: 'Good', color: 'text-blue-500' };
  if (score >= 60) return { label: 'Fair', color: 'text-yellow-500' };
  if (score >= 40) return { label: 'Needs Work', color: 'text-orange-500' };
  return { label: 'Developing', color: 'text-red-500' };
}

export function getCEFRDescription(level: EnglishLevel): string {
  const descriptions: Record<EnglishLevel, string> = {
    A1: 'Beginner — Can understand and use basic phrases.',
    A2: 'Elementary — Can communicate in simple tasks.',
    B1: 'Intermediate — Can handle most travel situations and describe experiences.',
    B2: 'Upper Intermediate — Can interact with fluency and spontaneity.',
    C1: 'Advanced — Can express ideas fluently and spontaneously.',
    C2: 'Mastery — Can understand virtually everything heard or read.',
  };
  return descriptions[level];
}
