import { 
  Conversation, 
  CustomAssistant, 
  MemoryItem, 
  CanvasDocument, 
  Flashcard, 
  Quiz, 
  GeneratedImage, 
  UserProfile, 
  UserSettings 
} from '../types';
import { BRAND_CONFIG } from '../config/branding';

const PREFIX = BRAND_CONFIG.storagePrefix;

export const DEFAULT_ASSISTANTS: CustomAssistant[] = [
  {
    id: 'general-assistant',
    name: 'Liky Core',
    description: 'Versatile, sharp, and helpful general intelligence for reasoning, daily tasks, and advice.',
    avatarIcon: 'Sparkles',
    color: '#0ea5e9',
    systemInstruction: 'You are Liky Core, the flagship intelligence of Liky AI. Provide clear, accurate, engaging, and well-structured answers.',
    preferredModel: 'gemini-3.8-flash',
    temperature: 0.7,
    samplePrompts: [
      'Summarize key principles of quantum computing',
      'Help me draft a strategic quarterly goal plan',
      'Explain cognitive biases with everyday examples',
    ],
    isBuiltIn: true,
    tags: ['General', 'Reasoning', 'Productivity'],
  },
  {
    id: 'code-architect',
    name: 'Code Architect',
    description: 'Senior full-stack software engineer & system architect. Specializes in TypeScript, Python, algorithms, and clean architecture.',
    avatarIcon: 'Code2',
    color: '#10b981',
    systemInstruction: 'You are Code Architect inside Liky AI. Write pristine, production-ready, type-safe code. Explain architectural tradeoffs, write clean unit tests, and follow SOLID principles.',
    preferredModel: 'gemini-3.1-pro-preview',
    temperature: 0.3,
    samplePrompts: [
      'Design a resilient distributed rate limiter in TypeScript',
      'Review this React hook for memory leaks and race conditions',
      'Build a high-performance LRU cache with O(1) ops',
    ],
    isBuiltIn: true,
    tags: ['Engineering', 'Architecture', 'TypeScript'],
  },
  {
    id: 'socratic-tutor',
    name: 'Socratic Tutor',
    description: 'Patient academic mentor who guides you to discover answers through deep questions, analogies, and quizzes.',
    avatarIcon: 'GraduationCap',
    color: '#f59e0b',
    systemInstruction: 'You are a Socratic Academic Mentor. Rather than simply giving the raw answer, guide the learner step-by-step with intuitive analogies, thought-provoking questions, and conceptual checkpoints.',
    preferredModel: 'gemini-3.8-flash',
    temperature: 0.6,
    samplePrompts: [
      'Teach me calculus derivatives from first principles',
      'Why does E = mc²? Walk me through the thought experiment',
      'Help me understand how macroeconomic monetary policy affects inflation',
    ],
    isBuiltIn: true,
    tags: ['Education', 'STEM', 'Philosophy'],
  },
  {
    id: 'creative-copywriter',
    name: 'Executive Copywriter',
    description: 'World-class editor and brand copywriter. Crafts high-converting prose, memorable headlines, and executive memos.',
    avatarIcon: 'Feather',
    color: '#ec4899',
    systemInstruction: 'You are an Executive Copywriter and Brand Strategist. Eliminate fluff. Write punchy, memorable, rhythmically varied prose that engages deeply.',
    preferredModel: 'gemini-3.8-flash',
    temperature: 0.8,
    samplePrompts: [
      'Rewrite this product launch pitch for maximum punch and clarity',
      'Draft a captivating LinkedIn announcement for a breakthrough product',
      'Write 5 distinct taglines with different emotional hooks',
    ],
    isBuiltIn: true,
    tags: ['Writing', 'Marketing', 'Creative'],
  },
  {
    id: 'polyglot-translator',
    name: 'Polyglot Scholar',
    description: 'Master linguist translating with cultural nuance, idiomatic accuracy, and contextual tone across 50+ languages.',
    avatarIcon: 'Languages',
    color: '#8b5cf6',
    systemInstruction: 'You are Polyglot Scholar. Translate text accurately while explaining cultural nuances, idioms, tone, and register differences.',
    preferredModel: 'gemini-3.8-flash',
    temperature: 0.4,
    samplePrompts: [
      'Translate this legal agreement from English to Spanish with formal nuance',
      'Explain the cultural nuances of untranslatable German compound words',
      'Translate this poem into Haitian Creole while keeping its poetic cadence',
    ],
    isBuiltIn: true,
    tags: ['Languages', 'Translation', 'Culture'],
  },
];

