import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import Onboarding from './components/onboarding/Onboarding';
import Assessment from './components/onboarding/Assessment';
import AppLayout from './components/layout/AppLayout';
import Home from './components/home/Home';
import ConversationView from './components/conversation/ConversationView';
import PracticeModes from './components/practice/PracticeModes';
import PronunciationCoach from './components/pronunciation/PronunciationCoach';
import VocabularyCoach from './components/vocabulary/VocabularyCoach';
import DailyChallenges from './components/challenges/DailyChallenges';
import SpeakingGames from './components/games/SpeakingGames';
import ProgressDashboard from './components/dashboard/ProgressDashboard';
import Settings from './components/settings/Settings';
import AiTutor from './components/tutor/AiTutor';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { currentView, profile } = useAppStore();

  // Always show onboarding first if no profile
  if (!profile || !profile.onboardingCompleted) {
    return (
      <>
        <Onboarding />
        <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
      </>
    );
  }

  // Assessment after onboarding
  if (!profile.assessmentCompleted || currentView === 'assessment') {
    return (
      <>
        <Assessment />
        <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
      </>
    );
  }

  // Main app
  return (
    <>
      <AppLayout>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <PageWrapper key="home"><Home /></PageWrapper>
          )}
          {currentView === 'conversation' && (
            <PageWrapper key="conversation"><ConversationView /></PageWrapper>
          )}
          {currentView === 'practice' && (
            <PageWrapper key="practice"><PracticeModes /></PageWrapper>
          )}
          {currentView === 'pronunciation' && (
            <PageWrapper key="pronunciation"><PronunciationCoach /></PageWrapper>
          )}
          {currentView === 'vocabulary' && (
            <PageWrapper key="vocabulary"><VocabularyCoach /></PageWrapper>
          )}
          {currentView === 'challenges' && (
            <PageWrapper key="challenges"><DailyChallenges /></PageWrapper>
          )}
          {currentView === 'games' && (
            <PageWrapper key="games"><SpeakingGames /></PageWrapper>
          )}
          {currentView === 'dashboard' && (
            <PageWrapper key="dashboard"><ProgressDashboard /></PageWrapper>
          )}
          {currentView === 'settings' && (
            <PageWrapper key="settings"><Settings /></PageWrapper>
          )}
          {currentView === 'tutor' && (
            <PageWrapper key="tutor"><AiTutor /></PageWrapper>
          )}
        </AnimatePresence>
      </AppLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
        }}
      />
    </>
  );
}
