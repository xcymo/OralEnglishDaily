/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-2': 'rgb(var(--brand-2) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px -12px rgb(var(--shadow) / 0.12)',
        lift: '0 12px 32px -12px rgb(var(--shadow) / 0.28)',
        nav: '0 -8px 30px -18px rgb(var(--shadow) / 0.35)',
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'pop': {
          '0%': { transform: 'scale(.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'confetti': {
          '0%': { transform: 'translate3d(0,-20px,0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate3d(var(--dx), 220px, 0) rotate(var(--rot))', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in .25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'wave': 'wave 1s ease-in-out infinite',
        pop: 'pop .45s cubic-bezier(0.22, 1, 0.36, 1) both',
        confetti: 'confetti 1.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
