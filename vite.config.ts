import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      '/api': {
        // In dev, prefer local API to avoid remote mismatches and enable cookie auth
        target: process.env.VITE_API_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        // Keep '/api' prefix so backend receives '/api/*' routes
        rewrite: (path) => path
      }
    },
    hmr: {
      clientPort: 8080
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));