import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/playwright-report/**", "**/test-results/**", "TEMPORAL 1/**", "TEMPORAL 2/**"],
  },
];

export default config;
