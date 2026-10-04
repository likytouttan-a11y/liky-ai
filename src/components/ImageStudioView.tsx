import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  Wand2, 
  Maximize2, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { GeneratedImage } from '../types';
import { api } from '../services/api';

interface ImageStudioViewProps {
  history: GeneratedImage[];
  onSaveImage: (img: GeneratedImage) => void;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({
  history,
  onSaveImage,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(
    history[0] || null
  );
  const [editPrompt, setEditPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const stylePresets = [
    { label: 'Photorealistic', promptModifier: 'hyper-realistic photography, 8k resolution, Hasselblad lens, cinematic lighting' },
    { label: 'Minimalist 3D', promptModifier: 'clean minimal 3D render, smooth matte materials, soft ambient occlusion, studio lighting' },
    { label: 'Cyberpunk Neon', promptModifier: 'cyberpunk aesthetics, neon reflections, rain-slicked city streets, moody volumetric lighting' },
    { label: 'Editorial Illustration', promptModifier: 'modern vector editorial illustration, refined color palette, sophisticated geometric elegance' },
  ];

  const handleGenerate = async (presetModifier = '') => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    const finalPrompt = presetModifier ? `${prompt.trim()}, ${presetModifier}` : prompt.trim();

    try {
      const data = await api.generateImage({
        prompt: finalPrompt,
        aspectRatio,
      });

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: finalPrompt,
        imageUrl: data.imageUrl,
        aspectRatio,
        createdAt: Date.now(),
      };

      setCurrentResult(newImage);
      onSaveImage(newImage);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Image generation failed. Ensure your Gemini API key has quota enabled for image generation.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!currentResult || !editPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const data = await api.generateImage({
        prompt: currentResult.prompt,
        inputImageBase64: currentResult.imageUrl,
        editInstruction: editPrompt.trim(),
      });

      const editedImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: `${currentResult.prompt} (Refined: ${editPrompt.trim()})`,
        imageUrl: data.imageUrl,
        aspectRatio: currentResult.aspectRatio,
        createdAt: Date.now(),
      };

      setCurrentResult(editedImage);
      onSaveImage(editedImage);
      setEditPrompt('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Image refinement failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isVideoLoading) return;

    setIsVideoLoading(true);
    setVideoStatus('Initiating video generation with Veo...');
    setErrorMessage(null);

    try {
      const data = await api.generateVideo(videoPrompt.trim(), videoAspectRatio);
      setVideoOperationName(data.operationName);
      setVideoStatus('Processing frames (Veo model). This may take 1-2 minutes...');

      // Poll status
      pollVideoStatus(data.operationName);
    } catch (err: any) {
      setIsVideoLoading(false);
      setVideoStatus(null);
      setErrorMessage(
        err.message || 'Video generation requires access to Veo video generation quota on your Google GenAI project.'
      );
    }
  };

  const pollVideoStatus = async (operationName: string) => {
    try {
      const statusRes = await api.checkVideoStatus(operationName);
      if (statusRes.done) {
        setIsVideoLoading(false);
        setVideoStatus('Video generated successfully!');
        if (statusRes.videoUri) {
          setVideoUrl(statusRes.videoUri);
        }
      } else {
        setTimeout(() => pollVideoStatus(operationName), 10000);
      }
    } catch {
      setIsVideoLoading(false);
      setVideoStatus('Status check completed.');
    }
  };

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Liky Multimodal Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
            Visual Generation & Creative Editing
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Generate high-fidelity visuals or synthesize dynamic video sequences with state-of-the-art multimodal AI.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'image'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'video'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video (Veo)</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Notice</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {activeTab === 'image' ? (
        /* Image Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Prompt & Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic hydroponic greenhouse floating in orbit, volumetric warm sunlight..."
                  rows={4}
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        aspectRatio === ratio
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Curated Style Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {stylePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGenerate(preset.promptModifier)}
                      disabled={isGenerating || !prompt.trim()}
                      className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left text-xs text-neutral-300 hover:text-cyan-300 transition-colors disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering with Liky GenAI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Artwork</span>
                  </>
                )}
              </button>
            </div>

            {/* In-Place Image Refinement / Edit Box */}
            {currentResult && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Iterative Image Editing</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Add glowing aurora borealis in the background..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    onClick={handleEdit}
                    disabled={!editPrompt.trim() || isGenerating}
                    className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Apply Edit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Display Stage */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="min-h-[420px] rounded-2xl bg-neutral-900/60 border border-white/[0.08] flex items-center justify-center relative overflow-hidden group">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-cyan-400">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <span className="text-xs font-medium">Synthesizing multimodal tensor representation...</span>
                </div>
              ) : currentResult ? (
                <>
                  <img
                    src={currentResult.imageUrl}
                    alt={currentResult.prompt}
                    className="w-full h-full object-contain max-h-[560px] rounded-2xl"
                  />
                  {/* Overlay Action Bar */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                    <button
                      onClick={() => downloadImage(currentResult.imageUrl, currentResult.prompt)}
                      className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-neutral-500 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-neutral-600" />
                  <div className="text-sm font-medium">No Image Rendered Yet</div>
                  <div className="text-xs text-neutral-600">Enter a prompt on the left to start generating artwork</div>
                </div>
              )}
            </div>

            {/* Recent Gallery Carousel */}
            {history.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Generation History ({history.length})
                </span>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {history.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setCurrentResult(img)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        currentResult?.id === img.id
                          ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Video Generation (Veo) */
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-6 max-w-3xl mx-auto">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Veo Video Synthesis</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Generate 720p cinematic video sequences from detailed descriptions. Powered by Google Veo video models.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-300">Video Concept Prompt</label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="A golden eagle soaring over snow-capped alpine peaks at sunrise, sweeping cinematic 4k drone shot..."
              rows={3}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Format:</span>
              <button
                onClick={() => setVideoAspectRatio('16:9')}
                className={`px-3 py-1 rounded-lg border ${
                  videoAspectRatio === '16:9'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                16:9 Landscape
              </button>
              <button
                onClick={() => setVideoAspectRatio('9:16')}
                className={`px-3 py-1 rounded-lg border ${
                  videoAspectRatio === '9:16'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                9:16 Portrait
              </button>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={isVideoLoading || !videoPrompt.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isVideoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching to Veo...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Synthesize Video</span>
                </>
              )}
            </button>
          </div>

          {videoStatus && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 animate-pulse flex-shrink-0" />
              <span>{videoStatus}</span>
            </div>
          )}

          {videoUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
              <video src={videoUrl} controls className="w-full max-h-96 bg-black" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
