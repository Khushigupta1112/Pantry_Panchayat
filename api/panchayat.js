const VALID_ANTHROPIC_MODELS = new Set([
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-7-sonnet-20250219",
  "claude-sonnet-4-20250514",
]);

function resolveAnthropicModel(body = {}) {
  const requested = body.model;
  return requested && VALID_ANTHROPIC_MODELS.has(requested) ? requested : "claude-3-5-sonnet-20241022";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return res.status(400).json({
      error: {
        message: "ANTHROPIC_API_KEY is not configured on Vercel.",
        isMissingKey: true,
      },
    });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        ...body,
        model: resolveAnthropicModel(body),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        data?.error?.message || data?.message || (typeof data?.error === "string" ? data.error : "Anthropic request failed.");
      return res.status(response.status).json({
        error: {
          type: data?.error?.type || "anthropic_error",
          message: errorMessage,
        },
      });
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Anthropic proxy error", err);
    return res.status(500).json({ error: { message: "Failed to reach Anthropic API" } });
  }
}
