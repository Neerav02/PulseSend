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
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 1px 2px rgba(18, 22, 31, 0.12)',
        'highlight-hover': 'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 2px 5px rgba(18, 22, 31, 0.16)',
        'highlight-active': 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}

