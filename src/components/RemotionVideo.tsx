import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { Script } from "../services/gemini";

interface RemotionVideoProps {
  script: Script;
  clips: string[];
  audioUrl: string;
}

// Reference video style analysis:
// - ALL WHITE text, no color highlights
// - Emphasis word is 3x LARGER and UPPERCASE, normal words lowercase/small
// - Bottom-left aligned, ~25% from bottom of video area
// - Clean Inter/Arial Black font, weight 900
// - Black letterbox bars top (10%) and bottom (10%)
const LETTERBOX_HEIGHT = 0.10;
const CAPTION_BOTTOM_PCT = 0.26; // % from bottom of video area

function CaptionWord({
  word,
  isEmphasis,
  wordIndex,
  sceneStartFrame,
  currentFrame,
}: {
  word: string;
  isEmphasis: boolean;
  wordIndex: number;
  sceneStartFrame: number;
  currentFrame: number;
}) {
  // Staggered pop-in: each word appears ~2 frames after previous
  const appearAt = sceneStartFrame + wordIndex * 2;
  const localT = currentFrame - appearAt;

  const scale = interpolate(localT, [0, 6], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.0)),
  });

  const opacity = interpolate(localT, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (localT < 0) return null;

  // Reference style: emphasis = huge (90px) UPPERCASE, normal = small (36px) lowercase
  const fontSize = isEmphasis ? 90 : 36;

  return (
    <span
      style={{
        display: "inline-block",
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: "bottom left",
        color: "#FFFFFF",
        fontWeight: 900,
        textTransform: isEmphasis ? "uppercase" : "lowercase",
        fontSize: `${fontSize}px`,
        letterSpacing: isEmphasis ? "-2px" : "-0.5px",
        textShadow:
          "0px 2px 10px rgba(0,0,0,0.95), 0px 0px 30px rgba(0,0,0,0.7)",
        marginRight: isEmphasis ? "12px" : "6px",
        lineHeight: 1.05,
        fontFamily:
          '"Inter", "Helvetica Neue", "Arial Black", Helvetica, Arial, sans-serif',
      }}
    >
      {isEmphasis ? word.toUpperCase() : word.toLowerCase()}
    </span>
  );
}

export const RemotionVideo: React.FC<RemotionVideoProps> = ({
  script,
  clips,
  audioUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  let elapsedFrames = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Audio track */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Video scenes */}
      {script.scenes.map((scene, index) => {
        const durationFrames = Math.max(
          Math.round((scene.duration || 1.2) * fps),
          Math.round(0.8 * fps)
        );
        const startFrame = elapsedFrames;
        elapsedFrames += durationFrames;

        const clip = clips[index % clips.length];
        if (!clip) return null;

        // Subtle Ken Burns zoom
        const sceneLocalFrame = frame - startFrame;
        const zoomScale = interpolate(
          sceneLocalFrame,
          [0, durationFrames],
          [1.0, 1.06],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Parse caption words
        const words = scene.text.trim().split(/\s+/);
        const emphasisClean =
          scene.emphasis?.toLowerCase().replace(/[.,!?;:'"]/g, "") || "";

        // Caption position: bottom-left of the video area (excluding letterbox)
        const videoAreaHeight = height * (1 - 2 * LETTERBOX_HEIGHT);
        const captionBottom =
          height * LETTERBOX_HEIGHT + videoAreaHeight * CAPTION_BOTTOM_PCT;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <AbsoluteFill>
              {/* Background video */}
              <Video
                src={clip}
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${zoomScale})`,
                  filter:
                    "contrast(1.05) saturate(0.85) brightness(0.85)",
                }}
              />

              {/* Top letterbox bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${LETTERBOX_HEIGHT * 100}%`,
                  backgroundColor: "#000",
                  zIndex: 10,
                }}
              />

              {/* Bottom letterbox bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${LETTERBOX_HEIGHT * 100}%`,
                  backgroundColor: "#000",
                  zIndex: 10,
                }}
              />

              {/* Gradient for text readability */}
              <div
                style={{
                  position: "absolute",
                  bottom: `${LETTERBOX_HEIGHT * 100}%`,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
                  zIndex: 9,
                  pointerEvents: "none",
                }}
              />

              {/* Caption block — bottom left, size-based emphasis */}
              <div
                style={{
                  position: "absolute",
                  bottom: `${captionBottom}px`,
                  left: "40px",
                  right: "40px",
                  zIndex: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  lineHeight: 1.1,
                }}
              >
                {words.map((word, i) => {
                  const wordClean = word
                    .toLowerCase()
                    .replace(/[.,!?;:'"]/g, "");
                  const isEmphasis = wordClean === emphasisClean;
                  return (
                    <CaptionWord
                      key={i}
                      word={word}
                      isEmphasis={isEmphasis}
                      wordIndex={i}
                      sceneStartFrame={startFrame}
                      currentFrame={frame}
                    />
                  );
                })}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
