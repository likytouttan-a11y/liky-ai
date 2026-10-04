import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (transcript: string) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSpeechResponse, setAiSpeechResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        if (event.results[0].isFinal) {
          handleUserUtterance(currentText);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      startListening();
    }

    return () => {
      stopVoice();
    };
  }, [isOpen]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition', e);
      }
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsAiSpeaking(false);
  };

  const handleUserUtterance = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsAiThinking(true);
    setIsListening(false);

    let fullAnswer = '';

    await api.chatStream(
      {
        messages: [{ role: 'user', content: userInput }],
        model: 'gemini-3.8-flash',
        systemInstruction:
          'You are Liky AI Voice Assistant. Respond concisely in 1 to 3 spoken conversational sentences. Do not use markdown, emojis, or bullet points.',
      },
      {
        onDelta: (text) => {
          fullAnswer += text;
          setAiSpeechResponse(fullAnswer);
        },
        onDone: async () => {
          setIsAiThinking(false);
          await speakAnswer(fullAnswer);
        },
        onError: () => {
          setIsAiThinking(false);
        },
      }
    );
  };

  const speakAnswer = async (text: string) => {
    setIsAiSpeaking(true);

    try {
      const res = await api.generateSpeech(text);
      if (res?.audio) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio}`);
        currentAudioRef.current = audio;
        audio.onended = () => {
          setIsAiSpeaking(false);
          // Auto restart listening for natural dialogue loop
          startListening();
        };
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    // Web speech fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        startListening();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <span className="text-sm font-semibold text-white font-['Syne',sans-serif]">
            Liky Voice Mode
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Central Visualizer & Status */}
      <div className="flex flex-col items-center justify-center space-y-8 max-w-lg mx-auto text-center">
        {/* Animated Radial Waves Orb */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-all duration-300 flex items-center justify-center ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 via-sky-500 to-cyan-400 animate-pulse shadow-2xl shadow-cyan-500/50 scale-105'
                : isListening
                ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-xl shadow-cyan-500/30 scale-100'
                : 'bg-neutral-800'
            }`}
          >
            {isAiSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <MicOff className="w-12 h-12 text-neutral-400" />
            )}
          </div>

          {/* Concentric ripple rings */}
          {(isListening || isAiSpeaking) && (
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Live Subtitles & Captions */}
        <div className="space-y-3 min-h-[120px]">
          <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
            {isAiThinking
              ? 'Liky is reasoning...'
              : isAiSpeaking
              ? 'Liky is speaking...'
              : isListening
              ? 'Listening to you...'
              : 'Tap microphone to speak'}
          </div>

          <p className="text-lg sm:text-xl font-medium text-white max-w-md leading-relaxed">
            {isAiSpeaking
              ? aiSpeechResponse
              : transcript || 'Say "Hello Liky, what are the latest developments in fusion energy?"'}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={isListening ? stopVoice : startListening}
          className={`p-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
            isListening
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-cyan-500 text-white shadow-cyan-500/30'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {transcript && onSendToChat && (
          <button
            onClick={() => {
              onSendToChat(transcript);
              onClose();
            }}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Switch to Text Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};
