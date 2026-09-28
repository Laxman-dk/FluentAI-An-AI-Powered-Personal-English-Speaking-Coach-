import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, X, RotateCcw, Heart, BookOpen, Sparkles, MessageCircleHeart, Loader2, Mic, MicOff, Send } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "react-hot-toast";
import { speechService, speak, stopSpeaking } from "../../services/speechService";
import { getApiKey, hasApiKey } from "../../services/aiService";
import { useAppStore } from "../../store/useAppStore";
import ApiKeyModal from "../settings/ApiKeyModal";
import type { UserProfile } from "../../types";

type Emotion = "idle"|"happy"|"thinking"|"speaking"|"excited"|"caring"|"celebrating";
type ChatMode = "tutor"|"personal"|"teach"|"quiz";

interface Message { id:string; role:"user"|"priya"; text:string; time:Date; emotion?:Emotion; cards?:Card[]; isStreaming?:boolean; }
interface Card { type:"correction"|"grammar"|"vocab"|"tip"; icon:string; title:string; body:string; example?:string; }

async function streamChat(messages:{role:"system"|"user"|"assistant";content:string}[], onChunk:(t:string)=>void, onDone:(f:string)=>void, signal:AbortSignal) {
  const key = getApiKey();
  if (!key) throw new Error("NO_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
    body:JSON.stringify({model:"gpt-4o-mini",stream:true,temperature:0.85,max_tokens:450,messages}), signal,
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message??`Error ${res.status}`); }
  const reader=res.body!.getReader(); const dec=new TextDecoder(); let full="";
  while(true) {
    const {done,value}=await reader.read(); if(done) break;
    for(const line of dec.decode(value).split("\n")) {
      if(!line.startsWith("data: ")) continue;
      const data=line.slice(6); if(data==="[DONE]"){onDone(full);return;}
      try{const chunk=JSON.parse(data)?.choices?.[0]?.delta?.content??"";if(chunk){full+=chunk;onChunk(chunk);}}catch{/*skip*/}
    }
  }
  onDone(full);
}

function extractCards(text:string):Card[] {
  const cards:Card[]=[];
  const m=text.match(/["']([^"']{3,40})["']\s*[->]+\s*["']([^"']{3,40})["']/);
  if(m) cards.push({type:"correction",icon:"✏️",title:"Correction",body:`"${m[1]}" → "${m[2]}"`,example:m[2]});
  if(/tense|article|preposition|grammar/i.test(text)){const r=text.match(/(?:use|remember|rule)[:\s]+([^.\n]{15,80})/i);if(r)cards.push({type:"grammar",icon:"📐",title:"Grammar",body:r[1].trim()});}
  if(/instead of|better word|try saying/i.test(text)){const r=text.match(/(instead of|better word|try saying)[:\s]+([^.\n]{5,50})/i);if(r)cards.push({type:"vocab",icon:"📚",title:"Better Word",body:r[0]});}
  return cards.slice(0,2);
}

