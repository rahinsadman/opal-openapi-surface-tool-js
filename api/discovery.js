/**
 * Opal Tool Registry Discovery endpoint
 * - Lists all tools for Opal to consume.
 */

export default function handler(req, res) {
  // Basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  
  return res.status(200).json({
    // Metadata fields.
    name: "opal-custom-tools",
    version: "1.0.0",
    description:
      "Custom Opal tools: OpenAPI surface mapping + capability coverage matrix.",

    // IMPORTANT: parameters MUST be an array of objects
    functions: [
      {
        name: "opal_openapi_surface_map",
        description:
          "Fetches an OpenAPI/Swagger spec from spec_url and returns a normalized endpoint inventory + auth hints.",
        http_method: "POST",
        endpoint: "/tools/opal_openapi_surface_map",
        parameters: [
          {
            name: "spec_url",
            type: "string",
            required: true,
            description:
              "Public URL to an OpenAPI/Swagger spec file (JSON or YAML).",
          },
        ],
      },
      {
        name: "opal_capability_coverage_matrix",
        description:
          "From a single user_request, finds an OpenAPI/Swagger URL, extracts endpoints, and returns a capability-to-endpoint coverage matrix with evidence.",
        http_method: "POST",
        endpoint: "/tools/opal_capability_coverage_matrix",
        parameters: [
          {
            name: "user_request",
            type: "string",
            required: true,
            description:
              "Single raw request text containing integration goals, capabilities, constraints, and an OpenAPI/Swagger URL.",
          },
          {
            name: "max_capabilities",
            type: "number",
            required: false,
            description:
              "Optional: cap the number of extracted capabilities (default 25).",
          },
          {
            name: "max_evidence_per_capability",
            type: "number",
            required: false,
            description:
              "Optional: cap evidence matches per capability (default 3).",
          },
        ],
      },
    ],
  });
}
