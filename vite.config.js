import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function panchayatDevApi() {
  return {
    name: "panchayat-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/panchayat", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const env = loadEnv(server.config.mode, server.config.root, "");
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Set ANTHROPIC_API_KEY in .env.local for local AI" }));
          return;
        }

        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify(body),
            });
            const data = await response.json();
            res.setHeader("Content-Type", "application/json");
            res.statusCode = response.status;
            res.end(JSON.stringify(data));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to reach Anthropic API" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), panchayatDevApi()],
});
