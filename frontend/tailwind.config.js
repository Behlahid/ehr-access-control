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
        heading: ['"Figtree"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // UI/UX Pro Max Clinical Token Set
        clinical: {
          primary: '#0284C7',
          secondary: '#0891B2',
          accent: '#16A34A',
          destructive: '#DC2626',
          bgLight: '#F0F9FF',
          fgLight: '#0C4A6E',
          cardLight: '#FFFFFF',
          borderLight: '#BAE6FD',
          mutedLight: '#E8F2F8',
          emerald: '#10b981',
          emeraldDark: '#059669',
          cyan: '#06b6d4',
          sapphire: '#0284c7',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#ef4444',
        },
        obsidian: {
          950: '#06080c',
          900: '#0b0f17',
          850: '#101522',
          800: '#161c2d',
          700: '#21293e',
        },
      },
      boxShadow: {
        'subtle-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.15)',
        'subtle-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.15)',
        'subtle-violet': '0 0 20px -5px rgba(139, 92, 246, 0.15)',
        'clinical-card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'clinical-float': '0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
      },
    },
  },
  plugins: [],
};
