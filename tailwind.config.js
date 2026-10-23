/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/calendarkit-pro/**/*.{js,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FDFBF7',       // Meleg krém / törtfehér háttér
          card: '#FFFFFF',     // Tiszta fehér a kártyáknak
          text: '#4A403A',     // Lágy, meleg mélybarna/szürkés szöveg
          muted: '#8C7E75',    // Halványabb segédszövegek
          primary: '#D88C9A',  // Púderrózsa / mályvás fő gombszín
          primaryHover: '#C77585',
        },
        pastel: {
          rose: '#F4D8CD',     // Lágy barackos rózsaszín
          sage: '#D4E0D6',     // Nyugtató zsályazöld
          lavender: '#E2D9E8', // Pasztell levendula
          sand: '#EFE6DD',     // Meleg homokszín
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}