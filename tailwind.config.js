/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        bg: '#0c0b09',
        surface: '#171614',
        surface2: '#211f1c',
        border: '#2a2825',
        accent: '#e9c46a',
        accent2: '#c9a84c',
        green: '#6fcf97',
        red: '#eb5757',
        blue: '#56ccf2',
        orange: '#f2994a',
        muted: '#6b6762',
        muted2: '#3d3b38',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.35s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateX(-8px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
