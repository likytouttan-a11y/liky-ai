import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  RotateCw, 
  Check, 
  X, 
  Brain, 
  BookOpen, 
  HelpCircle, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { Flashcard, Quiz, QuizQuestion } from '../types';
import { api } from '../services/api';

interface LearningViewProps {
  flashcards: Flashcard[];
  onSaveFlashcards: (cards: Flashcard[]) => void;
  onStartChatWithTopic: (topic: string) => void;
}

export const LearningView: React.FC<LearningViewProps> = ({
  flashcards,
  onSaveFlashcards,
  onStartChatWithTopic,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'socratic'>('flashcards');
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const currentCard = flashcards[currentCardIndex] || flashcards[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleLearned = (id: string) => {
    const updated = flashcards.map((fc) =>
      fc.id === id ? { ...fc, learned: !fc.learned } : fc
    );
    onSaveFlashcards(updated);
  };

  // Generate new flashcards from topic
  const handleGenerateFlashcards = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);

    const prompt = `Generate 4 high-yield, conceptually rigorous study flashcards on the topic: "${topicInput}".
Return ONLY a valid JSON array matching this exact schema:
[
  {
    "front": "Question or core concept prompt",
    "back": "Clear, concise, intuitive explanation or answer"
  }
]`;

    try {
      let accumulated = '';
      await api.chatStream(
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'gemini-3.8-flash',
          systemInstruction: 'You are an elite academic curriculum designer. Output only pure JSON without markdown code fences.',
        },
        {
          onDelta: (text) => {
            accumulated += text;
          },
          onDone: () => {
            try {
              const cleanJson = accumulated.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed)) {
                const newCards: Flashcard[] = parsed.map((item: any, idx: number) => ({
                  id: `fc-${Date.now()}-${idx}`,
                  deckId: topicInput.toLowerCase().replace(/\s+/g, '-'),
                  front: item.front,
                  back: item.back,
                  learned: false,
                }));
                onSaveFlashcards([...newCards, ...flashcards]);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setTopicInput('');
              }
            } catch (e) {
              console.error('Failed to parse generated cards', e);
            }
            setIsGenerating(false);
          },
          onError: () => setIsGenerating(false),
        }
      );
    } catch {
      setIsGenerating(false);
    }
  };

  // Generate Interactive Quiz
  const handleGenerateQuiz = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);

    const prompt = `Generate an interactive 3-question multiple choice quiz on: "${topicInput}".
Return ONLY a valid JSON array matching this schema:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this option is correct."
  }
]`;

    try {
      let accumulated = '';
      await api.chatStream(
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'gemini-3.8-flash',
          systemInstruction: 'You are a rigorous exam tutor. Output only clean valid JSON without markdown tags.',
        },
        {
          onDelta: (text) => {
            accumulated += text;
          },
          onDone: () => {
            try {
              const cleanJson = accumulated.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed)) {
                const newQuiz: Quiz = {
                  id: `quiz-${Date.now()}`,
                  topic: topicInput,
                  questions: parsed,
                };
                setActiveQuiz(newQuiz);
                setTopicInput('');
              }
            } catch (e) {
              console.error('Quiz parsing error', e);
            }
            setIsGenerating(false);
          },
          onError: () => setIsGenerating(false),
        }
      );
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Liky Learning Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
            Active Recall & Conceptual Mastery
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Study any subject with auto-generated flashcards, practice quizzes, and guided Socratic reasoning.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'quiz'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {/* Generator Prompt Box */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          placeholder="Enter a subject to study (e.g. Distributed Consensus Algorithms, Organic Chemistry, Macroeconomics)..."
          className="flex-1 w-full p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
        />

        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'flashcards' ? (
            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating || !topicInput.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Generate Cards</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || !topicInput.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
              <span>Generate Quiz</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'flashcards' ? (
        /* Flashcards Deck Viewer */
        <div className="space-y-6">
          {flashcards.length > 0 && currentCard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="text-neutral-500">Click card to flip</span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[260px] p-8 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 hover:border-cyan-500/40 shadow-2xl cursor-pointer flex flex-col justify-between transition-all select-none group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                    {isFlipped ? 'Answer & Core Principle' : 'Prompt / Concept Question'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLearned(currentCard.id);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      currentCard.learned
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{currentCard.learned ? 'Mastered' : 'Mark Learned'}</span>
                  </button>
                </div>

                <div className="py-6 text-center">
                  <p className="text-lg sm:text-xl font-medium text-neutral-100 leading-relaxed font-['Syne',sans-serif]">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>
                </div>

                <div className="text-center text-xs text-neutral-500 group-hover:text-cyan-400 transition-colors">
                  {isFlipped ? 'Tap to view question' : 'Tap to reveal answer'}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  Flip
                </button>
                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              No flashcards available. Enter a topic above to generate a new study deck!
            </div>
          )}
        </div>
      ) : (
        /* Quiz Viewer */
        <div className="space-y-6">
          {activeQuiz ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-base font-bold text-white">
                  Quiz on {activeQuiz.topic}
                </h3>
                {quizSubmitted && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    Score:{' '}
                    {
                      activeQuiz.questions.filter(
                        (q, i) => selectedAnswers[i] === q.correctIndex
                      ).length
                    }{' '}
                    / {activeQuiz.questions.length}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {activeQuiz.questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-3">
                    <div className="text-sm font-semibold text-neutral-200">
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        const isCorrect = q.correctIndex === optIdx;

                        let style = 'bg-neutral-900 border-white/10 text-neutral-300 hover:bg-white/[0.04]';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            style = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold';
                          } else if (isSelected && !isCorrect) {
                            style = 'bg-rose-500/20 border-rose-500/40 text-rose-300';
                          }
                        } else if (isSelected) {
                          style = 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                              }
                            }}
                            className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 rounded-xl bg-black/20 text-xs text-neutral-400 border border-white/[0.04]">
                        <span className="font-semibold text-cyan-400">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Submit Answers
                </button>
              ) : (
                <button
                  onClick={() => onStartChatWithTopic(`Let's review the mistakes and core principles from this quiz on "${activeQuiz.topic}".`)}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Review with Socratic AI Tutor in Chat</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              No active quiz. Enter a subject above and click "Generate Quiz" to test your knowledge!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
