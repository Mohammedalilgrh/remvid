import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    include: ["remotion", "@remotion/player"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: "0.0.0.0",
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [
      "remvid.onrender.com",
      "all"
    ],
  },
});
