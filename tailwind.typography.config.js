/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: "var(--text-link-color)",
            },
            strong: {
              color: "var(--text-link-color)",
            },
            headings: {
              fontFamily: "Nobile",
            },
          },
        },
      },
    },
  },
};
