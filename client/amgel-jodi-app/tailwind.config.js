/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "myColor": {
          "50": "#f6effe",
          "100": "#ede0fc",
          "200": "#dcc1f9",
          "300": "#caa1f7",
          "400": "#b982f4",
          "500": "#a763f1",
          "600": "#864fc1",
          "700": "#643b91",
          "800": "#432860",
          "900": "#211430"
        }
      }
    }
  },
  plugins: [],
}

