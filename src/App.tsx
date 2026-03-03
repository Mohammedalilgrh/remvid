import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  Trash2,
} from "lucide-react";
import { Player } from "@remotion/player";
import { RemotionVideo } from "./components/RemotionVideo";
import { generateScripts, generateTTS, Script } from "./services/gemini";
import { searchVideos } from "./services/pexels";
import confetti from "canvas-confetti";

interface VideoProject {
  id: string;
  script: Script;
  audioUrl?: string;
  clips: string[];
  status: "idle" | "processing" | "ready" | "error";
  errorMsg?: string;
}

export default function App() {
  const [niche, setNiche] = useState("Business Motivation");
  const [videoCount, setVideoCount] = useState(1);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [isProcessingVideos, setIsProcessingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGeneratingScripts(true);
    setError(null);
    setScripts([]);
    setProjects([]);
    try {
      const newScripts = await generateScripts(niche, videoCount);
      setScripts(newScripts);
      if (newScripts.length > 0) {
        setTimeout(() => handleBuildVideos(newScripts), 80);
      }
    } catch (err: any) {
      setError(err.message || "Script generation failed.");
    } finally {
      setIsGeneratingScripts(false);
    }
  };

  const handleBuildVideos = async (scriptsToUse: Script[] = scripts) => {
    if (!scriptsToUse.length) return;
    setIsProcessingVideos(true);
    setError(null);

    const initialProjects: VideoProject[] = scriptsToUse.map((s) => ({
      id: Math.random().toString(36).slice(2, 9),
      script: s,
      clips: [],
      status: "processing",
    }));
    setProjects(initialProjects);

    await Promise.all(
      initialProjects.map(async (proj) => {
        try {
          const [audioUrl, rawClips] = await Promise.all([
            generateTTS(proj.script),
            Promise.all(
              proj.script.scenes.map((scene) => searchVideos(scene.keywords))
            ),
          ]);

          const actualDuration = await getAudioDuration(audioUrl);
          const totalScriptDuration = proj.script.scenes.reduce(
            (acc, s) => acc + (s.duration || 1.2),
            0
          );
          const scaleFactor = actualDuration / totalScriptDuration;

          const normalizedScenes = proj.script.scenes.map((scene) => ({
            ...scene,
            duration: (scene.duration || 1.2) * scaleFactor,
          }));

          const validClips = rawClips.filter((c): c is string => c !== null);

          setProjects((prev) =>
            prev.map((p) =>
              p.id === proj.id
                ? {
                    ...p,
                    audioUrl,
                    clips: validClips,
                    status: "ready",
                    script: { ...proj.script, scenes: normalizedScenes },
                  }
                : p
            )
          );
        } catch (err: any) {
          console.error("Project error:", err);
          setProjects((prev) =>
            prev.map((p) =>
              p.id === proj.id
                ? { ...p, status: "error", errorMsg: err.message }
                : p
            )
          );
        }
      })
    );

    setIsProcessingVideos(false);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-cyan-400 selection:text-black">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-cyan-400 rounded-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-black text-lg tracking-tight uppercase">
            Viral Factory
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Online
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-5">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              Configure
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40">
                Niche / Topic
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
                placeholder="e.g. Sales, Fitness, Mindset..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40">
                Batch Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVideoCount(n)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      videoCount === n
                        ? "bg-cyan-400 text-black"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-bold mb-1">
                Voice
              </div>
              <div className="text-sm font-bold text-white">
                Kore — Deep Narrator
              </div>
              <div className="text-[11px] text-white/30 mt-0.5">
                Gemini TTS · Confident, fast-paced
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGeneratingScripts || isProcessingVideos || !niche.trim()}
              className="w-full bg-cyan-400 text-black py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-cyan-300 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20"
            >
              {isGeneratingScripts ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Generate Videos
            </button>
          </div>

          {error && (
            <div className="border border-red-500/40 bg-red-500/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400 text-[11px] font-bold uppercase tracking-wide mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Error
              </div>
              <p className="text-[11px] text-red-400/80 leading-relaxed">{error}</p>
            </div>
          )}

          {scripts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] uppercase tracking-widest text-white/30 font-bold">
                Scripts ({scripts.length})
              </h3>
              {scripts.map((s, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/8 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">
                      #{i + 1} · {s.scenes.length} scenes
                    </span>
                    <button
                      onClick={() =>
                        setScripts((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[12px] text-white/60 leading-relaxed line-clamp-3 italic">
                    "{s.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {projects.length > 0 ? (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    Production Queue
                  </h2>
                  {isProcessingVideos && (
                    <span className="text-[10px] text-white/30 uppercase tracking-widest ml-auto">
                      Building...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <VideoCard key={project.id} project={project} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[500px] border border-dashed border-white/8 rounded-3xl flex flex-col items-center justify-center text-center p-12 gap-6"
              >
                <div className="w-16 h-16 bg-white/4 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white/20" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Ready to generate</h3>
                  <p className="text-white/30 text-sm max-w-xs">
                    Enter a niche and click Generate. Your viral short-form videos will appear here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

// ─── Video Card ────────────────────────────────────────────────────────────────
function VideoCard({ project }: { project: VideoProject }) {
  const [isExporting, setIsExporting] = useState(false);

  const totalDuration = useMemo(
    () => project.script.scenes.reduce((acc, s) => acc + (s.duration || 1.2), 0),
    [project.script.scenes]
  );

  const totalFrames = Math.max(Math.round(totalDuration * 30), 30);

  const handleDownload = async () => {
    if (!project.audioUrl || !project.clips.length) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d")!;

      const canvasAny = canvas as any;
      if (!canvasAny.captureStream) {
        const a = document.createElement("a");
        a.href = project.audioUrl;
        a.download = `viral-${project.id}-audio.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert("Video export is not supported in this browser. Audio downloaded instead. Please use Chrome.");
        return;
      }

      const audio = new Audio(project.audioUrl);
      audio.crossOrigin = "anonymous";

      const stream: MediaStream = canvasAny.captureStream(30);
      let audioTracks: MediaStreamTrack[] = [];

      try {
        const audioAny = audio as any;
        const aStream = audioAny.captureStream?.() || audioAny.mozCaptureStream?.();
        if (aStream) audioTracks = aStream.getAudioTracks();
      } catch (_) {}

      const combined = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioTracks,
      ]);

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(combined, { mimeType: mime });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          try {
            const blob = new Blob(chunks, { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `viral-${project.id}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        recorder.onerror = (e) => reject(e);
        recorder.start(100);
        audio.play().catch(console.error);

        let sceneIdx = 0;
        let sceneStart = Date.now();
        let isRunning = true;

        const renderLoop = () => {
          if (!isRunning) return;

          if (sceneIdx >= project.script.scenes.length) {
            isRunning = false;
            setTimeout(() => {
              recorder.stop();
              audio.pause();
            }, 300);
            return;
          }

          const scene = project.script.scenes[sceneIdx];
          const sceneDuration = (scene.duration || 1.2) * 1000;
          const elapsed = Date.now() - sceneStart;

          if (elapsed >= sceneDuration) {
            sceneIdx++;
            sceneStart = Date.now();
            requestAnimationFrame(renderLoop);
            return;
          }

          const clip = project.clips[sceneIdx % project.clips.length];

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const vidEl = document.createElement("video");
          vidEl.src = clip;
          vidEl.muted = true;
          vidEl.crossOrigin = "anonymous";
          vidEl.style.display = "none";
          document.body.appendChild(vidEl);

          const LB = 0.1;
          const barH = canvas.height * LB;
          const vidAreaH = canvas.height * (1 - 2 * LB);

          const drawCurrentFrame = () => {
            if (!isRunning) {
              vidEl.pause();
              if (document.body.contains(vidEl)) document.body.removeChild(vidEl);
              return;
            }

            const e2 = Date.now() - sceneStart;
            if (e2 >= sceneDuration) {
              vidEl.pause();
              if (document.body.contains(vidEl)) document.body.removeChild(vidEl);
              sceneIdx++;
              sceneStart = Date.now();
              requestAnimationFrame(renderLoop);
              return;
            }

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (vidEl.readyState >= 2) {
              const vr = vidEl.videoWidth / vidEl.videoHeight;
              const cr = canvas.width / vidAreaH;
              let dw, dh, ox, oy;
              if (vr > cr) {
                dh = vidAreaH;
                dw = dh * vr;
                ox = (canvas.width - dw) / 2;
                oy = barH;
              } else {
                dw = canvas.width;
                dh = dw / vr;
                ox = 0;
                oy = barH + (vidAreaH - dh) / 2;
              }
              ctx.filter = "contrast(1.05) saturate(0.9) brightness(0.88)";
              ctx.drawImage(vidEl, ox, oy, dw, dh);
              ctx.filter = "none";
            }

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, barH);
            ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

            const grad = ctx.createLinearGradient(0, canvas.height - barH, 0, canvas.height - barH - vidAreaH * 0.35);
            grad.addColorStop(0, "rgba(0,0,0,0.55)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height - barH - vidAreaH * 0.35, canvas.width, vidAreaH * 0.35);

            const words = scene.text.trim().split(/\s+/);
            const emphasisClean = scene.emphasis?.toLowerCase().replace(/[.,!?;:'"]/g, "") || "";
            ctx.textBaseline = "bottom";
            ctx.shadowColor = "rgba(0,0,0,0.95)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 2;

            const captionBottom = canvas.height - barH - vidAreaH * 0.26;
            const x = 40;
            let lineY = captionBottom;

            const lines: { word: string; isEmphasis: boolean }[][] = [[]];
            words.forEach((word) => {
              const isEmp = word.toLowerCase().replace(/[.,!?;:'"]/g, "") === emphasisClean;
              const lastLine = lines[lines.length - 1];
              ctx.font = `900 90px Inter, Arial Black, sans-serif`;
              const lineText = lastLine.map((w) => w.word).join(" ") + (lastLine.length ? " " + word : word);
              const w = ctx.measureText(lineText).width;
              if (w > canvas.width - 80 && lastLine.length > 0) {
                lines.push([{ word, isEmphasis: isEmp }]);
              } else {
                lastLine.push({ word, isEmphasis: isEmp });
              }
            });

            lines.reverse().forEach((line) => {
              let curX = x;
              let lineHeight = 0;
              line.forEach(({ word, isEmphasis: isEmp }) => {
                const fontSize = isEmp ? 90 : 36;
                ctx.font = `900 ${fontSize}px Inter, Arial Black, sans-serif`;
                ctx.fillStyle = "#FFFFFF";
                const displayWord = isEmp ? word.toUpperCase() : word.toLowerCase();
                ctx.fillText(displayWord, curX, lineY);
                curX += ctx.measureText(displayWord).width + (isEmp ? 12 : 6);
                lineHeight = Math.max(lineHeight, fontSize * 1.1);
              });
              lineY -= lineHeight;
            });

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            requestAnimationFrame(drawCurrentFrame);
          };

          vidEl.oncanplay = () => {
            vidEl.play().catch(console.error);
            requestAnimationFrame(drawCurrentFrame);
          };

          vidEl.onerror = () => {
            if (document.body.contains(vidEl)) document.body.removeChild(vidEl);
            sceneIdx++;
            sceneStart = Date.now();
            requestAnimationFrame(renderLoop);
          };

          vidEl.load();
        };

        requestAnimationFrame(renderLoop);
      });

    } catch (err: any) {
      console.error("Export error:", err);
      alert("Export failed: " + (err?.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/8 shadow-2xl">
      <div className="aspect-[9/16] bg-black relative">
        {project.status === "processing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest text-cyan-400/60">
              Assembling...
            </span>
          </div>
        ) : project.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-[11px] uppercase tracking-widest text-red-400 font-bold">
              Failed
            </span>
            <p className="text-[11px] text-white/30">
              {project.errorMsg || "Production error"}
            </p>
          </div>
        ) : (
          <Player
            component={RemotionVideo}
            inputProps={{
              script: project.script,
              clips: project.clips,
              audioUrl: project.audioUrl || "",
            }}
            durationInFrames={totalFrames}
            fps={30}
            compositionWidth={720}
            compositionHeight={1280}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
          />
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold">
            ID: {project.id}
          </div>
          <div className="text-[10px] text-cyan-400/50 font-bold uppercase tracking-wide">
            {project.status === "error"
              ? "Error"
              : `${project.script.scenes.length} scenes · ${totalDuration.toFixed(1)}s`}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting || project.status !== "ready"}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all disabled:opacity-40"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {isExporting ? "Exporting..." : "Download"}
        </button>
      </div>
    </div>
  );
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error("Audio load error"));
    setTimeout(() => reject(new Error("Audio metadata timeout")), 15000);
  });
}
