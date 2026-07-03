import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' permite hospedar o build em qualquer caminho (GitHub Pages, S3, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
