import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import process from "node:process";
import seoPlugin from "./vite.seo.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
  plugins: [
    seoPlugin(env.VITE_SITE_URL),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg"],
      workbox: {
        navigateFallbackDenylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/],
      },
      manifest: {
        id: "/",
        name: "Smart Expense Tracker",
        short_name: "Smart Expense",
        description: "Pencatat pengeluaran pribadi dengan pencatatan lewat bot Telegram.",
        lang: "id",
        categories: ["finance", "productivity"],
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
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
          if (id.includes("commonjsHelpers")) return "react";
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "lucide";
            if (id.includes("pusher-js")) return "pusher";
            if (/node_modules\/(recharts|d3-|victory-vendor|recharts-scale|decimal\.js-light)/.test(id)) return "charts";
            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return "react";

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

  };
});
