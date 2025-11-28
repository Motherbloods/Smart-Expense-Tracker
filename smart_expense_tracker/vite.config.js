import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Smart Expense",
        short_name: "SmartExpense",
        description: "An expense tracking app",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  // =============== SAFE BUILD CONFIG ===============
  build: {
    cssCodeSplit: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
      },
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Chunk khusus node_modules
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "lucide"; // aman
            if (id.includes("recharts")) return "recharts"; // aman
            if (id.includes("pusher-js")) return "pusher"; // aman

            return "vendor"; // semua vendor disatukan → aman & stabil
          }
        },
      },
    },
  },

  // =============== DEP OPTIMIZATION ===============
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"],
    exclude: ["pusher-js"], // tetap exclude karena lazy load
  },

  // =============== SERVER ===============
  server: {
    headers: {
      "Cache-Control": "public, max-age=31536000",
    },
  },
});
