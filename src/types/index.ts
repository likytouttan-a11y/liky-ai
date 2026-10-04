export type ViewMode = 
  | 'chat'
  | 'research'
  | 'canvas'
  | 'studio'
  | 'assistants'
  | 'learning'
  | 'settings'
  | 'admin';

export type AIModelId = 'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

export interface AIModel {
  id: AIModelId;
  name: string;
  description: string;
  speed: string;
  reasoning: string;
  contextWindow: string;
  isDefault?: boolean;
  supportsWebSearch?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  base64Data?: string;
  previewUrl?: string;
  type: 'image' | 'document' | 'audio' | 'video';
}

export interface Citation {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  citations?: Citation[];
  searchQueries?: string[];
  isStreaming?: boolean;
  modelUsed?: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: AIModelId;
  personaId?: string;
  isPinned?: boolean;
  enableWebSearch?: boolean;
}

export interface CustomAssistant {
  id: string;
  name: string;
  description: string;
  avatarIcon: string;
  color: string;
  systemInstruction: string;
  preferredModel: AIModelId;
  temperature: number;
  samplePrompts: string[];
  isBuiltIn?: boolean;
  tags: string[];
}

export interface DeepResearchStep {
  step: number;
  title: string;
  details: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface DeepResearchSession {
  id: string;
  query: string;
  domainFocus: string;
  depth: 'standard' | 'in-depth';
  steps: DeepResearchStep[];
  plan?: {
    summary: string;
    subQueries: string[];
  };
  sources: Citation[];
  reportContent: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface CanvasDocument {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'code' | 'html';
  language?: string;
  updatedAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  learned: boolean;
  lastReviewed?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: number;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'personal' | 'work' | 'instruction';
  createdAt: number;
  isEnabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tier: 'free' | 'pro' | 'premium';
  monthlyTokensUsed: number;
  monthlyLimit: number;
  isLoggedIn: boolean;
}

export interface UserSettings {
  language: string;
  theme: 'dark' | 'light' | 'system';
  defaultModel: AIModelId;
  enableMemory: boolean;
  voiceName: string;
  soundEffects: boolean;
  streamSpeed: 'normal' | 'fast';
}

export interface AdminMetrics {
  totalQueries: number;
  totalTokensEstimated: number;
  activeUsers: number;
  modelUsage: Record<string, number>;
  recentLogs: Array<{
    id: string;
    timestamp: string;
    type: 'info' | 'warn' | 'error';
    message: string;
  }>;
}
