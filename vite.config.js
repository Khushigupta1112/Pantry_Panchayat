import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function panchayatDevApi() {
  const middleware = (server) => (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: { message: "Method not allowed" } }));
      return;
    }

    const env = loadEnv(server.config.mode, server.config.root, "");
    const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: {
            message: "Set a valid ANTHROPIC_API_KEY in .env.local to call Anthropic AI.",
            isMissingKey: true,
          },
        })
      );
      return;
    }

    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const model =
          body?.model &&
          [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-7-sonnet-20250219",
            "claude-sonnet-4-20250514",
          ].includes(body.model)
            ? body.model
            : "claude-3-5-sonnet-20241022";

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({ ...body, model }),
        });
        const data = await response.json().catch(() => ({}));
        res.setHeader("Content-Type", "application/json");
        res.statusCode = response.status;
        if (!response.ok) {
          const errorMessage =
            data?.error?.message || data?.message || typeof data?.error === "string" ? data.error : "Anthropic request failed.";
          res.end(JSON.stringify({ error: { message: errorMessage } }));
        } else {
          res.end(JSON.stringify(data));
        }
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: { message: "Failed to reach Anthropic API" } }));
      }
    });
  };

  return {
    name: "panchayat-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/panchayat", middleware(server));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/panchayat", middleware(server));
    },
  };
}

export default defineConfig({
  plugins: [react(), panchayatDevApi()],
});
