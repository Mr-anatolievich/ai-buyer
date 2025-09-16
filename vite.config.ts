import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Кореневий Vite-конфіг, який використовує код із папки `frontend/`
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
  publicDir: path.resolve(__dirname, "./frontend/public"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));