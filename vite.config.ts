import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    include: ["remotion", "@remotion/player"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: "all",
  },
});