function PriyaAvatar({emotion,size=120}:{emotion:Emotion;size?:number}) {
  const eyeAnim=emotion==="thinking"?{scaleY:[1,0.1,1],transition:{repeat:Infinity,duration:2.5,repeatDelay:1}}:emotion==="happy"||emotion==="excited"||emotion==="celebrating"?{scaleY:0.6}:{scaleY:1};
  const mp=emotion==="happy"||emotion==="excited"||emotion==="celebrating"?"M 38 62 Q 50 74 62 62":emotion==="speaking"||emotion==="caring"?"M 40 63 Q 50 70 60 63":"M 40 63 Q 50 68 60 63";
  const co=(emotion==="happy"||emotion==="excited"||emotion==="caring"||emotion==="celebrating")?0.55:0;
  const gc=emotion==="speaking"?"#a78bfa":emotion==="thinking"?"#60a5fa":emotion==="celebrating"?"#f59e0b":"#e879f9";
  const ga=(emotion==="speaking"||emotion==="thinking")?{opacity:[0.4,0.9,0.4],scale:[1,1.06,1],transition:{repeat:Infinity,duration:1.4}}:{opacity:0.3};
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <motion.div animate={ga} className="absolute inset-0 rounded-full" style={{background:`radial-gradient(circle, ${gc}40 0%, transparent 70%)`}}/>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="42" rx="32" ry="34" fill="#1a0a2e"/>
        <rect x="43" y="74" width="14" height="14" rx="4" fill="#c97b5a"/>
        <ellipse cx="50" cy="93" rx="30" ry="12" fill="#7c3aed"/>
        <ellipse cx="50" cy="93" rx="26" ry="9" fill="#ec4899"/>
        <path d="M 22 88 Q 50 98 78 88" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.8"/>
        <ellipse cx="50" cy="50" rx="22" ry="24" fill="#c97b5a"/>
        <circle cx="32" cy="55" r="6" fill="#f43f5e" opacity={co}/>
        <circle cx="68" cy="55" r="6" fill="#f43f5e" opacity={co}/>
        <ellipse cx="41" cy="47" rx="5.5" ry="4" fill="white"/>
        <ellipse cx="59" cy="47" rx="5.5" ry="4" fill="white"/>
        <motion.ellipse cx="41" cy="47" rx="3.2" ry={3.5} fill="#2d1b4e" animate={eyeAnim} style={{originX:"41px",originY:"47px"}}/>
        <motion.ellipse cx="59" cy="47" rx="3.2" ry={3.5} fill="#2d1b4e" animate={eyeAnim} style={{originX:"59px",originY:"47px"}}/>
        <circle cx="42.5" cy="45.5" r="1" fill="white" opacity="0.9"/>
        <circle cx="60.5" cy="45.5" r="1" fill="white" opacity="0.9"/>
        <path d="M 36 41 Q 41 39 46 41" stroke="#1a0a2e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M 54 41 Q 59 39 64 41" stroke="#1a0a2e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <circle cx="50" cy="39" r="1.5" fill="#ec4899" opacity="0.9"/>
        <motion.path d={mp} animate={{d:mp}} transition={{duration:0.3}} stroke="#7c2d12" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        {(emotion==="speaking"||emotion==="excited")&&<path d="M 42 63 Q 50 70 58 63 L 56 65 Q 50 71 44 65 Z" fill="white" opacity="0.7"/>}
        <path d="M 28 35 Q 24 50 26 65" stroke="#1a0a2e" strokeWidth="4" fill="none"/>
        <path d="M 72 35 Q 76 50 74 65" stroke="#1a0a2e" strokeWidth="4" fill="none"/>
        <path d="M 30 28 Q 26 20 32 16 Q 40 12 50 13 Q 60 12 68 16 Q 74 20 70 28" fill="#1a0a2e"/>
        <circle cx="27.5" cy="55" r="2" fill="#f59e0b"/>
        <circle cx="72.5" cy="55" r="2" fill="#f59e0b"/>
        <path d="M 38 77 Q 50 82 62 77" stroke="#f59e0b" strokeWidth="1.2" fill="none" opacity="0.9"/>
        {emotion==="thinking"&&<g><circle cx="72" cy="20" r="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" opacity="0.9"/><text x="72" y="24" textAnchor="middle" fontSize="8" fill="#818cf8">…</text></g>}
        {emotion==="celebrating"&&<g opacity="0.9"><text x="15" y="25" fontSize="10">⭐</text><text x="72" y="20" fontSize="8">✨</text></g>}
        {emotion==="caring"&&<text x="70" y="22" fontSize="12" opacity="0.9">💜</text>}
      </svg>
    </div>
  );
}

const EMOTION_LABELS:Record<Emotion,string>={idle:"Ready to help",happy:"Happy 😊",thinking:"Thinking…",speaking:"Speaking…",excited:"Excited! 🎉",caring:"Here for you 💜",celebrating:"Celebrating! 🌟"};

function CardPill({card}:{card:Card}) {
  const bg={correction:"bg-red-500/10 border-red-500/30",grammar:"bg-amber-500/10 border-amber-500/30",vocab:"bg-purple-500/10 border-purple-500/30",tip:"bg-blue-500/10 border-blue-500/30"};
  return(<motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className={clsx("border rounded-xl px-3 py-2 text-xs",bg[card.type])}><div className="font-semibold text-white flex items-center gap-1 mb-0.5">{card.icon} {card.title}</div><p className="text-gray-300">{card.body}</p>{card.example&&<p className="text-emerald-400 italic mt-0.5">"{card.example}"</p>}</motion.div>);
}

