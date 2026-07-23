/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-cream': '#FBF9F5',
        'green-primary': '#4A7856',
        'green-dark': '#3A5F44',
        'mostaza': '#E9B44C',
        'lavanda': '#9B89B3',
        'text-dark': '#2D2D2D',
        'text-muted': '#6B7280',
        'border-light': '#E5E1DB',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
};
