import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// WHY a proxy?
// When the frontend (localhost:5173) calls the backend (localhost:5000),
// the browser enforces CORS. Rather than configuring CORS headers,
// we proxy all /api calls through Vite itself — the browser only
// ever talks to localhost:5173, Vite forwards it to :5000 server-side.
// No CORS headers needed, and the base URL in api.js becomes just "/api".
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
