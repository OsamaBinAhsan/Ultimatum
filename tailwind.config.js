/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "!./app/api/**",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        arcade: {
          purple: '#9333ea',
          neon: '#06b6d4',
          pink: '#ec4899',
          yellow: '#eab308',
          dark: '#0f172a',
        },
        kitchen: {
          amber: '#d97706',
          orange: '#ea580c',
          warm: '#fef3c7',
        },
        lab: {
          cyan: '#0891b2',
          slate: '#334155',
          indigo: '#4f46e5',
        }
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
