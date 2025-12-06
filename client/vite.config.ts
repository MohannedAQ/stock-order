import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "attached_assets") // <--- THIS IS CORRECT
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
