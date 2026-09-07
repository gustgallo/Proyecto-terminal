/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prodisa: {
          dark: "#0a0e17",
          card: "#121826",
          accent: "#0052CC",
          accentHover: "#003D99",
          steel: "#2A3447",
          text: "#E2E8F0",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
