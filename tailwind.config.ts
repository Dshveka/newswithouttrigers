import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f7f7",
        ink: "#111111",
        muted: "#5c5c5c",
        line: "#d0d0d0"
      }
    }
  },
  plugins: []
};

export default config;
