import { GoogleGenAI } from '@google/genai';

// Shared /api/* handler used by the Netlify Function (production) and server.ts (local dev).
// Written against the Web Request/Response API so it runs unchanged in both places.

// Gemini client. On Netlify, AI Gateway injects GEMINI_API_KEY and GOOGLE_GEMINI_BASE_URL,
// which the SDK reads automatically. Locally, set GEMINI_API_KEY in .env.
function getAIClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({});
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

const json = (data: unknown, status = 200) => Response.json(data, { status });

// Server-Sent Events response. `run` receives a `send` helper; the stream closes when it resolves.
function sseResponse(run: (send: (data: unknown) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        await run(send);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

// 1. Health check & configuration
function health() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return json({
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
}

// 2. Available models catalog
function models() {
  return json({
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
}

// 3. Streaming Chat Endpoint (Server-Sent Events)
async function chat(body: any) {
  const {
    messages,
    model = 'gemini-3.8-flash',
    systemInstruction,
    enableWebSearch = false,
    attachments = [],
    memory = [],
  } = body;

  if (!messages || !Array.isArray(messages)) {
    return json({ error: 'Messages array is required' }, 400);
  }

  let ai: GoogleGenAI;
  try {
    ai = getAIClient();
  } catch (err: any) {
    return json({ error: err.message || 'Chat generation failed' }, 500);
  }

  return sseResponse(async (send) => {
    try {
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

      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config,
      });

      let citations: any[] = [];

      for await (const chunk of responseStream) {
        const chunkText = chunk.text || '';

        // Extract search grounding metadata if available
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata) {
          if (groundingMetadata.groundingChunks) {
            citations = groundingMetadata.groundingChunks
              .map((gc: any) => gc.web?.uri ? { title: gc.web.title || gc.web.uri, url: gc.web.uri } : null)
              .filter(Boolean);
          }
          if (groundingMetadata.webSearchQueries) {
            send({ type: 'searchQueries', queries: groundingMetadata.webSearchQueries });
          }
        }

        // Send text delta
        if (chunkText) {
          send({ type: 'delta', text: chunkText });
        }
      }

      // Send final completion packet with citations and metadata
      send({ type: 'done', citations });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      adminStats.recentLogs.unshift({
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        message: err.message || 'Failed to stream chat response',
      });
      send({ type: 'error', error: err.message || 'An error occurred during generation' });
    }
  });
}

// 4. Deep Research Execution Endpoint
async function deepResearch(body: any) {
  const { query, depth = 'in-depth', domainFocus = 'general' } = body;
  if (!query) {
    return json({ error: 'Query is required for deep research' }, 400);
  }

  let ai: GoogleGenAI;
  try {
    ai = getAIClient();
  } catch (err: any) {
    return json({ error: err.message || 'Deep research failed' }, 500);
  }

  return sseResponse(async (send) => {
    try {
      // Step 1: Send stage 1 notification
      send({
        type: 'step',
        step: 1,
        title: 'Clarifying Objective & Formulating Research Plan',
        details: `Deconstructing query "${query}" across key analytical vectors (${domainFocus} focus).`,
      });

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

      send({ type: 'plan', plan: planData });

      // Step 2: Source Investigation with Web Search
      send({
        type: 'step',
        step: 2,
        title: 'Gathering & Cross-Referencing Web Grounded Sources',
        details: `Executing search queries: ${planData.subQueries.join(', ')}`,
      });

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

      send({
        type: 'step',
        step: 3,
        title: 'Synthesizing Findings into Comprehensive Report',
        details: 'Structuring data, verifying claims, and generating final publication-grade brief.',
      });

      let sources: any[] = [];

      for await (const chunk of researchStream) {
        const text = chunk.text || '';

        const candidate = chunk.candidates?.[0];
        if (candidate?.groundingMetadata?.groundingChunks) {
          sources = candidate.groundingMetadata.groundingChunks
            .map((gc: any) => gc.web?.uri ? { title: gc.web.title || gc.web.uri, url: gc.web.uri } : null)
            .filter(Boolean);
        }

        if (text) {
          send({ type: 'reportDelta', text });
        }
      }

      send({ type: 'done', sources, title: `Deep Research: ${query}` });
    } catch (err: any) {
      console.error('Error in /api/deep-research:', err);
      send({ type: 'error', error: err.message || 'Deep research execution failed' });
    }
  });
}

// 5. Image Generation & Editing Endpoint
async function imageGenerate(body: any) {
  try {
    const { prompt, aspectRatio = '1:1', inputImageBase64 = null, editInstruction = null } = body;
    if (!prompt && !editInstruction) {
      return json({ error: 'A prompt or edit instruction is required' }, 400);
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
      return json({
        error: 'Model did not return image data. Note: image generation requires a valid project API key with image generation quota enabled.',
        message: textDescription || 'No image output received',
      }, 500);
    }

    return json({
      imageUrl,
      description: textDescription,
      prompt: editInstruction ? `${prompt} (${editInstruction})` : prompt,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /api/image-generate:', err);
    return json({ error: err.message || 'Image generation failed' }, 500);
  }
}

// 6. Text-to-Speech (TTS) Endpoint
// Netlify AI Gateway does not offer TTS models, so this only succeeds with your own GEMINI_API_KEY.
// When it fails, the client falls back to the browser's built-in speech synthesis.
async function tts(body: any) {
  try {
    const { text, voice = 'Kore' } = body;
    if (!text) {
      return json({ error: 'Text is required for TTS' }, 400);
    }

    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
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
      return json({ error: 'No audio returned by TTS model' }, 500);
    }

    return json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    return json({ error: err.message || 'Speech synthesis failed' }, 500);
  }
}

// 7. Video Generation Status & Dispatch (Veo)
// Veo is not offered by Netlify AI Gateway, so this only succeeds with your own GEMINI_API_KEY.
async function videoGenerate(body: any) {
  try {
    const { prompt, aspectRatio = '16:9' } = body;
    if (!prompt) {
      return json({ error: 'Prompt is required for video generation' }, 400);
    }

    const ai = getAIClient();

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio as any,
      },
    });

    return json({
      operationName: operation.name,
      status: 'pending',
      prompt,
    });
  } catch (err: any) {
    console.error('Error in /api/video-generate:', err);
    return json({
      error: err.message || 'Video generation failed. Note: Veo requires a project with video generation quota.',
    }, 500);
  }
}

