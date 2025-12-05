// apps/web/astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node"; // 👈 ESTE FALTABA

export default defineConfig({
    output: "server", // modo servidor
    adapter: node({
        mode: "standalone", // bien para Coolify
    }),
    integrations: [react()],
    vite: {
        plugins: [tailwindcss()],
    },
});
