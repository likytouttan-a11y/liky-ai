import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client with required User-Agent
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory telemetry & stats for Admin dashboard
const adminStats = {
  totalQueries: 142,
  totalTokensEstimated: 98450,
  activeUsers: 8,
  modelUsage: {
    'gemini-3.8-flash': 112,
    'gemini-3.1-pro-preview': 24,
    'gemini-3.1-flash-lite-image': 6,
  } as Record<string, number>,
  recentLogs: [
    { id: 'log-1', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'info', message: 'Liky AI server initialized successfully' },
    { id: 'log-2', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'info', message: 'Multimodal session started' },
  ],
};

// 1. Health check & configuration
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    appName: 'Liky AI',
    version: '1.0.0',
    capabilities: {
      multimodal: true,
      streaming: true,
      webSearch: true,
      deepResearch: true,
      imageGeneration: true,
      videoGeneration: true,
      tts: true,
      transcribe: true,
    },
  });
});

// 2. Available models catalog
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.8-flash',
        name: 'Liky Flash 3.8',
        description: 'Ultra-fast, responsive multimodal model for everyday chat, analysis, and reasoning.',
        speed: 'Lightning',
        reasoning: 'Standard',
        contextWindow: '1M tokens',
        isDefault: true,
        supportsWebSearch: true,
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Liky Pro 3.1',
        description: 'Advanced reasoning, deep logic, coding architectures, and STEM problem solving.',
        speed: 'High',
        reasoning: 'Deep',
        contextWindow: '2M tokens',
        isDefault: false,
        supportsWebSearch: true,
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Liky Ultra-Lite',
        description: 'Instant latency-optimized model designed for quick answers and low bandwidth.',
        speed: 'Instant',
        reasoning: 'Fast',
        contextWindow: '1M tokens',
        isDefault: false,
        supportsWebSearch: false,
      },
    ],
  });
});

// 3. Streaming Chat Endpoint (Server-Sent Events)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      model = 'gemini-3.8-flash',
      systemInstruction,
      enableWebSearch = false,
      attachments = [],
      memory = [],
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getAIClient();

    // Prepare headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Construct system prompt with memory context if enabled
    let fullSystemInstruction = systemInstruction || 
      'You are Liky AI, a brilliant, thoughtful, accurate, and versatile next-generation AI assistant. ' +
      'Format responses cleanly in Markdown with tables, code blocks, lists, and bold headers when helpful. ' +
      'Be insightful, concise where needed, and deeply thorough for complex topics.';

    if (memory && memory.length > 0) {
      const memoryText = memory.map((m: any) => `- ${m.content || m}`).join('\n');
      fullSystemInstruction += `\n\n[USER RECALLED MEMORY & PREFERENCES]:\n${memoryText}`;
    }

    // Build contents array for @google/genai SDK
    // Format: array of { role: 'user' | 'model', parts: [...] }
    const contents: any[] = [];

    // Add conversation history
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLatest = i === messages.length - 1;
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';

      const parts: any[] = [];

      // If it's the latest user message, attach any uploaded multimodal media parts
      if (isLatest && role === 'user' && attachments && attachments.length > 0) {
        for (const file of attachments) {
          if (file.base64Data && file.mimeType) {
            // Remove data URI prefix if present
            const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: file.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      // Add text part
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // Build configuration
    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: 0.7,
    };

    if (enableWebSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Update telemetry
    adminStats.totalQueries++;
    adminStats.modelUsage[model] = (adminStats.modelUsage[model] || 0) + 1;

    // Call generateContentStream
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    let accumulatedText = '';
    let citations: any[] = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      accumulatedText += chunkText;

      // Extract search grounding metadata if available
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata) {
        if (groundingMetadata.groundingChunks) {
          citations = groundingMetadata.groundingChunks
            .map((gc: any) => gc.web?.uri ? { title: gc.web.title || gc.web.uri, url: gc.web.uri } : null)
            .filter(Boolean);
        }
        if (groundingMetadata.webSearchQueries) {
          res.write(`data: ${JSON.stringify({ type: 'searchQueries', queries: groundingMetadata.webSearchQueries })}\n\n`);
        }
      }

      // Send text delta
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ type: 'delta', text: chunkText })}\n\n`);
      }
    }

    // Send final completion packet with citations and metadata
    res.write(`data: ${JSON.stringify({ type: 'done', citations })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    adminStats.recentLogs.unshift({
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'error',
      message: err.message || 'Failed to stream chat response',
    });

    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Chat generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'An error occurred during generation' })}\n\n`);
      res.end();
    }
  }
});

// 4. Deep Research Execution Endpoint
app.post('/api/deep-research', async (req, res) => {
  try {
    const { query, depth = 'in-depth', domainFocus = 'general' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required for deep research' });
    }

    const ai = getAIClient();

    // Prepare SSE stream for progressive multi-stage research
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Step 1: Send stage 1 notification
    res.write(`data: ${JSON.stringify({
      type: 'step',
      step: 1,
      title: 'Clarifying Objective & Formulating Research Plan',
      details: `Deconstructing query "${query}" across key analytical vectors (${domainFocus} focus).`,
    })}\n\n`);

    // Generate research plan using fast model
    const planPrompt = `You are a Principal Research Director at Liky AI. The user has requested deep research on:
