import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

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

  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },

  build: {
    cssCodeSplit: true,
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "lucide";
            if (id.includes("pusher-js")) return "pusher";

            return "vendor";
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios", "recharts"],
    exclude: ["pusher-js"],
  },

  server: {
    headers: {
      "Cache-Control": "public, max-age=31536000",
    },
  },
});
