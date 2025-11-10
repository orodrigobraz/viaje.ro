import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/viaje.ro/", // Adicione esta linha
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // Copia index.html para 404.html após o build para GitHub Pages SPA
        try {
          copyFileSync(
            path.resolve(__dirname, 'dist/index.html'),
            path.resolve(__dirname, 'dist/404.html')
          );
        } catch (err) {
          console.warn('Não foi possível copiar index.html para 404.html:', err);
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ['**/*.geojson'],
}));