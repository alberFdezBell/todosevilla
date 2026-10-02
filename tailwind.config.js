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
        sevilla: {
          albero: '#E5A638',
          'albero-dark': '#C68B25',
          carmesi: '#A81C24',
          'carmesi-dark': '#831218',
          terracota: '#D95D39',
          azulejo: '#1D4ED8',
          albero50: '#FDF9F0',
        },
      },
    },
  },
  plugins: [],
}