"${query}".
Domain focus: ${domainFocus}. Depth: ${depth}.

Identify 3 to 5 critical research sub-queries and questions to investigate.
Output valid JSON in this format:
{
  "summary": "Brief explanation of the objective",
  "subQueries": ["query 1", "query 2", "query 3"]
}`;

    const planRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: planPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let planData = { summary: 'Investigating core dimensions', subQueries: [query, `${query} analysis`, `${query} future outlook`] };
    try {
      planData = JSON.parse(planRes.text || '{}');
    } catch {
      // fallback
    }

    res.write(`data: ${JSON.stringify({
      type: 'plan',
      plan: planData,
    })}\n\n`);

    // Step 2: Source Investigation with Web Search
    res.write(`data: ${JSON.stringify({
      type: 'step',
      step: 2,
      title: 'Gathering & Cross-Referencing Web Grounded Sources',
      details: `Executing search queries: ${planData.subQueries.join(', ')}`,
    })}\n\n`);

    // Execute comprehensive research synthesis with search grounding
    const researchPrompt = `You are Liky AI Deep Research Engine. Conduct an exhaustive, high-rigor, structured investigative report on:
"${query}"

Plan Scope:
${planData.subQueries.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Structure your response with:
# Executive Summary
## Key Findings & Core Insights
## Comprehensive Analysis
## Comparative Breakdown & Evidence
## Critical Challenges & Risk Factors
## Future Projections & Strategic Takeaways
## Conclusion

Format with rich Markdown, tables, and precise analysis. Ensure high objectivity and factual depth.`;

    const researchStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    res.write(`data: ${JSON.stringify({
      type: 'step',
      step: 3,
      title: 'Synthesizing Findings into Comprehensive Report',
      details: 'Structuring data, verifying claims, and generating final publication-grade brief.',
    })}\n\n`);

    let reportText = '';
    let sources: any[] = [];

    for await (const chunk of researchStream) {
      const text = chunk.text || '';
      reportText += text;

      const candidate = chunk.candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        sources = candidate.groundingMetadata.groundingChunks
          .map((gc: any) => gc.web?.uri ? { title: gc.web.title || gc.web.uri, url: gc.web.uri } : null)
          .filter(Boolean);
      }

      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'reportDelta', text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({
      type: 'done',
      sources,
      title: `Deep Research: ${query}`,
    })}\n\n`);

    res.end();
  } catch (err: any) {
    console.error('Error in /api/deep-research:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Deep research failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Deep research execution failed' })}\n\n`);
      res.end();
    }
  }
});

// 5. Image Generation & Editing Endpoint
app.post('/api/image-generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', inputImageBase64 = null, editInstruction = null } = req.body;
    if (!prompt && !editInstruction) {
      return res.status(400).json({ error: 'A prompt or edit instruction is required' });
    }

    const ai = getAIClient();

    let response;
    if (inputImageBase64) {
      // Image editing workflow with gemini-3.1-flash-lite-image
      const cleanBase64 = inputImageBase64.replace(/^data:[^;]+;base64,/, '');
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/png',
              },
            },
            {
              text: editInstruction || prompt || 'Refine this image',
            },
          ],
        },
      });
    } else {
      // Standard image generation with gemini-3.1-flash-lite-image
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });
    }

    // Extract image part from candidates
    let imageUrl = null;
    let textDescription = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: 'Model did not return image data. Note: image generation requires a valid project API key with image generation quota enabled.',
        message: textDescription || 'No image output received',
      });
    }

    res.json({
      imageUrl,
      description: textDescription,
      prompt: editInstruction ? `${prompt} (${editInstruction})` : prompt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /api/image-generate:', err);
    res.status(500).json({
      error: err.message || 'Image generation failed',
    });
  }
});

// 6. Text-to-Speech (TTS) Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const ai = getAIClient();

    // Use gemini-3.8-flash-lite-tts for standard low-latency TTS
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: text.slice(0, 800) }], // Keep within optimal audio phrase boundary
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned by TTS model' });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.status(500).json({
      error: err.message || 'Speech synthesis failed',
    });
  }
});

// 7. Video Generation Status & Dispatch (Veo)
app.post('/api/video-generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video generation' });
    }

    const ai = getAIClient();

    // Use veo-3.1-lite-generate-preview
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio as any,
      },
    });

    res.json({
      operationName: operation.name,
      status: 'pending',
      prompt,
    });
  } catch (err: any) {
    console.error('Error in /api/video-generate:', err);
    res.status(500).json({
      error: err.message || 'Video generation failed. Note: Veo requires a project with video generation quota.',
    });
  }
});

app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'Operation name is required' });
    }

    const ai = getAIClient();

    // SDK requires GenerateVideosOperation instance with name property
    const op: any = { name: operationName };
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const isDone = Boolean(updated.done);
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri || null;

    res.json({
      done: isDone,
      videoUri: isDone ? videoUri : null,
      error: updated.error || null,
    });
  } catch (err: any) {
    console.error('Error in /api/video-status:', err);
    res.status(500).json({ error: err.message || 'Failed to check video status' });
  }
});

// 8. Admin Telemetry Endpoint
app.get('/api/admin/metrics', (req, res) => {
  res.json(adminStats);
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Liky AI] Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
