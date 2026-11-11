/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060911',
          900: '#0b0f19',
          800: '#151c2e',
          700: '#1f2a44',
          border: '#2a3859'
        },
        cyan: {
          glow: '#00f3ff',
        },
        violet: {
          glow: '#9d4edd',
        },
        amber: {
          glow: '#ffb703',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}