/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1B2D",
        muted: "#6B7A90",
        accent: {
          DEFAULT: "#2F6FEF",
          dark: "#1D4FCB",
          light: "#5B8DF7",
        },
        surface: "#F0F6FF",
        border: "#E4ECFB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 60px -15px rgba(47,111,239,0.35)",
        card: "0 10px 30px -12px rgba(15,27,45,0.12)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.95" },
        },
        "ping-slow": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 4s ease-in-out infinite",
        "pulse-slow": "pulse-slow 5s ease-in-out infinite",
        "ping-slow": "ping-slow 3s ease-out infinite",
        "ping-slower": "ping-slow 3s ease-out infinite 1s",
        "gradient-x": "gradient-x 4s ease infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
}
