import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat all media-chrome elements as custom elements
          isCustomElement: (tag) => tag.startsWith("media-"),
        },
      },
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "/vidapp/" : "/",
});
