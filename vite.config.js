import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  server: {
    port: 5176,
    strictPort: false,
    open: true,
  },
  preview: {
    port: 5176,
    strictPort: false,
    open: true,
  },
});
