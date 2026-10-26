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
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // Stitch Clinical Precision Theme Tokens
        stitch: {
          primary: '#0891b2',
          primaryDark: '#00647c',
          primaryContainer: '#007f9d',
          secondary: '#059669',
          secondaryDark: '#006c4a',
          secondaryContainer: '#82f5c1',
          surface: '#f8f9ff',
          surfaceLow: '#eff4ff',
          surfaceContainer: '#e5eeff',
          surfaceHighest: '#d3e4fe',
          outline: '#6e797e',
          outlineVariant: '#bdc8ce',
          hairline: '#e2e8f0',
          darkBg: '#0b1c30',
          darkCard: '#0d1726',
        },
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
        'clinical-card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'clinical-float': '0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -4px rgba(15, 23, 42, 0.02)',
      },
    },
  },
  plugins: [],
};
