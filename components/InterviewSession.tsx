import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Bot } from 'lucide-react';

interface InterviewSessionProps {
  onEndSession: (transcript: {role: 'user'|'model', text: string}[]) => void;
  contextSummary: string;
  jobDescription: string;
  language: string;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ onEndSession, contextSummary, jobDescription, language }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0); 
  const [transcripts, setTranscripts] = useState<{role: 'user'|'model', text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const b64 = btoa(binary);
    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const decodeAudioData = async (
    base64String: string,
    ctx: AudioContext,
    sampleRate: number = 24000
  ) => {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const connectToLiveAPI = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const languageMap: Record<string, string> = {
        'en': 'English',
        'fr': 'French',
        'zh': 'Mandarin Chinese'
      };
      const targetLanguage = languageMap[language] || language;

      const systemInstruction = `
        You are an experienced, dynamic, and unpredictable Interviewer.
        Conduct an interview for the following candidate based on their CV analysis and the Job Description.
        
        LANGUAGE REQUIREMENT: Conduct the entire interview in ${targetLanguage}.
        
        CANDIDATE CONTEXT: ${contextSummary}
        JOB DESCRIPTION: ${jobDescription}
        
        INSTRUCTIONS:
        1. Start by introducing yourself briefly in ${targetLanguage}.
        2. Do NOT follow a rigid list of questions. Be spontaneous.
        3. Mix your questions randomly between:
           - Behavioral (e.g., "Tell me about a time...")
           - Technical/Skill-based (specific to the CV)
           - Situational (e.g., "What would you do if...")
        4. If the candidate gives a vague answer, drill down and ask follow-up questions.
        5. Keep your spoken responses concise and natural.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            processor.onaudioprocess = (e) => {
              if (isMuted) return; 
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setVolume(Math.sqrt(sum/inputData.length));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Model Transcription (Chunks)
            const modelText = msg.serverContent?.outputTranscription?.text;
            if (modelText) {
               setTranscripts(prev => {
                 const last = prev[prev.length - 1];
                 // If the last message was from the model, append to it
                 if (last && last.role === 'model') {
                   return [...prev.slice(0, -1), { ...last, text: last.text + modelText }];
                 }
                 // Otherwise start a new model message
                 return [...prev, { role: 'model', text: modelText }];
               });
            }

            // Handle User Transcription (Chunks/Deltas)
            const userText = msg.serverContent?.inputTranscription?.text;
            if (userText) {
               setTranscripts(prev => {
                 const last = prev[prev.length - 1];
                 // If the last message was from the user, append to it
                 if (last && last.role === 'user') {
                    return [...prev.slice(0, -1), { ...last, text: last.text + userText }];
                 }
                 // Otherwise start a new user message
                 return [...prev, { role: 'user', text: userText }];
               });
            }

            // Handle Audio Playback
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const buffer = await decodeAudioData(base64Audio, outputCtx);
              const bufferSource = outputCtx.createBufferSource();
              bufferSource.buffer = buffer;
              bufferSource.connect(outputCtx.destination);
              
              const currentTime = outputCtx.currentTime;
              const startTime = Math.max(nextStartTimeRef.current, currentTime);
              bufferSource.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              
              sourcesRef.current.add(bufferSource);
              bufferSource.onended = () => sourcesRef.current.delete(bufferSource);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsConnected(false),
          onerror: (err) => setIsConnected(false)
        }
      });
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start session", error);
      setIsConnected(false);
    }
  }, [contextSummary, jobDescription, isMuted, language]);

  useEffect(() => {
    connectToLiveAPI();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      sourcesRef.current.forEach(s => s.stop());
    };
  }, [connectToLiveAPI]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleEndSession = () => {
    onEndSession(transcripts);
  };

  // Get the latest transcript to display as subtitle
  const latestTranscript = transcripts.length > 0 ? transcripts[transcripts.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-black text-white relative font-sans overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="font-mono text-xs tracking-widest uppercase text-zinc-300">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
          <span className="w-px h-3 bg-white/20"></span>
          <span className="text-xs font-bold text-white uppercase">{language}</span>
        </div>
        <button 
          onClick={handleEndSession}
          className="text-zinc-500 hover:text-white transition-colors bg-black/50 p-2 rounded-full hover:bg-white/10"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
               backgroundSize: '40px 40px' 
             }}
        />

        <div className="relative z-10">
          {/* Main Ring */}
          <div 
             className="absolute inset-0 border border-white rounded-full opacity-30 transition-all duration-75 blur-sm"
             style={{ transform: `scale(${1 + volume * 5})` }}
          />
           <div 
             className="absolute inset-0 border border-white/50 rounded-full opacity-10 transition-all duration-200 delay-75"
             style={{ transform: `scale(${1 + volume * 12})` }}
          />
          
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center relative shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <Bot size={48} className="text-black" />
          </div>
        </div>
        
        <p className="mt-16 text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] text-center opacity-50">
          {isConnected ? "Listening for Audio Input" : "Establishing Secure Line"}
        </p>
      </div>

      {/* Cinematic Subtitles */}
      <div className="absolute bottom-32 left-0 right-0 px-8 flex justify-center z-20 pointer-events-none">
         <div className="max-w-3xl w-full text-center space-y-2">
            {latestTranscript && (
               <div className={`transition-all duration-300 transform translate-y-0 opacity-100`}>
                 <p className={`text-xl md:text-2xl font-medium leading-relaxed drop-shadow-xl ${
                   latestTranscript.role === 'user' 
                     ? 'text-zinc-400 italic font-serif' 
                     : 'text-white'
                 }`}>
                   {latestTranscript.role === 'model' ? "" : ""}
                   "{latestTranscript.text}"
                 </p>
               </div>
            )}
         </div>
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-8 bg-gradient-to-t from-black via-black/90 to-transparent z-30">
        <button 
          onClick={toggleMute}
          className={`p-6 rounded-full border transition-all duration-300 shadow-lg ${isMuted 
            ? 'border-red-500 bg-red-500/10 text-red-500' 
            : 'border-white/20 bg-white/5 text-white hover:bg-white hover:text-black hover:border-white hover:scale-105'}`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        
        <button 
          onClick={handleEndSession}
          className="px-8 py-6 bg-white text-black hover:bg-zinc-200 rounded-full font-bold uppercase tracking-wider text-xs transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default InterviewSession;