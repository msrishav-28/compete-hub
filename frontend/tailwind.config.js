/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // "Toxic Void" Palette from visual-revamp.md
        neon: {
          limit: '#a3e635', // Reactor Lime
          black: '#050505', // Void Black
          white: 'rgba(255, 255, 255, 0.9)', // Hologram White
          grey: '#1A1A1A', // HUD Grey
        },
        signal: {
          green: '#22c55e', // Solid Lime / Active
          amber: '#f59e0b', // Amber Warning
          red: '#ef4444',   // Critical Pulse
          gold: '#eab308',  // Hiring / Recruitment
        },
        brand: {
          lime: '#a3e635',
          black: '#050505',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-size': '40px 40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-critical': 'pulseCritical 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseCritical: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px 5px rgba(239, 68, 68, 0.6)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(163, 230, 53, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(163, 230, 53, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'chamfer': '0.75rem 0.75rem 0.75rem 0', // Chamfered bottom-right
        'chamfer-tr': '0.75rem 0 0.75rem 0.75rem', // Chamfered top-right
      },
    },
  },
  plugins: [],
}
