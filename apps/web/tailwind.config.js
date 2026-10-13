/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#C9A961',
          hover: '#A8894A',
          light: '#E5C97E',
          soft: '#FAF5E6',
          foreground: '#1F2937',
        },
        secondary: {
          DEFAULT: '#1F2937',
          foreground: '#FFFFFF',
        },
        blue: {
          50: '#FAF5E6',
          100: '#F5EBD0',
          200: '#E5C97E',
          300: '#DFBB5F',
          400: '#D4AF37',
          500: '#C9A961',
          600: '#C9A961',
          700: '#A8894A',
          800: '#8B7140',
          900: '#6B5735',
          950: '#4A3C25',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: '#ffffff' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
    },
  },
  plugins: [],
};
