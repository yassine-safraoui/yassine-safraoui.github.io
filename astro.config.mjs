// @ts-check

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	integrations: [react(), icon()],

	vite: {
		plugins: [tailwindcss()],
	},
});
