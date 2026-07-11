import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        'on-primary': '#FFFFFF',
        secondary: '#3B82F6',
        accent: '#D97706',
        background: '#F8FAFC',
        foreground: '#1E3A8A',
        muted: '#E9EEF6',
        border: '#DBEAFE',
        destructive: '#DC2626',
      },
      fontFamily: {
        sans: ['Fira Sans', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
