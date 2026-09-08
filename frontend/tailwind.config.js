/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#06080c',
          900: '#0b0f17',
          850: '#101522',
          800: '#161c2d',
          700: '#21293e',
        },
        clinical: {
          emerald: '#10b981',
          emeraldDark: '#059669',
          cyan: '#06b6d4',
          sapphire: '#0284c7',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#ef4444',
        },
      },
      boxShadow: {
        'subtle-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.15)',
        'subtle-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.15)',
        'subtle-violet': '0 0 20px -5px rgba(139, 92, 246, 0.15)',
      },
    },
  },
  plugins: [],
};
