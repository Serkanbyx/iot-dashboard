import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/iot_dashboard_test",
      JWT_SECRET: "test-jwt-secret-key-min-32-chars-long",
      JWT_EXPIRES_IN: "1h",
    },
  },
});
