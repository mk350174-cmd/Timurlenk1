/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Timurlenk brand palette — inspired by Timurid era turquoise & gold.
        timur: {
          50: '#f3f7f7',
          100: '#dceaea',
          200: '#bcd6d8',
          300: '#8fb9bd',
          400: '#5d949b',
          500: '#427980',
          600: '#3a636c',
          700: '#33535b',
          800: '#2f464d',
          900: '#2b3c42',
          950: '#17262b',
        },
        // v1.1 brand: Gold #D4AF37 + Dark Brown #3E2723.
        gold: {
          300: '#f4d58d',
          400: '#e6c25a',
          500: '#D4AF37', // brand primary
          600: '#C9A227', // brand hover
        },
        brown: {
          700: '#5a3a30',
          800: '#3E2723', // brand secondary
          900: '#1B0E07', // deep text
        },
        cream: '#F5F1DE',
        royal: '#1E3A8A',
        crimson: '#DC2626',
        board: {
          light: '#e8d6b3',
          dark: '#a9714b',
          highlight: '#f6e05e',
          lastmove: '#9ae6b4',
          select: '#90cdf4',
        },
      },
      fontFamily: {
        // v1.1 typography: Playfair Display (headings) + Inter (body) + JetBrains Mono (notation).
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        pop: 'pop 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
