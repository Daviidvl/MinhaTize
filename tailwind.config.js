/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tize-dark-bg': '#0D0D12',
        'tize-purple': '#7C5CBF',
        'tize-lilac-1': '#A07FD8',
        'tize-lilac-2': '#C4A8F0',
        'tize-text': '#F0EFE9',
        'tize-text-secondary': 'rgba(240,239,233,0.45)',
        'tize-card-bg': 'rgba(255,255,255,0.04)',
        'tize-card-border': 'rgba(255,255,255,0.08)',
        'tize-warning-bg': 'rgba(239,159,39,0.08)',
      },
      fontFamily: {
        'jakarta': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'ui-sans-serif', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '10': '10px',
        '16': '16px',
      },
      backgroundColor: {
        'glass': 'rgba(255,255,255,0.04)',
        'glass-hover': 'rgba(255,255,255,0.06)',
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}
