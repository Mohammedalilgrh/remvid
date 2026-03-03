export async function searchVideos(keywords: string): Promise<string | null> {
  const apiKey = (window as any).__PEXELS_API_KEY__ || (import.meta as any).env?.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("No Pexels API key found — using fallback color");
    return null;
  }

  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=5&orientation=portrait`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

    const data = await res.json();
    const videos: any[] = data.videos || [];
    if (!videos.length) return null;

    const picked = videos[Math.floor(Math.random() * videos.length)];

    const files: any[] = picked.video_files || [];
    const hd = files.find((f: any) => f.quality === "hd" && f.width <= 1280);
    const sd = files.find((f: any) => f.quality === "sd");
    const file = hd || sd || files[0];

    return file?.link || null;
  } catch (e) {
    console.error("Pexels fetch error:", e);
    return null;
  }
}