const DEFAULT_DOCUMENTS: CanvasDocument[] = [
  {
    id: 'doc-1',
    title: 'Liky AI Architecture Overview',
    type: 'markdown',
    content: `# Liky AI System Architecture

## 1. Executive Summary
Liky AI is built on a resilient, decoupled full-stack architecture combining:
- **Client**: Fast React 19 SPA with Tailwind CSS and responsive layout.
- **Server**: Express proxy providing secure backend token isolation and SSE streaming.
- **AI Core**: Google GenAI TypeScript SDK with multimodal inputs, Google Search grounding, and deep reasoning models.

## 2. Key Pillars
1. **Multimodal Native**: First-class handling of images, PDFs, CSVs, and audio.
2. **Deep Research Engine**: Multi-stage investigation with query expansion and synthesis.
3. **Interactive Canvas**: In-place editing and executable HTML/JS runner.
4. **Adaptive Privacy**: Granular memory controls with user zero-data retention option.`,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'doc-2',
    title: 'Interactive 3D Matrix Simulation',
    type: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #050608; overflow: hidden; font-family: monospace; }
    canvas { display: block; }
    .label { position: absolute; top: 16px; left: 16px; color: #0ea5e9; font-size: 14px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="label">LIKY AI // INTERACTIVE CANVAS DEMO</div>
  <canvas id="c"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const chars = '01LIKYAI*+~#%&';
    const cols = Math.floor(w / 20);
    const drops = Array(cols).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(5, 6, 8, 0.1)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0ea5e9';
      ctx.font = '14px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        if (drops[i] * 20 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    setInterval(draw, 33);
    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });
  </script>
</body>
</html>`,
    updatedAt: Date.now() - 7200000,
  },
];

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    deckId: 'ai-fundamentals',
    front: 'What is Self-Attention in Transformer models?',
    back: 'A mechanism that calculates how much focus every word in a sequence should place on every other word, computing dynamic Query, Key, and Value vector dot-products.',
    learned: true,
  },
  {
    id: 'fc-2',
    deckId: 'ai-fundamentals',
    front: 'Why is Temperature used in language model sampling?',
    back: 'Temperature scales logits before softmax. Lower temperature (<0.5) makes outputs deterministic and focused; higher temperature (>0.7) increases diversity and creative variation.',
    learned: false,
  },
  {
    id: 'fc-3',
    deckId: 'ai-fundamentals',
    front: 'What is Multimodal Grounding?',
    back: 'Connecting AI reasoning to verifiable external evidence, such as real-time web search results or uploaded image/document features, to eliminate hallucinations.',
    learned: true,
  },
];

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'Prefers concise, mathematically rigorous answers with code examples in TypeScript.',
    category: 'preference',
    createdAt: Date.now() - 86400000,
    isEnabled: true,
  },
  {
    id: 'mem-2',
    content: 'Working on next-generation AI assistant architectures and distributed systems.',
    category: 'work',
    createdAt: Date.now() - 172800000,
    isEnabled: true,
  },
];

export const storage = {
  // --- Conversations ---
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(`${PREFIX}conversations`);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
    // Initial welcome conversation
    const initialConv: Conversation = {
      id: 'welcome-chat',
      title: 'Welcome to Liky AI',
      messages: [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Welcome to **Liky AI**! I am your multimodal intelligence partner.\n\nHere are a few things we can do together right away:\n- ⚡ **Chat & Reason**: Ask complex STEM questions, brainstorm, or debug code.\n- 🌐 **Web Grounding**: Search live information with verified citations.\n- 🔬 **Deep Research**: Launch multi-stage investigative reports on any subject.\n- 🎨 **Creative Canvas**: Draft essays, design interactive HTML apps, and run code.\n- 🖼️ **Multimodal**: Attach images, documents, or spreadsheets for analysis.\n- 🎙️ **Voice**: Talk naturally hands-free with real-time speech.\n\nWhat would you like to explore today?`,
          timestamp: Date.now(),
          modelUsed: 'gemini-3.8-flash',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      isPinned: true,
    };
    this.saveConversations([initialConv]);
    return [initialConv];
  },

  saveConversations(convs: Conversation[]) {
    try {
      localStorage.setItem(`${PREFIX}conversations`, JSON.stringify(convs));
    } catch (e) {
      console.error('Failed to save conversations', e);
    }
  },

  getConversation(id: string): Conversation | undefined {
    return this.getConversations().find((c) => c.id === id);
  },

  saveConversation(conv: Conversation) {
    const list = this.getConversations();
    const index = list.findIndex((c) => c.id === conv.id);
    if (index >= 0) {
      list[index] = conv;
    } else {
      list.unshift(conv);
    }
    this.saveConversations(list);
  },

  deleteConversation(id: string) {
    const list = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(list);
  },

  // --- Assistants ---
  getAssistants(): CustomAssistant[] {
    try {
      const data = localStorage.getItem(`${PREFIX}assistants`);
      if (data) return JSON.parse(data);
    } catch {}
    this.saveAssistants(DEFAULT_ASSISTANTS);
    return DEFAULT_ASSISTANTS;
  },

  saveAssistants(assistants: CustomAssistant[]) {
    try {
      localStorage.setItem(`${PREFIX}assistants`, JSON.stringify(assistants));
    } catch {}
  },

  addAssistant(assistant: CustomAssistant) {
    const list = this.getAssistants();
    list.unshift(assistant);
    this.saveAssistants(list);
  },

  deleteAssistant(id: string) {
    const list = this.getAssistants().filter((a) => a.id !== id);
    this.saveAssistants(list);
  },

  // --- Canvas Documents ---
  getDocuments(): CanvasDocument[] {
    try {
      const data = localStorage.getItem(`${PREFIX}documents`);
      if (data) return JSON.parse(data);
    } catch {}
    this.saveDocuments(DEFAULT_DOCUMENTS);
    return DEFAULT_DOCUMENTS;
  },

  saveDocuments(docs: CanvasDocument[]) {
    try {
      localStorage.setItem(`${PREFIX}documents`, JSON.stringify(docs));
    } catch {}
  },

  saveDocument(doc: CanvasDocument) {
    const list = this.getDocuments();
    const index = list.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      list[index] = doc;
    } else {
      list.unshift(doc);
    }
    this.saveDocuments(list);
  },

  deleteDocument(id: string) {
    const list = this.getDocuments().filter((d) => d.id !== id);
    this.saveDocuments(list);
  },

  // --- Learning Flashcards & Quizzes ---
  getFlashcards(): Flashcard[] {
    try {
      const data = localStorage.getItem(`${PREFIX}flashcards`);
      if (data) return JSON.parse(data);
    } catch {}
    this.saveFlashcards(DEFAULT_FLASHCARDS);
    return DEFAULT_FLASHCARDS;
  },

  saveFlashcards(cards: Flashcard[]) {
    try {
      localStorage.setItem(`${PREFIX}flashcards`, JSON.stringify(cards));
    } catch {}
  },

  getQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(`${PREFIX}quizzes`);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveQuiz(quiz: Quiz) {
    const list = this.getQuizzes();
    list.unshift(quiz);
    try {
      localStorage.setItem(`${PREFIX}quizzes`, JSON.stringify(list));
    } catch {}
  },

  // --- Media Gallery ---
  getGeneratedImages(): GeneratedImage[] {
    try {
      const data = localStorage.getItem(`${PREFIX}images`);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveGeneratedImage(img: GeneratedImage) {
    const list = this.getGeneratedImages();
    list.unshift(img);
    try {
      localStorage.setItem(`${PREFIX}images`, JSON.stringify(list));
    } catch {}
  },

  // --- Memory ---
  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(`${PREFIX}memories`);
      if (data) return JSON.parse(data);
    } catch {}
    this.saveMemories(DEFAULT_MEMORIES);
    return DEFAULT_MEMORIES;
  },

  saveMemories(mems: MemoryItem[]) {
    try {
      localStorage.setItem(`${PREFIX}memories`, JSON.stringify(mems));
    } catch {}
  },

  addMemory(content: string, category: MemoryItem['category'] = 'preference') {
    const list = this.getMemories();
    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      content,
      category,
      createdAt: Date.now(),
      isEnabled: true,
    };
    list.unshift(item);
    this.saveMemories(list);
    return item;
  },

  deleteMemory(id: string) {
    const list = this.getMemories().filter((m) => m.id !== id);
    this.saveMemories(list);
  },

  toggleMemory(id: string) {
    const list = this.getMemories().map((m) => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m);
    this.saveMemories(list);
  },

  // --- User Profile ---
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(`${PREFIX}user_profile`);
      if (data) return JSON.parse(data);
    } catch {}
    const defaultUser: UserProfile = {
      id: 'usr-liky-1',
      name: 'Liky Explorer',
      email: 'user@likyai.com',
      avatarUrl: '',
      tier: 'pro',
      monthlyTokensUsed: 38240,
      monthlyLimit: 1000000,
      isLoggedIn: true,
    };
    this.saveUserProfile(defaultUser);
    return defaultUser;
  },

  saveUserProfile(profile: UserProfile) {
    try {
      localStorage.setItem(`${PREFIX}user_profile`, JSON.stringify(profile));
    } catch {}
  },

  // --- Settings ---
  getUserSettings(): UserSettings {
    try {
      const data = localStorage.getItem(`${PREFIX}settings`);
      if (data) return JSON.parse(data);
    } catch {}
    const defaultSettings: UserSettings = {
      language: 'en',
      theme: 'dark',
      defaultModel: 'gemini-3.8-flash',
      enableMemory: true,
      voiceName: 'Kore',
      soundEffects: true,
      streamSpeed: 'fast',
    };
    this.saveUserSettings(defaultSettings);
    return defaultSettings;
  },

  saveUserSettings(settings: UserSettings) {
    try {
      localStorage.setItem(`${PREFIX}settings`, JSON.stringify(settings));
    } catch {}
  },
};
