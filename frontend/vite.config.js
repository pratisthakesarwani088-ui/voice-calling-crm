import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allows the dev server to be reached when proxied/containerized
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
