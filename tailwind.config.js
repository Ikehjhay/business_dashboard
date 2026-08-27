/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F6F2",
        surface: "#FFFFFF",
        ink: "#1C2331",
        muted: "#5B6472",
        line: "#E4E1D8",
        accent: {
          DEFAULT: "#2F6F5E",
          soft: "#E7F0EC",
          dark: "#1F4E41",
        },
        warn: {
          DEFAULT: "#B8590A",
          soft: "#FBEDDD",
        },
        danger: {
          DEFAULT: "#B3261E",
          soft: "#FBE9E7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};
