import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/**
 * Tailwind CSS configuration for MixSmart.
 *
 * Scans Svelte/TS/JS/HTML files under src to generate utilities and
 * enables the standard forms/typography plugins.
 *
 * @type {import("tailwindcss").Config}
 */
const config = {
  content: ["./src/**/*.{html,js,ts,svelte}"],
  theme: {
    extend: {}
  },
  plugins: [forms, typography]
};

export default config;
