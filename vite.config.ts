import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],

  test: {
    expect: { requireAssertions: true },

    projects: [
      {
        extends: "./vite.config.ts",

        test: {
          name: "client",

          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }]
          },

          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"]
        }
      },

      {
        extends: "./vite.config.ts",

        test: {
          name: "server",
          environment: "node",
          include: [
            "src/**/*.{test,spec}.{js,ts}",
            "tests/convex/**/*.{test,spec}.{js,ts}",
            "tests/lib/**/*.{test,spec}.{js,ts}"
          ],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"]
        }
      },

      {
        extends: "./vite.config.ts",

        test: {
          name: "tests-dom",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/components/**/*.{test,spec}.{js,ts}"]
        }
      }
    ]
  }
});
