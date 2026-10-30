/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_BASE_PLACEHOLDER = "REPLACE-WITH-ALB-DNS";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  if (env.VITE_USE_MOCK === "false" && (env.VITE_API_BASE ?? "").includes(API_BASE_PLACEHOLDER)) {
    throw new Error(`Set VITE_API_BASE in .env.${mode} to http://<ALB DNS name>/api (or /api when EC2 serves dist/) before building.`);
  }
  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
