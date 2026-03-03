# 🎬 Viral Factory

Generate viral short-form videos in the style of "Stop Selling Features" — fast-paced narration with size-based emphasis captions, stock footage, and AI voiceover.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

**Get your keys:**
- Gemini API: https://aistudio.google.com/app/apikey
- Pexels API: https://www.pexels.com/api/ (free)

### 3. Wire up API keys

In `src/services/gemini.ts`, the Gemini SDK reads `process.env.GEMINI_API_KEY`.
Update line 3 to use the Vite env variable:

```ts
const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```

The Pexels service in `src/services/pexels.ts` already reads `import.meta.env.VITE_PEXELS_API_KEY`.

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:5173

---

## How It Works

1. **Enter a niche** (e.g. "Sales", "Fitness", "Real Estate")
2. **Choose batch size** (1–10 videos)
3. Click **Generate Videos**

The app will:
- 🤖 Generate a viral script using Gemini (structured JSON)
- 🎙️ Convert the script to speech using Gemini TTS (Kore voice)
- 🎥 Fetch matching stock footage from Pexels per scene
- 🎬 Preview the video in-browser using Remotion Player
- 💾 Export as `.webm` with audio

---

## Caption Style (Reference Video Match)

Exactly matching the viral "stop selling features" format:
- **ALL WHITE text** — no color highlights
- **Emphasis word** = 90px UPPERCASE (3× larger)
- **Normal words** = 36px lowercase
- Bottom-left aligned, black letterbox bars top & bottom
- Staggered pop-in animation per word

---

## File Structure

```
src/
  App.tsx                 # Main UI + export logic
  main.tsx                # React entry point
  components/
    RemotionVideo.tsx     # Remotion video composition
  services/
    gemini.ts             # Script generation + TTS
    pexels.ts             # Stock footage fetching
```

---

## Export

Click **Download** on any ready video card. The browser will record the canvas + audio into a `.webm` file.

> Note: For MP4 export, use the Remotion CLI: `npm run remotion:render`
