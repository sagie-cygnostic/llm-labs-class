import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const api = "http://127.0.0.1:8787";
const proxy: Record<string, ProxyOptions> = {
  "/api": { target: api, changeOrigin: true },
  "/lab-app": { target: api, changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: { allow: [".."] },
    proxy,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    proxy,
  },
});
