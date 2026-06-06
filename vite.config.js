import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
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
