import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        "/baremux/index.mjs",
        "/bare-as-module3/index.mjs",
        "/epoxy/index.mjs",
      ],
    },
  },
});
