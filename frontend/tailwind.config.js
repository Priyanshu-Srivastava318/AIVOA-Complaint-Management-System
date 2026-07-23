/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          500: '#3b6cf6',
          600: '#2b56dc',
          700: '#2144b3',
        },
      },
    },
  },
  plugins: [],
}
