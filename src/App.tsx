/**
 * Liky AI - Next-Generation Multimodal Intelligence Platform
 * Architecture: React 19 + TypeScript + Express Backend + Google GenAI SDK
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PromptComposer } from './components/PromptComposer';
import { ChatView } from './components/ChatView';
import { DeepResearchView } from './components/DeepResearchView';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ImageStudioView } from './components/ImageStudioView';
import { CustomAssistantsView } from './components/CustomAssistantsView';
import { LearningView } from './components/LearningView';
import { VoiceModal } from './components/VoiceModal';
import { MemoryModal } from './components/MemoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';

import { 
  AIModelId, 
  Attachment, 
  CanvasDocument, 
  Conversation, 
  CustomAssistant, 
  Flashcard, 
  GeneratedImage, 
  MemoryItem, 
  Message, 
  UserProfile, 
  UserSettings, 
  ViewMode 
} from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import { BRAND_CONFIG } from './config/branding';

export default function App() {
  // Navigation & View
  const [currentView, setCurrentView] = useState<ViewMode>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core Data
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    storage.getConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || 'welcome-chat'
  );

  const [assistants, setAssistants] = useState<CustomAssistant[]>(() =>
    storage.getAssistants()
  );
  const [activeAssistant, setActiveAssistant] = useState<CustomAssistant | null>(null);

  const [documents, setDocuments] = useState<CanvasDocument[]>(() =>
    storage.getDocuments()
  );
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() =>
    storage.getFlashcards()
  );
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>(() =>
    storage.getGeneratedImages()
  );
  const [memories, setMemories] = useState<MemoryItem[]>(() =>
    storage.getMemories()
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    storage.getUserProfile()
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    storage.getUserSettings()
  );

  // Chat & Stream State
  const [selectedModel, setSelectedModel] = useState<AIModelId>(
    settings.defaultModel || 'gemini-3.8-flash'
  );
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Research transfer query
  const [researchQuery, setResearchQuery] = useState('');

  // Sync theme
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-neutral-50 text-neutral-900 antialiased';
    } else {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-neutral-950 text-neutral-100 antialiased';
    }
  }, [settings.theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setIsVoiceOpen(false);
        setIsMemoryOpen(false);
        setIsSettingsOpen(false);
        setIsAdminOpen(false);
        setIsAuthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active Conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] || {
      id: 'default',
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
    };

  // --- Handlers ---
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      personaId: activeAssistant?.id,
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    storage.saveConversations(updated);
    setActiveConversationId(newConv.id);
    setCurrentView('chat');
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    storage.deleteConversation(id);
    if (activeConversationId === id) {
      if (filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
    );
    setConversations(updated);
    storage.saveConversations(updated);
  };

  const handleTogglePinConversation = (id: string) => {
    const updated = conversations.map((c) =>
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    );
    setConversations(updated);
    storage.saveConversations(updated);
  };

  // Chat Execution with Streaming
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    withWebSearch = enableWebSearch
  ) => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments,
    };

    const assistantPlaceholderId = `msg-${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      modelUsed: selectedModel,
      isStreaming: true,
    };

    // Auto title if first message
    const shouldAutoTitle = activeConversation.messages.length === 0;
    const autoTitle = shouldAutoTitle
      ? content.slice(0, 32).trim() || 'New Discussion'
      : activeConversation.title;

    const updatedMessages = [...activeConversation.messages, userMessage, assistantMessage];
    const updatedConversation: Conversation = {
      ...activeConversation,
      title: autoTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    const newConvs = conversations.map((c) =>
      c.id === activeConversation.id ? updatedConversation : c
    );
    setConversations(newConvs);
    storage.saveConversations(newConvs);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Prepare history payload for API
    const historyPayload = activeConversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    historyPayload.push({ role: 'user', content: content.trim() });

    let accumulatedDelta = '';

    await api.chatStream(
      {
        messages: historyPayload,
        model: selectedModel,
        systemInstruction: activeAssistant?.systemInstruction,
        enableWebSearch: withWebSearch,
        attachments,
        memory: settings.enableMemory ? memories.filter((m) => m.isEnabled) : [],
      },
      {
        onDelta: (chunk) => {
          accumulatedDelta += chunk;
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== activeConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? { ...m, content: accumulatedDelta, isStreaming: true }
                    : m
                ),
              };
            })
          );
        },
        onDone: ({ citations }) => {
          setIsStreaming(false);
          setConversations((prev) => {
            const finished = prev.map((conv) => {
              if (conv.id !== activeConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? { ...m, content: accumulatedDelta, isStreaming: false, citations }
                    : m
                ),
              };
            });
            storage.saveConversations(finished);
            return finished;
          });

          // Update user token telemetry
          setUserProfile((prev) => {
            const next = {
              ...prev,
              monthlyTokensUsed: prev.monthlyTokensUsed + Math.round(accumulatedDelta.length / 3),
            };
            storage.saveUserProfile(next);
            return next;
          });
        },
        onError: (err) => {
          setIsStreaming(false);
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== activeConversation.id) return conv;
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content:
                          accumulatedDelta ||
                          `An error occurred while generating response: ${err}`,
                        isStreaming: false,
                      }
                    : m
                ),
              };
            })
          );
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleRegenerateLastResponse = () => {
    if (activeConversation.messages.length < 2 || isStreaming) return;
    const msgs = [...activeConversation.messages];
    const last = msgs[msgs.length - 1];
    if (last.role === 'assistant') {
      msgs.pop(); // remove last assistant message
      const lastUser = msgs[msgs.length - 1];
      if (lastUser && lastUser.role === 'user') {
        const trimmedConv = { ...activeConversation, messages: msgs.slice(0, -1) };
        const updated = conversations.map((c) => (c.id === trimmedConv.id ? trimmedConv : c));
        setConversations(updated);
        handleSendMessage(lastUser.content, lastUser.attachments || []);
      }
    }
  };

  const handleEditPrompt = (index: number, newContent: string) => {
    if (isStreaming) return;
    const remaining = activeConversation.messages.slice(0, index);
    const updatedConv = { ...activeConversation, messages: remaining };
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    handleSendMessage(newContent);
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversation.id) return conv;
        return {
          ...conv,
          messages: conv.messages.map((m) =>
            m.id === messageId ? { ...m, feedback } : m
          ),
        };
      })
    );
  };

  // Launch Deep Research from prompt
  const handleStartDeepResearch = (query: string) => {
    setResearchQuery(query);
    setCurrentView('research');
  };

  // Transfer research or doc to canvas
  const handleSendToCanvas = (title: string, markdown: string) => {
    const newDoc: CanvasDocument = {
      id: `doc-${Date.now()}`,
      title,
      content: markdown,
      type: 'markdown',
      updatedAt: Date.now(),
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    storage.saveDocuments(updated);
    setCurrentView('canvas');
  };

  // Custom Assistant activation
  const handleSelectAssistant = (assistant: CustomAssistant) => {
    setActiveAssistant(assistant);
    setSelectedModel(assistant.preferredModel);
    handleNewChat();
  };

  const handleClearAssistant = () => {
    setActiveAssistant(null);
  };

  // Memory Handlers
  const handleAddMemory = (content: string, category: MemoryItem['category']) => {
    const item = storage.addMemory(content, category);
    setMemories([item, ...memories]);
  };

  const handleDeleteMemory = (id: string) => {
    storage.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleMemory = (id: string) => {
    storage.toggleMemory(id);
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEnabled: !m.isEnabled } : m))
    );
  };

  const handleToggleGlobalMemory = (enabled: boolean) => {
    const nextSettings = { ...settings, enableMemory: enabled };
    setSettings(nextSettings);
    storage.saveUserSettings(nextSettings);
  };

  // Clear all data
  const handleClearAllData = () => {
    localStorage.clear();
    setConversations(storage.getConversations());
    setActiveConversationId('welcome-chat');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100">
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        activeAssistant={activeAssistant}
        onClearAssistant={handleClearAssistant}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onOpenMemoryModal={() => setIsMemoryOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        userProfile={userProfile}
        settings={settings}
        onUpdateSettings={(s) => {
          setSettings(s);
          storage.saveUserSettings(s);
        }}
      />

      {/* Main Container Area with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentView={currentView}
          onSelectView={setCurrentView}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
          userProfile={userProfile}
          onOpenUpgradeModal={() => setIsSettingsOpen(true)}
          onOpenAdminModal={() => setIsAdminOpen(true)}
        />

        {/* View Router Pane */}
        <main className="flex-1 flex flex-col overflow-hidden lg:pl-72 transition-all">
          {currentView === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <ChatView
                conversation={activeConversation}
                isStreaming={isStreaming}
                onSendMessage={handleSendMessage}
                onRegenerateLastResponse={handleRegenerateLastResponse}
                onEditPrompt={handleEditPrompt}
                onFeedback={handleFeedback}
              />
              <div className="p-3 sm:p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent">
                <PromptComposer
                  onSendMessage={handleSendMessage}
                  isStreaming={isStreaming}
                  onStopGeneration={handleStopGeneration}
                  onStartDeepResearch={handleStartDeepResearch}
                  enableWebSearch={enableWebSearch}
                  onToggleWebSearch={() => setEnableWebSearch(!enableWebSearch)}
                />
              </div>
            </div>
          )}

          {currentView === 'research' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <DeepResearchView
                initialQuery={researchQuery}
                onSendToCanvas={handleSendToCanvas}
              />
            </div>
          )}

          {currentView === 'canvas' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <CanvasWorkspace
                documents={documents}
                onSaveDocument={(doc) => {
                  storage.saveDocument(doc);
                  setDocuments(storage.getDocuments());
                }}
                onDeleteDocument={(id) => {
                  storage.deleteDocument(id);
                  setDocuments(storage.getDocuments());
                }}
              />
            </div>
          )}

          {currentView === 'studio' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <ImageStudioView
                history={imageHistory}
                onSaveImage={(img) => {
                  storage.saveGeneratedImage(img);
                  setImageHistory(storage.getGeneratedImages());
                }}
              />
            </div>
          )}

          {currentView === 'assistants' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <CustomAssistantsView
                assistants={assistants}
                onSelectAssistant={handleSelectAssistant}
                onAddAssistant={(asst) => {
                  storage.addAssistant(asst);
                  setAssistants(storage.getAssistants());
                }}
                onDeleteAssistant={(id) => {
                  storage.deleteAssistant(id);
                  setAssistants(storage.getAssistants());
                }}
              />
            </div>
          )}

          {currentView === 'learning' && (
            <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
              <LearningView
                flashcards={flashcards}
                onSaveFlashcards={(cards) => {
                  storage.saveFlashcards(cards);
                  setFlashcards(cards);
                }}
                onStartChatWithTopic={(topic) => {
                  handleNewChat();
                  setTimeout(() => handleSendMessage(topic), 100);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
      />

      {/* Modals */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendToChat={(transcript) => {
          handleSendMessage(transcript);
          setCurrentView('chat');
        }}
      />

      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        enableMemory={settings.enableMemory}
        onToggleGlobalMemory={handleToggleGlobalMemory}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onToggleMemory={handleToggleMemory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(s) => {
          setSettings(s);
          storage.saveUserSettings(s);
        }}
        userProfile={userProfile}
        onUpdateUserProfile={(p) => {
          setUserProfile(p);
          storage.saveUserProfile(p);
        }}
        onClearAllData={handleClearAllData}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userProfile={userProfile}
        onUpdateUserProfile={(p) => {
          setUserProfile(p);
          storage.saveUserProfile(p);
        }}
      />
    </div>
  );
}
