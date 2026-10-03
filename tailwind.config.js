/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f3d044',
          strong: '#f3d044',
          hover: '#e5c234',
          dark: '#d4b123',
          soft: '#fff3c4',
          chip: '#fff7d1',
          chipBorder: '#ecd37b',
          bg: '#f5f7fb',
          text: '#17212b',
          muted: '#516173',
          border: '#d7e0ea',
        },
        sevilla: {
          albero: '#f3d044',
          'albero-dark': '#d4b123',
          carmesi: '#A81C24',
          'carmesi-dark': '#831218',
          terracota: '#D95D39',
          azulejo: '#0b67d1',
          albero50: '#fff7d1',
        },
      },
    },
  },
  plugins: [],
}
