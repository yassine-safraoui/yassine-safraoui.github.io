const typography = require('@tailwindcss/typography');

module.exports = {
	content: ['./hugo_stats.json'],
	plugins: [typography],
	important: true,
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				background: "var(--color-background)",
				"background-secondary": "var(--color-background-secondary)",
				text: "var(--color-text)",
				"text-secondary": "var(--color-text-secondary)",
				link: "var(--color-link)",
				primary: "var(--color-primary)",
				secondary: "var(--color-secondary)"
			}
		}
	}
};