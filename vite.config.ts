import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["client.orchid-lab.systems", "client.tissuex.me"],
    strictPort: true,
    hmr: false,
  },

  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["client.orchid-lab.systems", "client.tissuex.me"],
    strictPort: true,
  },
});