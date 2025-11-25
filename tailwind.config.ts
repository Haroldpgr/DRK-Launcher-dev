import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        dark: '#000000',
        graysoft: '#111113'
      },
      borderRadius: {
        xl: '14px'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
} satisfies Config
