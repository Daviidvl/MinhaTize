/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Espelho dos tokens de src/index.css — os valores vivem só lá.
      colors: {
        navy: 'var(--navy)',
        cobalt: 'var(--cobalt)',
        azure: 'var(--azure)',
        sky: 'var(--sky)',
        ice: 'var(--ice)',
        mist: 'var(--mist)',
        midnight: 'var(--midnight)',
        indigo: 'var(--indigo)',
        teal: {
          DEFAULT: 'var(--teal)',
          d: 'var(--teal-d)',
          l: 'var(--teal-l)',
        },
        aqua: 'var(--aqua)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          bg: 'var(--amber-bg)',
          fill: 'var(--amber-fill)',
        },
        red: {
          DEFAULT: 'var(--red)',
          bg: 'var(--red-bg)',
          line: 'var(--red-line)',
        },
      },
      backgroundImage: {
        'g-hero': 'var(--g-hero)',
        'g-midnight': 'var(--g-midnight)',
        'g-cta': 'var(--g-cta)',
        'g-progress': 'var(--g-progress)',
        'g-ring': 'var(--g-ring)',
      },
      fontFamily: {
        'jakarta': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'ui-sans-serif', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      borderRadius: {
        '10': '10px',
        '16': '16px',
      },
    },
  },
  plugins: [],
}
