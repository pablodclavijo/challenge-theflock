/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './Pages/**/*.cshtml',
    './Views/**/*.cshtml',
    './wwwroot/**/*.html',
    './wwwroot/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#667eea',
          end: '#764ba2',
        },
      },
    },
  },
  plugins: [],
}
