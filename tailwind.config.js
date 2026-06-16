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
        gold: {
          300: '#f4d58d',
          400: '#eebf5a',
          500: '#e0a82e',
          600: '#c2871f',
        },
        board: {
          light: '#e8d6b3',
          dark: '#a9714b',
          highlight: '#f6e05e',
          lastmove: '#9ae6b4',
          select: '#90cdf4',
        },
      },
      fontFamily: {
        display: ['"Trebuchet MS"', 'Verdana', 'sans-serif'],
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
