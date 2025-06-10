import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'burbank': ['Burbank Big Condensed', 'Arial Black', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        'burbank': '600',
      },
    },
  },
  plugins: [],
} satisfies Config;
