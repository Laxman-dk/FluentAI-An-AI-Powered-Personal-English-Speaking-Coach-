import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, currentView, setView } = useAppStore();
  const showFAB = currentView !== 'tutor';

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <motion.main
        animate={{ marginLeft: isSidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto relative"
      >
        <div className="min-h-full">
          {children}
        </div>

        {/* ── Floating AI Tutor Button ── */}
        <AnimatePresence>
          {showFAB && (
            <motion.button
              key="tutor-fab"
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('tutor')}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-violet-600/40 transition-all"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-2xl bg-violet-500 animate-ping opacity-20 pointer-events-none" />

              <div className="relative w-7 h-7 bg-white/15 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                🎓
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">AI Tutor</div>
                <div className="text-[10px] text-white/70 leading-tight">Talk & Learn</div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
