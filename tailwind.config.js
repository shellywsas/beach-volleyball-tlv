/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tlv: {
          pink: '#E91E63',
          pinkHover: '#D81B60',
          pinkLight: '#FCE4EC',
          navy: '#161444',
          navyDark: '#0D0C2B',
          navyLight: '#262261',
          teal: '#22C8D6',
          tealDark: '#00A0B0',
          tealLight: '#E0F7FA',
          yellow: '#FFDF00',
          yellowDark: '#E5C700',
        }
      },
      fontFamily: {
        sans: ['Assistant', 'Heebo', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
