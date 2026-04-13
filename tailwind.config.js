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
        red: {
          500: '#E24B4A',
          100: '#FCEBEB',
          900: '#791F1F',
        },
        amber: {
          500: '#BA7517',
          100: '#FAEEDA',
          900: '#633806',
        },
        blue: {
          600: '#185FA5',
          100: '#E6F1FB',
          900: '#0C447C',
        },
      },
    },
  },
  plugins: [],
}
