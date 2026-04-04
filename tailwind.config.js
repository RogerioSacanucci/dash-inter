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
          DEFAULT: '#E8552A',
          hover:   '#F06838',
          text:    '#5E2312',
          subtle:  'rgba(232,85,42,0.10)',
          muted:   'rgba(232,85,42,0.50)',
        },
        canvas:  '#050505',
        'content-bg': '#0C0C0C',
        surface: {
          1: '#161616',
          2: '#202020',
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
