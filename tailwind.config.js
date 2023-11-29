/** @type {import('tailwindcss').Config} */
const withMT = require('@material-tailwind/react/utils/withMT');

module.exports = withMT({
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      aubergine: '#2C0707',
      'black-forest': '#081104',
      chambray: '#3B5998',
      'gordons-green': '#111E0B',
      'murder-brown': '#090A20',
      kilamanjaro: '#1E0802',
      'san-marino': '#4C6DB1',
    },
    extend: {},
  },
  plugins: [],
});