function getSystemPrompt(mode:ChatMode,profile:UserProfile|null):string {
  const base=`You are Priya, a warm, caring, emotionally intelligent AI companion and English tutor.
Student: ${profile?.name}, native language: ${profile?.nativeLanguage}, level: ${profile?.cefrLevel}.
PERSONALITY: Warm, caring, like a best friend who is also an expert teacher. Use the student's name sometimes. Show genuine interest. Celebrate wins enthusiastically. Be gently honest about mistakes. Use emojis naturally 😊. Always end with a warm follow-up question.`;
  if(mode==="personal") return base+`\nMODE: Personal Chat — friendly conversation like a close friend. Correct English mistakes very subtly. Be curious about their day, feelings, dreams. Keep responses warm and conversational, 2-3 sentences.`;
  if(mode==="teach") return base+`\nMODE: Teaching — teach clearly with warmth. Format: 📐 Rule → ✅ Example 1 → ✅ Example 2 → ask them to practice. Celebrate when they understand ("You got it! 🎉").`;
  if(mode==="quiz") return base+`\nMODE: Quiz — ask one question at a time in a fun way. React emotionally to answers. Keep score and give warm summary at end.`;
  return base+`\nMODE: Speaking Tutor — correct errors warmly: ✏️ You said "X" → better: "Y" (because reason). Keep responses SHORT. End with one natural question or prompt.`;
}

function detectEmotion(text:string):Emotion {
  const t=text.toLowerCase();
  if(/amazing|perfect|excellent|wonderful|great job|well done|🌟|🎉|you got it|yesss/.test(t)) return "celebrating";
  if(/sorry|frustrated|difficult|hard|don't worry|it's okay|💜|understand/.test(t)) return "caring";
  if(/\?/.test(t)) return "happy";
  return "happy";
}

const MODE_CHIPS:Record<ChatMode,string[]>={
  tutor:["How was my English?","Correct my last sentence","Give me a topic","Make it harder"],
  personal:["How are you, Priya?","I'm feeling stressed 😟","Tell me something nice 😊","I need motivation"],
  teach:["Explain past perfect","Use of will vs going to","Teach me formal words","What is subjunctive?"],
  quiz:["Start grammar quiz","Vocabulary challenge","Give me a sentence to fix","Test my tenses"],
};

const genId=()=>Math.random().toString(36).slice(2,9);

