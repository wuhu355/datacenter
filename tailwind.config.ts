import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0a0e27',
          card: 'rgba(16, 20, 50, 0.8)',
          border: 'rgba(0, 212, 255, 0.15)',
          accent: '#00d4ff',
          purple: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
}
export default config