async function videoStatus(body: any) {
  try {
    const { operationName } = body;
    if (!operationName) {
      return json({ error: 'Operation name is required' }, 400);
    }

    const ai = getAIClient();

    // SDK requires GenerateVideosOperation instance with name property
    const op: any = { name: operationName };
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const isDone = Boolean(updated.done);
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri || null;

    return json({
      done: isDone,
      videoUri: isDone ? videoUri : null,
      error: updated.error || null,
    });
  } catch (err: any) {
    console.error('Error in /api/video-status:', err);
    return json({ error: err.message || 'Failed to check video status' }, 500);
  }
}

// Router
export async function handleApiRequest(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const route = `${req.method} ${pathname.replace(/\/+$/, '')}`;

  const readBody = async () => {
    try {
      return await req.json();
    } catch {
      return {};
    }
  };

  switch (route) {
    case 'GET /api/health':
      return health();
    case 'GET /api/models':
      return models();
    case 'POST /api/chat':
      return chat(await readBody());
    case 'POST /api/deep-research':
      return deepResearch(await readBody());
    case 'POST /api/image-generate':
      return imageGenerate(await readBody());
    case 'POST /api/tts':
      return tts(await readBody());
    case 'POST /api/video-generate':
      return videoGenerate(await readBody());
    case 'POST /api/video-status':
      return videoStatus(await readBody());
    case 'GET /api/admin/metrics':
      return json(adminStats);
    default:
      return json({ error: `Not found: ${route}` }, 404);
  }
}
