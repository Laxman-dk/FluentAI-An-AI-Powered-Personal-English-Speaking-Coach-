import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Users, Briefcase, Monitor, Theater } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ConversationView from '../conversation/ConversationView';
import { useAppStore } from '../../store/useAppStore';
import { ROLEPLAY_SCENARIOS, GD_TOPICS, INTERVIEW_QUESTIONS } from '../../constants';
import type { PracticeMode, RoleplayScenario } from '../../types';

type Tab = 'interview' | 'group-discussion' | 'roleplay' | 'presentation';

export default function PracticeModes() {
  const { profile } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('interview');
  const [activeSession, setActiveSession] = useState<{
    mode: PracticeMode;
    topic: string;
    opening?: string;
  } | null>(null);

  if (activeSession) {
    return (
      <div className="h-screen flex flex-col">
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center gap-3">
          <button
            onClick={() => setActiveSession(null)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modes
          </button>
          <span className="text-gray-600">•</span>
          <span className="text-gray-300 text-sm capitalize font-medium">
            {activeSession.mode.replace(/-/g, ' ')}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationView
            mode={activeSession.mode}
            topic={activeSession.topic}
            openingMessage={activeSession.opening}
          />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'interview', label: 'Job Interview', icon: Briefcase },
    { id: 'group-discussion', label: 'Group Discussion', icon: Users },
    { id: 'roleplay', label: 'Roleplay', icon: Theater },
    { id: 'presentation', label: 'Presentation', icon: Monitor },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Practice Modes</h1>
        <p className="text-gray-400 text-sm mt-1">Choose your practice scenario and start speaking with your AI coach.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Interview */}
      {activeTab === 'interview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card variant="elevated" padding="lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">💼</div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">Job Interview Practice</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Practice with an AI interviewer. Get feedback on your communication, grammar, vocabulary, and confidence.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="blue">Communication score</Badge>
                  <Badge variant="purple">Grammar feedback</Badge>
                  <Badge variant="teal">Confidence tips</Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'General Interview', desc: 'Common HR and behavioral questions', questions: INTERVIEW_QUESTIONS.general, icon: '🤝' },
              { type: 'Behavioral Interview', desc: 'Situation-based questions (STAR method)', questions: INTERVIEW_QUESTIONS.behavioral, icon: '🧠' },
              { type: 'Technical Interview', desc: 'Field-specific technical questions', questions: INTERVIEW_QUESTIONS.technical, icon: '💻' },
            ].map((itype) => (
              <button
                key={itype.type}
                onClick={() =>
                  setActiveSession({
                    mode: 'interview',
                    topic: itype.type,
                    opening: `Good morning! Thank you for coming in today. I'm the hiring manager here. Please have a seat. To get started, ${itype.questions[0]}`,
                  })
                }
                className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-xl p-4 transition-all group"
              >
                <div className="text-2xl mb-2">{itype.icon}</div>
                <div className="text-white font-semibold text-sm">{itype.type}</div>
                <div className="text-gray-400 text-xs mt-1">{itype.desc}</div>
                <div className="flex items-center gap-1 text-blue-400 text-xs mt-3 group-hover:gap-2 transition-all">
                  <Play className="w-3 h-3" />
                  Start interview
                </div>
              </button>
            ))}
          </div>

          <Card variant="glass" padding="md">
            <h4 className="text-white font-semibold text-sm mb-3">💡 Interview Tips</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              {[
                'Use the STAR method: Situation, Task, Action, Result',
                'Speak clearly and at a measured pace',
                'Give specific examples from your experience',
                'Avoid excessive filler words like "um" and "uh"',
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-1.5">
                  <span className="text-blue-400 flex-shrink-0">•</span>
                  {tip}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Group Discussion */}
      {activeTab === 'group-discussion' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card variant="elevated" padding="lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">👥</div>
              <div>
                <h3 className="text-white font-bold text-lg">Group Discussion Practice</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Present your views clearly. Get feedback on structure, vocabulary, opinion expression, and persuasion.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="purple">Opinion expression</Badge>
                  <Badge variant="blue">Argument structure</Badge>
                  <Badge variant="green">Vocabulary</Badge>
                </div>
              </div>
            </div>
          </Card>

          <h4 className="text-gray-300 font-medium text-sm">Choose a topic:</h4>
          <div className="space-y-2">
            {GD_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() =>
                  setActiveSession({
                    mode: 'group-discussion',
                    topic,
                    opening: `Welcome to today's group discussion. The topic is: "${topic}". This is a common topic in competitive exams and professional settings. Please share your opening thoughts — try to structure your response with an introduction, main points, and a conclusion. Take your time and begin whenever you're ready.`,
                  })
                }
                className="w-full text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-xl px-4 py-3 transition-all group flex items-center gap-3"
              >
                <span className="text-purple-400 text-lg font-bold flex-shrink-0">{i + 1}.</span>
                <span className="text-gray-300 text-sm flex-1">{topic}</span>
                <Play className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Roleplay */}
      {activeTab === 'roleplay' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLEPLAY_SCENARIOS.map((scenario) => (
              <RoleplayCard key={scenario.id} scenario={scenario} onStart={(s) => setActiveSession({ mode: 'roleplay', topic: s.title, opening: s.openingLine })} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Presentation */}
      {activeTab === 'presentation' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card variant="elevated" padding="lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-600/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">📊</div>
              <div>
                <h3 className="text-white font-bold text-lg">Presentation Practice</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Deliver a 3–5 minute presentation. Get feedback on introduction, transitions, delivery, vocabulary, and conclusion.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { topic: 'My Career Goals', desc: 'Talk about your professional aspirations', icon: '🎯', duration: '3 min' },
              { topic: 'A Technology I Admire', desc: 'Present on a technology that impresses you', icon: '💻', duration: '4 min' },
              { topic: 'My Hometown', desc: 'Describe where you grew up', icon: '🏙️', duration: '3 min' },
              { topic: 'The Importance of English', desc: 'Why English matters in today\'s world', icon: '🌍', duration: '4 min' },
              { topic: 'A Leader I Admire', desc: 'Talk about someone who inspires you', icon: '⭐', duration: '3 min' },
              { topic: 'Custom Topic', desc: 'Choose your own presentation topic', icon: '✏️', duration: 'Your choice' },
            ].map((pres) => (
              <button
                key={pres.topic}
                onClick={() =>
                  setActiveSession({
                    mode: 'presentation',
                    topic: pres.topic,
                    opening: `Welcome! I'm your audience and speaking coach today. Please present on: "${pres.topic}" for about ${pres.duration}. Structure it with a clear introduction, main points, and a conclusion. I'll give you detailed feedback afterward. Begin whenever you're ready!`,
                  })
                }
                className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-teal-500/50 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{pres.icon}</span>
                  <Badge variant="teal" size="sm">{pres.duration}</Badge>
                </div>
                <div className="text-white font-semibold text-sm mt-2">{pres.topic}</div>
                <div className="text-gray-400 text-xs mt-1">{pres.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function RoleplayCard({
  scenario,
  onStart,
}: {
  scenario: RoleplayScenario;
  onStart: (s: RoleplayScenario) => void;
}) {
  return (
    <button
      onClick={() => onStart(scenario)}
      className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/40 rounded-xl p-4 transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{scenario.title}</span>
            <Badge
              variant={scenario.difficulty === 'beginner' ? 'green' : scenario.difficulty === 'intermediate' ? 'blue' : 'purple'}
              size="sm"
            >
              {scenario.difficulty}
            </Badge>
          </div>
          <p className="text-gray-400 text-xs mt-1">{scenario.description}</p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="text-gray-500">
              <span className="text-gray-400">You:</span> {scenario.userRole}
            </div>
            <div className="text-gray-500">
              <span className="text-gray-400">Coach:</span> {scenario.aiRole}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-blue-400 text-xs mt-3 group-hover:gap-2 transition-all">
        <Play className="w-3 h-3" />
        Start scenario
      </div>
    </button>
  );
}
