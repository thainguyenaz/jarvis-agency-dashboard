import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jarvis-bg': '#0f1218',
        'jarvis-surface': '#181d28',
        'jarvis-border': '#252d3a',
        'jarvis-cyan': '#8bb4cc',
        'jarvis-green': '#6bc993',
        'jarvis-red': '#d97070',
        'jarvis-yellow': '#d4a84b',
        'jarvis-purple': '#9b7ed8',
        'jarvis-text': '#dcd8d2',
        'jarvis-dim': '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
export default config
