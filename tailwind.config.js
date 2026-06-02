/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tize-blue': '#0A2F7A',
        'tize-dark': '#041F5A',
        'tize-gold': '#C89B3C',
        'tize-light': '#F5F7FB',
      },
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