export default function AiTutor() {
  const {profile,setView}=useAppStore();
  const [messages,setMessages]=useState<Message[]>([]);
  const [mode,setMode]=useState<ChatMode>("tutor");
  const [emotion,setEmotion]=useState<Emotion>("idle");
  const [isThinking,setIsThinking]=useState(false);
  const [isTutorSpeaking,setIsTutorSpeaking]=useState(false);
  const [voiceOn,setVoiceOn]=useState(true);
  const [showApiModal,setShowApiModal]=useState(false);
  const [isRecording,setIsRecording]=useState(false);
  const [audioLevel,setAudioLevel]=useState(0);
  const [interim,setInterim]=useState("");
  const [typed,setTyped]=useState("");
  const [recTimer,setRecTimer]=useState(0);

  const bottomRef=useRef<HTMLDivElement>(null);
  const abortRef=useRef<AbortController|null>(null);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const inputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  useEffect(()=>{
    return speechService.subscribe(s=>{
      if(s.interimTranscript!==undefined) setInterim(s.interimTranscript);
      if(s.audioLevel!==undefined) setAudioLevel(s.audioLevel);
      if(s.recordingState==="idle") setIsRecording(false);
    });
  },[]);

  useEffect(()=>{
    const g=getGreeting(mode,profile?.name??"there");
    setMessages([{id:genId(),role:"priya",text:g,time:new Date(),emotion:mode==="personal"?"caring":"happy"}]);
    setEmotion(mode==="personal"?"caring":"happy");
    if(voiceOn){setIsTutorSpeaking(true);speak(g,{rate:0.93,onEnd:()=>{setIsTutorSpeaking(false);setEmotion("idle");}});}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mode]);

  function getGreeting(m:ChatMode,name:string) {
    if(m==="personal") return `Hey ${name}! 💜 I'm Priya — your friend and tutor. I genuinely care about you. How are you feeling today? Tell me everything! 😊`;
    if(m==="teach") return `Hi ${name}! 📚 I love teaching! Ask me anything about English — grammar, vocabulary, pronunciation — and I'll explain it clearly. What shall we learn?`;
    if(m==="quiz") return `Quiz time ${name}! 🧠 Don't worry about mistakes — that's how we learn! Fill in the blank: "Yesterday, I ___ to the market." (go/went/gone)`;
    return `Hi ${name}! 😊 I'm Priya, your personal English coach. Just speak naturally — I'll help you improve in real time. What's been on your mind lately?`;
  }

  async function startMic() {
    if(!hasApiKey()){setShowApiModal(true);return;}
    setInterim(""); setEmotion("idle");
    try {
      await speechService.startRecording();
      setIsRecording(true); setRecTimer(0);
      timerRef.current=setInterval(()=>setRecTimer(t=>t+1),1000);
    } catch(e){toast.error(e instanceof Error?e.message:"Mic error");}
  }

  async function stopMic() {
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}
    setIsRecording(false); setInterim("");
    const text=await speechService.stopRecording();
    if(!text.trim()){toast("No speech detected — try typing");return;}
    await sendToPriya(text.trim());
  }

  async function sendTyped(){
    const text=typed.trim(); if(!text) return;
    setTyped(""); await sendToPriya(text);
  }

  const sendToPriya=useCallback(async(userText:string)=>{
    if(!profile) return;
    stopSpeaking(); setIsTutorSpeaking(false);
    setMessages(prev=>[...prev,{id:genId(),role:"user",text:userText,time:new Date()}]);
    setEmotion("thinking"); setIsThinking(true);
    const history=messages.slice(-10).map(m=>({role:(m.role==="priya"?"assistant":"user") as "user"|"assistant",content:m.text}));
    try {
      if(!hasApiKey()){setShowApiModal(true);setIsThinking(false);setEmotion("idle");return;}
      const pid=genId();
      setMessages(prev=>[...prev,{id:pid,role:"priya",text:"",time:new Date(),isStreaming:true,emotion:"thinking"}]);
      setIsThinking(false);
      abortRef.current=new AbortController(); let full="";
      await streamChat(
        [{role:"system",content:getSystemPrompt(mode,profile)},...history,{role:"user",content:userText}],
        chunk=>{full+=chunk;setEmotion("speaking");setMessages(prev=>prev.map(m=>m.id===pid?{...m,text:full,emotion:"speaking"}:m));},
        complete=>{
          const cards=mode!=="personal"?extractCards(complete):[];
          const em=detectEmotion(complete);
          setMessages(prev=>prev.map(m=>m.id===pid?{...m,text:complete,isStreaming:false,emotion:em,cards}:m));
          setEmotion(em);
          if(voiceOn){setIsTutorSpeaking(true);speak(complete,{rate:mode==="personal"?0.9:0.93,onEnd:()=>{setIsTutorSpeaking(false);setEmotion("idle");}});}
          else setTimeout(()=>setEmotion("idle"),3000);
        },
        abortRef.current.signal
      );
    } catch(e){
      setIsThinking(false);setEmotion("idle");
      const msg=e instanceof Error?e.message:"Error";
      if(msg==="NO_API_KEY"){setShowApiModal(true);return;}
      if(msg.includes("abort")) return;
      setMessages(prev=>[...prev,{id:genId(),role:"priya",text:`Oops! Something went wrong 😅 Check your API key in Settings. (${msg})`,time:new Date(),emotion:"caring"}]);
    }
  },[messages,mode,profile,voiceOn]);

  function clearChat(){
    stopSpeaking();setIsTutorSpeaking(false);
    const g=getGreeting(mode,profile?.name??"there");
    setMessages([{id:genId(),role:"priya",text:g,time:new Date(),emotion:mode==="personal"?"caring":"happy"}]);
    setEmotion(mode==="personal"?"caring":"happy");
    if(voiceOn) speak(g,{rate:0.93});
  }

  const fmt=(s:number)=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  return(
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      <ApiKeyModal open={showApiModal} onClose={()=>setShowApiModal(false)}/>

      {/* HEADER */}
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 via-purple-950/30 to-gray-900 border-b border-purple-900/40 px-3 py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <PriyaAvatar emotion={isTutorSpeaking?"speaking":isThinking?"thinking":emotion} size={52}/>
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-900"/>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-bold text-sm">Priya</h1>
                <span className="text-[10px] bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-full px-1.5 py-0.5">AI Tutor</span>
              </div>
              <motion.p key={emotion} initial={{opacity:0,y:-3}} animate={{opacity:1,y:0}} className={clsx("text-[10px]",isTutorSpeaking?"text-violet-400":isThinking?"text-blue-400":"text-gray-400")}>
                {isTutorSpeaking?"🗣 Speaking…":isThinking?"💭 Thinking…":EMOTION_LABELS[emotion]}
              </motion.p>
            </div>
          </div>

          {/* Mode tabs - scrollable on mobile */}
          <div className="flex bg-gray-800/80 rounded-xl p-0.5 gap-0.5 overflow-x-auto flex-shrink min-w-0">
            {(["tutor","personal","teach","quiz"] as ChatMode[]).map(m=>(
              <button key={m} onClick={()=>setMode(m)} className={clsx("px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",mode===m?"bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow":"text-gray-400 hover:text-white")}>
                {m==="tutor"?"🎓":m==="personal"?"💜":m==="teach"?"📚":"🧠"} {m.charAt(0).toUpperCase()+m.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={()=>{if(voiceOn){stopSpeaking();setIsTutorSpeaking(false);}setVoiceOn(v=>!v);}} className={clsx("p-1.5 rounded-xl transition-all",voiceOn?"text-pink-400 bg-pink-500/15":"text-gray-500 bg-gray-800")}>
              {voiceOn?<Volume2 className="w-4 h-4"/>:<VolumeX className="w-4 h-4"/>}
            </button>
            <button onClick={clearChat} className="p-1.5 rounded-xl text-gray-500 hover:text-white bg-gray-800"><RotateCcw className="w-4 h-4"/></button>
            <button onClick={()=>setView("home")} className="p-1.5 rounded-xl text-gray-500 hover:text-red-400 bg-gray-800"><X className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* MODE BANNER */}
      <div className={clsx("flex-shrink-0 text-xs px-4 py-1.5 flex items-center gap-2 border-b",
        mode==="tutor"?"bg-violet-600/10 text-violet-400 border-violet-500/20":
        mode==="personal"?"bg-pink-600/10 text-pink-400 border-pink-500/20":
        mode==="teach"?"bg-amber-600/10 text-amber-400 border-amber-500/20":
        "bg-emerald-600/10 text-emerald-400 border-emerald-500/20")}>
        {mode==="tutor"&&<><Sparkles className="w-3 h-3"/>Real-time speaking coach with live corrections</>}
        {mode==="personal"&&<><Heart className="w-3 h-3"/>Personal chat — talk about anything, I'm here for you</>}
        {mode==="teach"&&<><BookOpen className="w-3 h-3"/>Ask Priya to teach you any English topic</>}
        {mode==="quiz"&&<><MessageCircleHeart className="w-3 h-3"/>Fun quiz with instant emotional feedback</>}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 max-w-4xl w-full mx-auto">
        <AnimatePresence initial={false}>
          {messages.map(msg=>(
            <motion.div key={msg.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.2}}
              className={clsx("flex gap-2",msg.role==="user"?"flex-row-reverse":"flex-row")}>
              {msg.role==="priya"?(
                <div className="flex-shrink-0 mt-1"><PriyaAvatar emotion={msg.isStreaming?"speaking":(msg.emotion??"idle")} size={38}/></div>
              ):(
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  {profile?.name?.charAt(0)?.toUpperCase()??"U"}
                </div>
              )}
              <div className={clsx("flex-1 space-y-1.5 max-w-[80%]",msg.role==="user"?"flex flex-col items-end":"")}>
                <div className={clsx("rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                  msg.role==="priya"?"bg-gradient-to-br from-gray-800 to-gray-800/80 border border-purple-900/40 text-gray-100":"bg-gradient-to-r from-violet-600 to-pink-600 text-white")}>
                  {msg.text?(
                    <p className="whitespace-pre-wrap">{msg.text}{msg.isStreaming&&<span className="inline-block w-0.5 h-4 bg-pink-400 ml-0.5 animate-pulse align-middle"/>}</p>
                  ):(
                    <div className="flex gap-1 items-center h-4">
                      {[0,150,300].map(d=>(<span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>))}
                    </div>
                  )}
                </div>
                {msg.cards&&msg.cards.length>0&&<div className="space-y-1 w-full">{msg.cards.map((c,i)=><CardPill key={i} card={c}/>)}</div>}
                <span className="text-gray-600 text-[10px]">{msg.time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {interim&&(
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex flex-row-reverse gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile?.name?.charAt(0)?.toUpperCase()??"U"}
              </div>
              <div className="bg-violet-600/30 border border-violet-500/30 rounded-2xl px-3 py-2 text-sm text-white/60 italic max-w-[80%]">{interim}…</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef}/>
      </div>

      {/* CHIPS */}
      <div className="flex-shrink-0 px-3 pb-1.5 overflow-x-auto">
        <div className="flex gap-1.5 max-w-4xl mx-auto">
          {MODE_CHIPS[mode].map(chip=>(
            <button key={chip} onClick={()=>sendToPriya(chip)} disabled={isThinking||isRecording}
              className="flex-shrink-0 text-[11px] bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 hover:border-violet-500/40 text-gray-300 hover:text-white rounded-xl px-2.5 py-1.5 transition-all disabled:opacity-40 whitespace-nowrap">
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT BAR */}
      <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950 px-3 pb-4 pt-2">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Status */}
          <div className="w-20 flex-shrink-0 flex items-center justify-center">
            {isRecording?(
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-gray-400">{fmt(recTimer)}</span>
                <div className="flex items-end gap-0.5 h-5">
                  {Array.from({length:8}).map((_,i)=>(
                    <div key={i} className="w-0.5 bg-pink-400 rounded-full transition-all duration-75"
                      style={{height:`${Math.max(2,audioLevel*20*(0.3+Math.abs(Math.sin(Date.now()/110+i))*0.7))}px`}}/>
                  ))}
                </div>
              </div>
            ):isTutorSpeaking?(
              <button onClick={()=>{stopSpeaking();setIsTutorSpeaking(false);setEmotion("idle");}} className="text-[10px] text-pink-400 hover:text-white whitespace-nowrap">⏹ stop</button>
            ):isThinking?(
              <div className="flex items-center gap-1 text-violet-400"><Loader2 className="w-3 h-3 animate-spin"/><span className="text-[10px]">thinking…</span></div>
            ):(
              <span className="text-[10px] text-gray-600 text-center">tap mic</span>
            )}
          </div>

          {/* Mic */}
          <div className="relative flex-shrink-0">
            {isRecording&&<span className="absolute inset-0 rounded-full border-2 border-pink-500 animate-ping opacity-30 pointer-events-none"/>}
            <motion.button whileHover={{scale:1.07}} whileTap={{scale:0.93}}
              onClick={isRecording?stopMic:startMic} disabled={isThinking}
              className={clsx("w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all",
                isThinking?"bg-gray-700 cursor-not-allowed":
                isRecording?"bg-gradient-to-br from-red-600 to-pink-600 shadow-red-600/40":
                "bg-gradient-to-br from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-600/40")}>
              {isThinking?<Loader2 className="w-5 h-5 text-white animate-spin"/>:isRecording?<MicOff className="w-5 h-5 text-white"/>:<Mic className="w-5 h-5 text-white"/>}
            </motion.button>
          </div>

          {/* Text input */}
          <div className="flex-1 flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-violet-500/50 rounded-2xl px-3 py-2 transition-all">
            <input ref={inputRef} value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendTyped()}
              placeholder={mode==="personal"?"Talk to Priya…":"Ask or type…"} disabled={isRecording||isThinking}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none disabled:opacity-50 min-w-0"/>
            <button onClick={sendTyped} disabled={!typed.trim()||isThinking||isRecording} className="text-violet-400 hover:text-white disabled:opacity-30 transition-colors flex-shrink-0">
              <Send className="w-4 h-4"/>
            </button>
          </div>
        </div>
        {!speechService.isSupported&&<p className="text-center text-xs text-amber-400 mt-1.5">⚠️ Use Chrome or Edge for voice</p>}
      </div>
    </div>
  );
}
