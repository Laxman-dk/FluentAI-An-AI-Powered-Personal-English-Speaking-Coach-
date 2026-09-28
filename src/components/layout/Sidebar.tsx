import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mic, BookOpen, BarChart2, Target, Gamepad2,
  Settings, Home, Brain, ChevronLeft, ChevronRight, Flame, Star, GraduationCap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { AppView } from '../../types';

interface NavItem {
  view: AppView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'tutor', label: 'AI Tutor', icon: GraduationCap },
  { view: 'conversation', label: 'Practice', icon: MessageSquare },
  { view: 'pronunciation', label: 'Pronunciation', icon: Mic },
  { view: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { view: 'practice', label: 'Modes', icon: Brain },
  { view: 'challenges', label: 'Challenges', icon: Target },
  { view: 'games', label: 'Games', icon: Gamepad2 },
  { view: 'dashboard', label: 'Progress', icon: BarChart2 },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { currentView, setView, isSidebarOpen, toggleSidebar, profile, progress } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full z-30 bg-gray-900 border-r border-gray-700/50 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-700/50 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            🎙️
          </div>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 overflow-hidden"
            >
              <div className="text-white font-bold text-sm leading-tight">AI English</div>
              <div className="text-gray-400 text-xs">Speaking Coach</div>
            </motion.div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User info */}
        {profile && isSidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-sm font-medium truncate">{profile.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400 text-xs font-semibold">{profile.cefrLevel}</span>
                  <span className="text-gray-500 text-xs">•</span>
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-xs">{Math.round(progress.currentScores.overall || 0)}</span>
                </div>
              </div>
            </div>
            {progress.currentStreak > 0 && (
              <div className="mt-2 flex items-center gap-1.5 bg-orange-500/10 rounded-lg px-2 py-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-400 text-xs font-semibold">{progress.currentStreak} day streak</span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={clsx(
                  'w-full flex items-center gap-3 rounded-xl transition-all duration-150',
                  isSidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                  item.view === 'tutor' && !isActive
                    ? 'text-violet-400 hover:bg-violet-600/15 hover:text-violet-300'
                    : isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                )}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className={clsx('flex-shrink-0', isActive ? 'w-5 h-5 text-blue-400' : 'w-5 h-5')} />
                {isSidebarOpen && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {isSidebarOpen && item.badge && (
                  <span className="ml-auto text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom stats */}
        {isSidebarOpen && (
          <div className="p-4 border-t border-gray-700/50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/60 rounded-xl p-2 text-center">
                <div className="text-white font-bold text-sm">{progress.totalSessions}</div>
                <div className="text-gray-400 text-xs">Sessions</div>
              </div>
              <div className="bg-gray-800/60 rounded-xl p-2 text-center">
                <div className="text-white font-bold text-sm">{progress.totalSpeakingMinutes}m</div>
                <div className="text-gray-400 text-xs">Practice</div>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
