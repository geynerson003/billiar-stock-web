import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),

    VitePWA({
      registerType: "prompt",

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigate-cache",
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },

      manifest: {
        id: "/",
        name: "Billiard Stock — Control Total del Negocio",
        short_name: "Billiard Stock",
        description:
          "App profesional para gestionar inventario, ventas, clientes, mesas y reportes de tu billar.",
        start_url: "/",
        display: "standalone",
        orientation: "any",
        theme_color: "#0d6efd",
        background_color: "#0b1222",
        categories: ["business", "productivity"],

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],

  server: {
    port: 4173
  }
});
