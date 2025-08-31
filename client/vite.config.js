import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward /api to backend during dev
      "/api": "http://localhost:8080"
    }
  }
});
