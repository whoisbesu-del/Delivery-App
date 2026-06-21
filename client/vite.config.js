import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'South Shopping',
        short_name: 'South',
        description: 'Your marketplace — shop, sell, deliver.',
        theme_color: '#060A06',
        background_color: '#060A06',
        display: 'standalone',
        start_url: '/',
        icons: [{ src:'icons/icon.svg', sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': { target:'http://localhost:4000', changeOrigin:true } },
  },
});
