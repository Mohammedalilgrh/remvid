import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Allow process.env access in browser for Gemini SDK
    "process.env": {},
  },
  optimizeDeps: {
    include: ["remotion", "@remotion/player"],
  },
});
