import { useState } from 'react';
import { Key, Volume2, Eye, Bell, Trash2, ChevronDown, CheckCircle, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ApiKeyModal from './ApiKeyModal';
import { useAppStore } from '../../store/useAppStore';
import { getAvailableVoices } from '../../services/speechService';
import { getApiKey, setApiKey } from '../../services/aiService';
import type { CorrectionMode } from '../../types';

export default function Settings() {
  const { profile, updateProfile, clearProfile } = useAppStore();
  const [showApiModal, setShowApiModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const voices = getAvailableVoices();
  const hasKey = !!getApiKey();

  if (!profile) return null;

  const settings = profile.settings;

  function updateSettings(partial: Partial<typeof settings>) {
    updateProfile({ settings: { ...settings, ...partial } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Customize your coaching experience.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>

      {/* API Key */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-semibold">AI Configuration</h3>
        </div>
        <div className="flex items-center justify-between bg-gray-700/40 rounded-xl p-4">
          <div>
            <div className="text-white text-sm font-medium">OpenAI API Key</div>
            <div className="text-gray-400 text-xs mt-0.5">
              {hasKey ? 'Key configured ✓' : 'Not configured — AI features disabled'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasKey && <Badge variant="green" size="sm">Active</Badge>}
            <Button size="sm" variant="outline" onClick={() => setShowApiModal(true)}>
              {hasKey ? 'Update' : 'Set Key'}
            </Button>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Uses GPT-4o-mini. Your key is stored locally and never shared with any server other than OpenAI.
        </p>
      </Card>

      {/* Correction Mode */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-semibold">Correction Mode</h3>
        </div>
        <div className="space-y-2">
          {([
            { value: 'gentle', label: 'Gentle', desc: 'Only critical mistakes that block understanding', icon: '😌' },
            { value: 'normal', label: 'Normal', desc: 'Important grammar, vocabulary and pronunciation issues', icon: '⚖️' },
            { value: 'strict', label: 'Strict', desc: 'Detailed corrections after every response', icon: '🔍' },
          ] as { value: CorrectionMode; label: string; desc: string; icon: string }[]).map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateSettings({ correctionMode: mode.value })}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3',
                settings.correctionMode === mode.value
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-gray-600 bg-gray-800/40 hover:border-gray-500'
              )}
            >
              <span className="text-xl flex-shrink-0">{mode.icon}</span>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{mode.label}</div>
                <div className="text-gray-400 text-xs">{mode.desc}</div>
              </div>
              {settings.correctionMode === mode.value && (
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Voice settings */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-teal-400" />
          <h3 className="text-white font-semibold">Voice & Speech</h3>
        </div>
        <div className="space-y-4">
          {/* Voice on/off */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">Coach voice</div>
              <div className="text-gray-400 text-xs">Hear the coach speak responses aloud</div>
            </div>
            <button
              onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                settings.voiceEnabled ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.voiceEnabled ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Speaking speed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-medium">Speaking speed</div>
              <span className="text-gray-400 text-xs">{settings.voiceSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.voiceSpeed}
              onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Voice selection */}
          {voices.length > 0 && (
            <div>
              <div className="text-white text-sm font-medium mb-2">Coach voice</div>
              <select
                value={settings.selectedVoice}
                onChange={(e) => updateSettings({ selectedVoice: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Auto (system default)</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Live transcript */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">Live transcript</div>
              <div className="text-gray-400 text-xs">Show real-time speech text while speaking</div>
            </div>
            <button
              onClick={() => updateSettings({ showLiveTranscript: !settings.showLiveTranscript })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                settings.showLiveTranscript ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.showLiveTranscript ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Phonetics */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">Show phonetics</div>
              <div className="text-gray-400 text-xs">Display IPA pronunciation for vocabulary words</div>
            </div>
            <button
              onClick={() => updateSettings({ showPhonetics: !settings.showPhonetics })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                settings.showPhonetics ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.showPhonetics ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>
      </Card>

      {/* Learning preferences */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold">Learning Preferences</h3>
        </div>
        <div className="space-y-4">
          {/* Native language explanations */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">Native language hints</div>
              <div className="text-gray-400 text-xs">Occasional explanations in {profile.nativeLanguage}</div>
            </div>
            <button
              onClick={() => updateSettings({ nativeLanguageExplanations: !settings.nativeLanguageExplanations })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                settings.nativeLanguageExplanations ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.nativeLanguageExplanations ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Daily reminder */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">Notifications</div>
              <div className="text-gray-400 text-xs">Daily practice reminders</div>
            </div>
            <button
              onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>
      </Card>

      {/* Profile info */}
      <Card variant="elevated" padding="md">
        <h3 className="text-white font-semibold mb-4">Your Profile</h3>
        <div className="space-y-3">
          {[
            { label: 'Name', value: profile.name },
            { label: 'Native language', value: profile.nativeLanguage },
            { label: 'Current level', value: `${profile.cefrLevel} — ${profile.currentLevel}` },
            { label: 'Daily goal', value: `${profile.dailyPracticeMinutes} minutes` },
            { label: 'Member since', value: new Date(profile.createdAt).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Privacy */}
      <Card variant="default" padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="text-white font-semibold text-sm">Privacy & Data</h3>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          All data is stored locally in your browser. Nothing is sent to our servers. Your OpenAI API key goes directly to OpenAI.
        </p>
        {!showDeleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)} icon={<Trash2 className="w-3.5 h-3.5" />}>
            Delete All Data & Reset
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-red-400 text-sm">⚠️ This will permanently delete all your progress, history, and settings.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={clearProfile}>Yes, delete everything</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      <ApiKeyModal open={showApiModal} onClose={() => setShowApiModal(false)} />
    </div>
  );
}
