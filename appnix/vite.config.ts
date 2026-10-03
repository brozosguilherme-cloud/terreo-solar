import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Build WEB (site + landing page com o app embutido num DeviceFrame).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
});
