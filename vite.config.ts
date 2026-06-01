import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => ({
  base: "/ctest-wizard/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // componentTagger удален, здесь больше ничего нет
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
