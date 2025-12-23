/**
 * Opal Tool Registry Discovery endpoint
 * - Lists all tools (functions) exposed by this Vercel deployment.
 * - Opal uses this to discover and register available tool functions.
 */

export default function handler(req, res) {
  // Basic CORS (safe for discovery)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  return res.status(200).json({
    name: "opal-custom-tools",
    version: "1.0.0",
    description:
      "Custom Opal tools hosted on Vercel: OpenAPI surface mapping + capability coverage matrix.",
    functions: [
      {
        name: "opal_openapi_surface_map",
        description:
          "Fetches an OpenAPI/Swagger spec from spec_url and returns a normalized endpoint inventory + auth hints.",
        http_method: "POST",
        endpoint: "/tools/opal_openapi_surface_map",
        parameters: {
          type: "object",
          properties: {
            spec_url: {
              type: "string",
              description:
                "Public URL to an OpenAPI/Swagger spec file (JSON or YAML).",
            },
          },
          required: ["spec_url"],
        },
      },
      {
        name: "opal_capability_coverage_matrix",
        description:
          "From a single user_request, finds an OpenAPI/Swagger URL, extracts endpoints, and returns a capability-to-endpoint coverage matrix with evidence.",
        http_method: "POST",
        endpoint: "/tools/opal_capability_coverage_matrix",
        parameters: {
          type: "object",
          properties: {
            user_request: {
              type: "string",
              description:
                "Single raw request text containing integration goals, capabilities, constraints, and (ideally) an OpenAPI/Swagger URL.",
            },
            max_capabilities: {
              type: "number",
              description:
                "Optional: cap the number of extracted capabilities (default 25).",
            },
            max_evidence_per_capability: {
              type: "number",
              description:
                "Optional: cap evidence matches per capability (default 3).",
            },
          },
          required: ["user_request"],
        },
      },
    ],
  });
}
