# 🎙️ FluentAI — AI-Powered Personal English Speaking Coach

A production-quality web app that acts as your **24/7 personal English speaking coach**, powered by OpenAI GPT-4o-mini and Whisper.

![AI Coach](https://img.shields.io/badge/AI-GPT--4o--mini-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Vite](https://img.shields.io/badge/Vite-5-646CFF)

## ✨ Features

- 🎓 **Priya — AI Girl Tutor** with animated emotions (happy, thinking, speaking, celebrating, caring)
- 🎙️ **Real-time voice conversation** — speak and get instant corrections
- 📱 **Mobile-first** — works on Android & iOS with MediaRecorder + Whisper API
- 🔊 **Live pronunciation feedback** with phonetics
- 📚 **4 Tutor Modes** — Tutor / Personal Chat / Teach / Quiz
- 💬 **Practice Modes** — Interview, Group Discussion, Roleplay, Presentation
- 🏆 **Daily Challenges** with streak tracking
- 🎮 **Speaking Games** — Word Challenge, Story Builder, Rapid Fire, etc.
- 📊 **Progress Dashboard** with charts and session reports
- 🌐 **PWA** — installable on phone (Add to Home Screen)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

```bash
git clone https://github.com/Laxman-dk/FluentAI-An-AI-Powered-Personal-English-Speaking-Coach-.git
cd FluentAI-An-AI-Powered-Personal-English-Speaking-Coach-
npm install
npm run dev
```

Open http://localhost:5173 in **Chrome or Edge**.

### Set your API Key
Go to **Settings → Set API Key** and enter your OpenAI key (`sk-...`).

Your key is stored **locally in your browser only** — never sent to any server other than OpenAI.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand (persisted to localStorage) |
| AI | OpenAI GPT-4o-mini (chat) + Whisper (speech-to-text) |
| Speech | MediaRecorder API + Web Speech API fallback |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Netlify |

## 📱 Use on Phone

Connect your phone to the **same WiFi** as your PC, then open:
```
http://<your-pc-ip>:5173
```

Or deploy to Netlify for a public URL.

## 🌐 Deploy to Netlify

```bash
npm run build
# Drag the dist/ folder to https://app.netlify.com/drop
```

## 📄 License

MIT
