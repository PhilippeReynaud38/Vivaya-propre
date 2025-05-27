/** @type {import('tailwindcss').Config} */
module.exports = {
  /* ------------------------------------------------------------------------
     Où Tailwind scanne nos classes
  -------------------------------------------------------------------------*/
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],

  /* ------------------------------------------------------------------------
     Thème étendu
  -------------------------------------------------------------------------*/
  theme: {
    extend: {
      /* ---------- Couleurs Vivaya (palette actuelle) ---------- */
      colors: {
        primary:   '#f55057', // rose Vivaya
        secondary: '#ffcf00', // jaune
        accent:    '#22d3ee', // turquoise clair
        neutral:   '#64748b', // gris texte
        surface:         '#ffffff',
        'surface-muted': '#f9fafb',

        /* ---------- Palette “brand” pastel (thème FUN) ---------- */
        brand: {
          50:  '#f5fff9',
          100: '#e4fdf0',
          200: '#c7f5e0',
          300: '#a5ebcf',
          400: '#83ddbe',
          500: '#60cfa8',   // teinte principale
          600: '#45b58c',
          700: '#348e6c',
          800: '#23634a',
          900: '#123824',
        },
      },

      /* ---------- Police ---------- */
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },

      /* ---------- Dégradé “flow” (fond de chat) ---------- */
      backgroundImage: {
        flow: `linear-gradient(
          180deg,
          #d1fff0 0%,
          #b9f7e8 25%,
          #a9f0e4 50%,
          #97eae0 75%,
          #a3ede2 100%
        )`,
      },

      /* ---------- Ombres réutilisables ---------- */
      boxShadow: {
        card: '0 10px 40px -10px rgba(0,0,0,.15)',
      },
    },
  },

  /* ------------------------------------------------------------------------
     Plugins
     – ici un mini-plugin interne pour générer .bg-var-[name] si besoin
  -------------------------------------------------------------------------*/
  plugins: [
    /**
     * .bg-var-[name]  =>  background-color: var(--name)
     * .text-var-[name] => color: var(--name)
     */
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'bg-var': (value) => ({ backgroundColor: `var(--${value})` }),
          'text-var': (value) => ({ color: `var(--${value})` }),
        },
        { values: theme('colors') }
      );
    },
  ],
};
