export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B3A6B",
        navyDark: "#122748",
        gold: "#C9A84C",
        cream: "#F8F6F1",
      },
      fontFamily: {
        heading: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
