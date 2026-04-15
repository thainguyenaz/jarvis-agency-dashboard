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
        'jarvis-bg': '#0a0e1a',
        'jarvis-surface': '#111827',
        'jarvis-border': '#1e293b',
        'jarvis-cyan': '#00e5ff',
        'jarvis-green': '#00ff88',
        'jarvis-red': '#ff4444',
        'jarvis-yellow': '#ffd700',
        'jarvis-purple': '#7c3aed',
        'jarvis-text': '#e2e8f0',
        'jarvis-dim': '#64748b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
export default config
