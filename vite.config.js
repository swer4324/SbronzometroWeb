import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    base: "./",
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icon.svg"],
            manifest: {
                name: "Sbronzometro",
                short_name: "Sbronzometro",
                description: "Stima locale e offline del tasso alcolemico.",
                theme_color: "#0c1714",
                background_color: "#0c1714",
                display: "standalone",
                orientation: "portrait",
                icons: [
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
                globPatterns: ["**/*.{js,css,html,svg,pdf}"]
            }
        })
    ]
});
