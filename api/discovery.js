/**
 * /api/discovery
 * Public discovery endpoint for Optimizely Opal.
 *
 * Opal calls this endpoint when you register a tool registry.
 * It MUST return JSON with a "functions" array describing each tool:
 * - name
 * - description
 * - parameters
 * - endpoint
 * - http_method
 *
 * We'll rewrite /discovery -> /api/discovery via vercel.json.
 */

export default function handler(req, res) {
  // CORS helps avoid issues during registry discovery in some environments
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  // Tool manifest. Opal will show this tool in the registry after discovery.
  return res.status(200).json({
    functions: [
      {
        name: "opal_openapi_surface_map",
        description:
          "Fetch an OpenAPI/Swagger spec (JSON or YAML) and return a normalized API surface map: base URLs, auth schemes, and endpoints.",
        parameters: [
          {
            name: "spec_url",
            type: "string",
            description: "Public URL to an OpenAPI/Swagger spec (JSON or YAML).",
            required: true
          }
        ],
        endpoint: "/tools/opal_openapi_surface_map",
        http_method: "POST",
        auth_requirements: []
      }
    ]
  });
}
