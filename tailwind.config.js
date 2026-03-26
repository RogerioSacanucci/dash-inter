/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#ff0050',
          hover:   '#e0003f',
        },
        canvas:  '#0d0d0e',
        surface: {
          1: '#131316',
          2: '#1c1c20',
        },
        method: {
          mbway:       '#6366f1',  // indigo-500
          multibanco:  '#f59e0b',  // amber-500
        },
      },
    },
  },
  plugins: [],
};
