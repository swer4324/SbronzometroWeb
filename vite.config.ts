import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const sourceRedirectStart = "<!-- SOURCE_DEPLOYMENT_REDIRECT_START -->";
const sourceRedirectEnd = "<!-- SOURCE_DEPLOYMENT_REDIRECT_END -->";

const stripSourceDeploymentRedirect: Plugin = {
  name: "strip-source-deployment-redirect",
  apply: "build",
  transformIndexHtml(html) {
    const start = html.indexOf(sourceRedirectStart);
    const end = html.indexOf(sourceRedirectEnd);
    if (start < 0 || end < start) return html;
    const lineStart = html.lastIndexOf("\n", start) + 1;
    const markerEnd = end + sourceRedirectEnd.length;
    const nextLine = html.indexOf("\n", markerEnd);
    const lineEnd = nextLine < 0 ? markerEnd : nextLine + 1;
    return html.slice(0, lineStart) + html.slice(lineEnd);
  }
};

export default defineConfig({
  base: "./",
  build: {
    target: "es2015"
  },
  plugins: [
    stripSourceDeploymentRedirect,
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-512.png"],
      manifest: {
        name: "Sbronzometro",
        short_name: "Sbronzometro",
        description: "Stima locale e offline del tasso alcolemico.",
        lang: "it",
        theme_color: "#0c1714",
        background_color: "#0c1714",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,pdf,webmanifest}"]
      }
    })
  ]
});
