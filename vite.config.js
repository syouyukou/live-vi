import { defineConfig } from "vite";

export default defineConfig({
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
