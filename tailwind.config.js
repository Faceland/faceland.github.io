/** @type {import('tailwindcss').Config} */
const withMT = require('@material-tailwind/react/utils/withMT');

module.exports = withMT({
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      chambray: '#3B5998',
      'san-marino': '#4C6DB1',
      // Shuffle gradients
      'aubergine': '#380707',
      'aubergine-end': '#130505',
      'black-forest': '#132c09',
      'black-forest-end': '#091305',
      'gordons-green': '#1a2f0e',
      'gordons-green-end': '#101c0b',
      'murder-brown': '#14193f',
      'murder-brown-end': '#0f132d',
      'kilamanjaro': '#2c0d01',
      'kilamanjaro-end': '#1E0802',
    },
    extend: {},
  },
  plugins: [],
});
