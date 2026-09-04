import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Підсвідомість у дії',
        short_name: 'Підсвідомість',
        description:
          'Трекер щоденних практик за книгою Джона Кехо: візуалізація, афірмації, наміри та інші вправи для роботи з підсвідомістю.',
        theme_color: '#241C35',
        background_color: '#F5F1EA',
        display: 'standalone',
        start_url: '/',
        lang: 'uk',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
