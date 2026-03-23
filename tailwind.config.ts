import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TérreoSolar brand — centrado em #004254
        terreo: {
          '50':  '#e8f4f7',
          '100': '#c5e4ed',
          '200': '#9dd0e0',
          '300': '#6dbcd3',
          '400': '#3da5c3',
          '500': '#1a8aaa',
          '600': '#006d8c',
          '700': '#005570',
          '800': '#004254', // PRIMARY — cor da marca
          '900': '#002e3a',
          '950': '#001a21',
        },
        // Neutros refinados
        stone: {
          '50':  '#fafaf9',
          '100': '#f5f5f4',
          '200': '#e7e5e4',
          '300': '#d6d3d1',
          '400': '#a8a29e',
          '500': '#78716c',
          '600': '#57534e',
          '700': '#44403c',
          '800': '#292524',
          '900': '#1c1917',
          '950': '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
