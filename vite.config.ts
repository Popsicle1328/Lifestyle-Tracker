import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  plugins: [react(),VitePWA({registerType:'prompt',includeAssets:['icon.svg'],manifest:{name:'Daymark — Fitness & Lifestyle',short_name:'Daymark',description:'Your fitness, your rules. Local-first sleep, workout, nutrition and lifestyle tracking.',theme_color:'#f7f8fc',background_color:'#f7f8fc',display:'standalone',start_url:'./',scope:'./',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{navigateFallback:'index.html',globPatterns:['**/*.{js,css,html,svg,png,woff2}']}})]
});
