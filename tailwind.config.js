import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#14b8a6',
          hover:   '#0d9488',
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
  plugins: [
    // Use `fine-hover:` instead of `hover:` for hover states that should
    // only fire on devices with a real pointer (not touch tap-hover).
    // Example: `fine-hover:bg-white/[0.05]`
    plugin(function({ addVariant }) {
      addVariant('fine-hover', '@media (hover: hover) and (pointer: fine) { &:hover }');
    }),
  ],
};
