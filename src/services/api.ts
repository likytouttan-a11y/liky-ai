import { AIModelId, Attachment, Citation, MemoryItem } from '../types';

export interface ChatStreamCallbacks {
  onDelta: (text: string) => void;
  onSearchQueries?: (queries: string[]) => void;
  onDone: (data: { citations: Citation[] }) => void;
  onError: (error: string) => void;
}

export interface ResearchStreamCallbacks {
  onStep: (step: { step: number; title: string; details: string }) => void;
  onPlan: (plan: { summary: string; subQueries: string[] }) => void;
  onReportDelta: (text: string) => void;
  onDone: (data: { sources: Citation[]; title: string }) => void;
  onError: (error: string) => void;
}

export const api = {
  // 1. Health check
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false };
    }
  },

  // 2. Models
  async getModels() {
    try {
      const res = await fetch('/api/models');
      return await res.json();
    } catch {
      return { models: [] };
    }
  },

  // 3. Streaming Chat
  async chatStream(
    params: {
      messages: Array<{ role: string; content: string }>;
      model: AIModelId;
      systemInstruction?: string;
      enableWebSearch?: boolean;
      attachments?: Attachment[];
      memory?: MemoryItem[];
    },
    callbacks: ChatStreamCallbacks,
    signal?: AbortSignal
  ) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        callbacks.onError(errorData.error || 'Server error occurred');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('ReadableStream not supported');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace(/^data: /, '');

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'delta') {
              callbacks.onDelta(data.text);
            } else if (data.type === 'searchQueries') {
              callbacks.onSearchQueries?.(data.queries);
            } else if (data.type === 'done') {
              callbacks.onDone({ citations: data.citations || [] });
            } else if (data.type === 'error') {
              callbacks.onError(data.error);
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', e, jsonStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone({ citations: [] });
      } else {
        callbacks.onError(err.message || 'Network error during chat streaming');
      }
    }
  },

  // 4. Deep Research Stream
  async deepResearchStream(
    params: {
      query: string;
      depth?: 'standard' | 'in-depth';
      domainFocus?: string;
    },
    callbacks: ResearchStreamCallbacks,
    signal?: AbortSignal
  ) {
    try {
      const res = await fetch('/api/deep-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        callbacks.onError(errorData.error || 'Deep research request failed');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError('ReadableStream not supported');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace(/^data: /, '');

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'step') {
              callbacks.onStep({ step: data.step, title: data.title, details: data.details });
            } else if (data.type === 'plan') {
              callbacks.onPlan(data.plan);
            } else if (data.type === 'reportDelta') {
              callbacks.onReportDelta(data.text);
            } else if (data.type === 'done') {
              callbacks.onDone({ sources: data.sources || [], title: data.title });
            } else if (data.type === 'error') {
              callbacks.onError(data.error);
            }
          } catch (e) {
            console.error('Failed to parse research SSE:', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone({ sources: [], title: 'Aborted Research' });
      } else {
        callbacks.onError(err.message || 'Deep research network failure');
      }
    }
  },

  // 5. Generate Image
  async generateImage(params: {
    prompt: string;
    aspectRatio?: string;
    inputImageBase64?: string | null;
    editInstruction?: string | null;
  }) {
    const res = await fetch('/api/image-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
      throw new Error(err.error || 'Image generation failed');
    }

    return await res.json();
  },

  // 6. Text to Speech
  async generateSpeech(text: string, voice = 'Kore') {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'TTS failed' }));
      throw new Error(err.error || 'TTS failed');
    }

    return await res.json();
  },

  // 7. Video Generation
  async generateVideo(prompt: string, aspectRatio = '16:9') {
    const res = await fetch('/api/video-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Video dispatch failed' }));
      throw new Error(err.error || 'Video dispatch failed');
    }

    return await res.json();
  },

  async checkVideoStatus(operationName: string) {
    const res = await fetch('/api/video-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operationName }),
    });

    if (!res.ok) {
      throw new Error('Video status check failed');
    }

    return await res.json();
  },

  // 8. Admin Telemetry
  async getAdminMetrics() {
    const res = await fetch('/api/admin/metrics');
    return await res.json();
  },
};
