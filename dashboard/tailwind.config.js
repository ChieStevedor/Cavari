/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:        '#0F0F0F',
        ivory:      '#F5F3EF',
        gold:       '#C6A87D',
        'gold-dim': '#A8895F',
        stone:      '#9E9890',
        dim:        '#1A1A1A',
        surface:    '#161616',
        border:     '#2A2A2A',
        // Segment colours
        luminaire:  '#C6A87D',
        rising:     '#4A7C59',
        dormant:    '#9E9890',
        cold:       '#6B7280',
        // Status
        amber:      '#D97706',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Jost', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.65rem',
      },
    },
  },
  plugins: [],
}
