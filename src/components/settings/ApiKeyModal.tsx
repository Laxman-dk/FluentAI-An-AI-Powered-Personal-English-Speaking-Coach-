import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, ExternalLink, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { setApiKey, getApiKey } from '../../services/aiService';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState(getApiKey() || '');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!key.trim().startsWith('sk-')) return;
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">OpenAI API Key</h3>
                <p className="text-gray-400 text-sm">Required for AI coaching features</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-300 space-y-1">
              <p>The AI coach uses OpenAI's GPT-4o-mini model.</p>
              <p>Your key is stored locally in your browser and never sent to any server other than OpenAI.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your API key</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <button
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              Get your API key from OpenAI platform
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Button
              className="w-full"
              disabled={!key.trim().startsWith('sk-')}
              onClick={handleSave}
              icon={saved ? <CheckCircle className="w-4 h-4" /> : undefined}
            >
              {saved ? 'Saved!' : 'Save API Key'}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
