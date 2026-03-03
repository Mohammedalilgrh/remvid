// Pexels API service — fetches stock video clips by keyword
// Requires PEXELS_API_KEY in your environment

export async function searchVideos(keywords: string): Promise<string | null> {
  const apiKey = (window as any).__PEXELS_API_KEY__ || import.meta.env.VITE_PEXELS_API_KEY;
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

    // Pick a random one from top 5 results for variety
    const picked = videos[Math.floor(Math.random() * videos.length)];

    // Prefer HD (1280) but accept SD
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
