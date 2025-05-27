/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
    
    
      colors: {
        chat: {
         bg:     '#e8fbf0',   // arrière-plan général
         bubble: '#ffffff',   // bulles reçues
         mine:   '#ffd7e5',   // bulles envoyées
         accent: '#ff4f9d',   // rose accent (boutons)
       },
     },


      /* ---------- Couleurs de marque ---------- */
      colors: {
        primary:   '#f55057', // rose Vivaya
        secondary: '#ffcf00', // jaune
        accent:    '#22d3ee', // turquoise clair
        neutral:   '#64748b', // gris texte
        surface:   '#ffffff',
        'surface-muted': '#f9fafb',
      },

      /* ---------- Police ---------- */
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },

      /* ---------- Dégradé “flow” ---------- */
      backgroundImage: {
        flow:
          'linear-gradient(180deg,\
            #d1fff0 0%,\
            #b9f7e8 25%,\
            #a9f0e4 50%,\
            #97eae0 75%,\
            #a3ede2 100%)',
      },

      /* ---------- Ombres réutilisables ---------- */
      boxShadow: {
        card: '0 10px 40px -10px rgba(0,0,0,.15)',
      },
    },
  },
  plugins: [],
};
