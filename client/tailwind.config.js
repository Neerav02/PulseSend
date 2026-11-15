/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAF8F5',
          soft: '#F4EFEA',
          white: '#FFFFFF',
        },
        border: {
          soft: '#EAE6DF',
          card: '#E4DFD7',
        },
        ink: {
          DEFAULT: '#151922',
          sidebar: '#131720',
          muted: '#5A6270',
          subtle: '#8E95A2',
        },
        highlight: {
          DEFAULT: '#FF5733',
          hover: '#E84A26',
          subtle: 'rgba(255, 87, 51, 0.08)',
          border: 'rgba(255, 87, 51, 0.25)',
        },
        status: {
          ok: '#0D9488',
          warn: '#D97706',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 6px 18px rgba(0, 0, 0, 0.04)',
        highlight: '0 4px 14px rgba(255, 87, 51, 0.35)',
      }
    },
  },
  plugins: [],
}

