import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'WikiWorldWeb - Enciclopédia Livre',
          short_name: 'WikiWorldWeb',
          description: 'WikiWorldWeb - A Enciclopédia Livre, Rápida e Sem Anúncios. Aplicativo oficial para Google Chrome, Computadores (PC/Mac/Linux) e Dispositivos Móveis.',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['education', 'books', 'reference', 'entertainment', 'lifestyle'],
          shortcuts: [
            {
              name: 'Página Inicial',
              short_name: 'Início',
              description: 'Abrir a página principal da WikiWorldWeb',
              url: '/',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Pesquisar Artigos',
              short_name: 'Pesquisar',
              description: 'Buscar verbetes e documentos da enciclopédia',
              url: '/?uid=search',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Previsão do Tempo',
              short_name: 'Tempo',
              description: 'Previsão meteorológica global em tempo real',
              url: '/?uid=Special:Weather',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Google Acadêmico',
              short_name: 'Acadêmico',
              description: 'Pesquisa acadêmica e científica avançada',
              url: '/?uid=Special:Scholar',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Caderno IA Gemini',
              short_name: 'Caderno IA',
              description: 'Síntese de fontes com inteligência artificial',
              url: '/?view=notebook',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          importScripts: ['/sw-push.js'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: [
            'index.html',
            'favicon.svg',
            'icon.svg',
            'apple-touch-icon.png',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'assets/index-*.css',
            'assets/index-*.js',
            'assets/vendor-react-*.js',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*(?:\.js|\.css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'wikizero-chunks-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('/node_modules/')) {
              if (
                normalized.includes('/node_modules/react/') ||
                normalized.includes('/node_modules/react-dom/') ||
                normalized.includes('/node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              if (normalized.includes('/node_modules/firebase/') || normalized.includes('/node_modules/@firebase/')) {
                return 'vendor-firebase';
              }
              if (normalized.includes('/node_modules/katex/')) {
                return 'vendor-katex';
              }
              if (normalized.includes('/node_modules/minisearch/')) {
                return 'vendor-minisearch';
              }
              if (normalized.includes('/node_modules/lucide-react/')) {
                return 'vendor-icons';
              }
              if (normalized.includes('/node_modules/@google/genai/')) {
                return 'vendor-genai';
              }
              if (
                normalized.includes('/node_modules/framer-motion/') ||
                normalized.includes('/node_modules/motion/') ||
                normalized.includes('/node_modules/canvas-confetti/') ||
                normalized.includes('/node_modules/dompurify/') ||
                normalized.includes('/node_modules/diff/')
              ) {
                return 'vendor-ui-utils';
              }
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
        react: path.resolve(process.cwd(), 'node_modules/react'),
        'react-dom': path.resolve(process.cwd(), 'node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false as const,
      ws: false as const,
      watch: null,
    },
  };
});
