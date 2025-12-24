import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/renderer/**/*.{ts,tsx}',
    './src/renderer/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8', // Un azul oscuro
        dark: '#050505',    // Un negro más intenso
        graysoft: '#1c1d1f'
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

