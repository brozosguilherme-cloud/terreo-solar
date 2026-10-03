import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

// Build APP (Capacitor/Android). Só o index.app.html entra no bundle:
// nenhuma landing page ou rota de site vai para dentro do APK/AAB.
// O Capacitor carrega `index.html` do webDir: renomeia a saída do entrypoint do app.
const renameAppHtml = (): Plugin => ({
  name: 'appnix-rename-app-html',
  apply: 'build',
  closeBundle() {
    const from = resolve(import.meta.dirname, 'dist-app/index.app.html');
    if (existsSync(from)) renameSync(from, resolve(import.meta.dirname, 'dist-app/index.html'));
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), renameAppHtml()],
  base: './',
  server: { open: '/index.app.html' },
  build: {
    outDir: 'dist-app',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'index.app.html'),
    },
  },
});
