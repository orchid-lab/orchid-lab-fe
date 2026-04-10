import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🌺 ORCHID LAB Primary Brand Colors
        orchid: {
          50: '#FCEEF2',   // Orchid Pale
          100: '#F5D0DB',  // Orchid Lighter
          200: '#E85D75',  // Orchid Light
          500: '#C41E3A',  // Orchid Primary (Ruby Deep)
          600: '#A81830',  // Orchid Dark
          700: '#8B1628',  // Orchid Darker
          900: '#5A0F18',  // Orchid Darkest
        },

        // 🟢 SUCCESS - Green (Sage/Forest)
        success: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          500: '#1F7E56',
          600: '#1B6E46',
          700: '#165E38',
          900: '#0D3B27',
        },

        // 🟡 WARNING - Amber
        warning: {
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          900: '#78350F',
        },

        // 🔴 ERROR - Red
        error: {
          50: '#FEE2E2',
          100: '#FECACA',
          200: '#FCA5A5',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          900: '#7F1D1D',
        },

        // 🔵 INFO - Indigo Blue
        info: {
          50: '#EBF2FB',
          100: '#D8E9F8',
          200: '#BCDAF5',
          500: '#2C5AA0',
          600: '#1E4A8B',
          700: '#153B76',
          900: '#0C2652',
        },

        // 🟣 SECONDARY - Soft Purple (Orchid complement)
        purple: {
          50: '#F3E7FA',
          100: '#E7CFF5',
          200: '#DBB7F0',
          500: '#7B68A6',
          600: '#6E549A',
          700: '#61408E',
          900: '#3D2666',
        },

        // ⚪ NEUTRAL - Grays (Pro Max subtle)
        neutral: {
          50: '#F9FAFB',  // Ghost white
          100: '#F3F4F6', // Light gray
          150: '#EEEEEE', // Ultra light
          200: '#E5E7EB', // Border color
          300: '#D1D5DB',
          400: '#9CA3AF', // Secondary text
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151', // Primary text
          800: '#1F2937', // Dark text
          900: '#111827', // Almost black
        },

        // 🎨 Additional colors
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',
      },

      backgroundColor: {
        'primary': '#C41E3A',
        'primary-hover': '#A81830',
        'primary-active': '#8B1628',
        'surface': '#FFFFFF',
        'surface-secondary': '#F9FAFB',
        'surface-tertiary': '#F3F4F6',
      },

      textColor: {
        'primary': '#374151',
        'secondary': '#9CA3AF',
        'accent': '#C41E3A',
      },

      borderColor: {
        'primary': '#E5E7EB',
        'accent': '#C41E3A',
      },

      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },

      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'lg': '0 20px 25px rgba(0, 0, 0, 0.2)',
        'xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
        
        // Pro Max - Subtle shadows
        'pro-sm': '0 1px 2px rgba(196, 30, 58, 0.05)',
        'pro-md': '0 2px 8px rgba(196, 30, 58, 0.2)',
        'pro-lg': '0 4px 12px rgba(196, 30, 58, 0.3)',
        
        // Dark mode
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },

      spacing: {
        '0': '0',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },

      fontSize: {
        'xs': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'base': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'xl': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        '2xl': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        '3xl': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
      },

      fontFamily: {
        'display': ['"Inter"', '"Segoe UI"', '-apple-system', 'system-ui', 'sans-serif'],
        'sans': [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Roboto"',
          '"Oxygen"',
          '"Ubuntu"',
          '"Cantarell"',
          'sans-serif',
        ],
        'mono': ['"Fira Code"', '"Monaco"', '"Courier New"', 'monospace'],
      },

      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },

      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.05em',
        'wider': '0.1em',
      },

      opacity: {
        '0': '0',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '100': '1',
      },

      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },

  darkMode: 'class',

  plugins: [
    // Custom plugin cho Pro Max spacing và utilities
    function ({ addUtilities, theme }) {
      const colors = theme('colors');
      
      addUtilities({
        '.text-primary': { color: colors.neutral['700'] },
        '.text-secondary': { color: colors.neutral['400'] },
        '.bg-surface': { backgroundColor: colors.white },
        '.bg-surface-secondary': { backgroundColor: colors.neutral['50'] },
        '.border-primary': { borderColor: colors.neutral['200'] },
        '.border-accent': { borderColor: colors.orchid['500'] },

        '.shadow-pro-sm': { boxShadow: '0 1px 2px rgba(196, 30, 58, 0.05)' },
        '.shadow-pro-md': { boxShadow: '0 2px 8px rgba(196, 30, 58, 0.2)' },
        '.shadow-pro-lg': { boxShadow: '0 4px 12px rgba(196, 30, 58, 0.3)' },

        '.transition-smooth': {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      });
    },
  ],
} satisfies Config;
