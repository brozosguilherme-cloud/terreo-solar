/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Nix — extraída das telas do app:
        // fundo claro quente, tinta quase-preta e dourado/âmbar de destaque
        cream: '#F6F4F1',
        ink: {
          DEFAULT: '#171512',
          soft: '#57534E',
          faint: '#A8A29E',
        },
        gold: {
          50: '#FCF5EA',
          100: '#F8E8CE',
          200: '#F1D5A4',
          300: '#EABE74',
          400: '#E3A94E',
          500: '#DA9433',
          600: '#C07C26',
          700: '#9A6120',
          800: '#7C4E20',
          900: '#66401E',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -6px rgb(23 21 18 / 0.08)',
        float: '0 24px 60px -12px rgb(23 21 18 / 0.18)',
      },
    },
  },
  plugins: [],
}
