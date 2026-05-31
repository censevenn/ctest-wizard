import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Вернули swc-плагин, который точно есть в твоём проекте
import path from "path";

export default defineConfig({
  base: "/ctest-wizard/", // Наш принудительный путь для GitHub Pages остаётся на месте
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
