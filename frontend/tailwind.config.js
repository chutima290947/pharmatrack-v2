/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        primarySoft: '#dbeafe',

        surface: '#f8fafc',
        card: '#ffffff',

        borderSoft: '#e2e8f0',

        textMain: '#0f172a',
        textSoft: '#64748b',

        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',

        calendarHover: '#eff6ff',
      },

      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },

      boxShadow: {
        soft: '0 2px 10px rgba(15, 23, 42, 0.04)',
        card: '0 4px 20px rgba(15, 23, 42, 0.06)',
      },

      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}