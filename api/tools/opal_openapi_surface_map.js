/**
 * /api/tools/opal_openapi_surface_map
 *
 * Tool execution endpoint for Opti Opal.
 * /tools/opal_openapi_surface_map rewritten to /api/tools/opal_openapi_surface_map via vercel.json.
 *
 * Input JSON:
 * { "spec_url": "https://example.com/openapi.yaml" }
 *
 * Output JSON:
 * {
 *   "spec_url": "...",
 *   "surface_map": { api, base_urls, auth, endpoints, notes },
 *   "stats": { endpoint_count, auth_scheme_count, base_url_count }
 * }
 */

import yaml from "js-yaml";

/** CORS */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Optional Bearer auth for tool execution (NOT for /discovery).
 */
function enforceBearer(req, res) {
  const expected = process.env.OPAL_TOOL_BEARER_TOKEN;
  if (!expected) return true; // auth not enabled

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token && token === expected) return true;

  res.status(401).json({ error: "Unauthorized (bad or missing bearer token)" });
  return false;
}

/**
 * Fetch and parse OpenAPI content from URL.
 * - Try JSON first
 * - Fallback to YAML
 */
async function fetchSpec(specUrl) {
  const r = await fetch(specUrl, {
    method: "GET",
    headers: { accept: "application/json, text/yaml, */*" }
  });

  if (!r.ok) {
    throw new Error(`Failed to fetch spec_url: ${r.status} ${r.statusText}`);
  }

  const text = (await r.text()).trim();

  // JSON first
  if (text.startsWith("{") || text.startsWith("[")) {
    return JSON.parse(text);
  }

  // YAML fallback
  return yaml.load(text);
}

/** Extract auth schemes from OpenAPI components.securitySchemes */
function extractAuthSchemes(openapi) {
  const schemes = [];
  const sec = openapi?.components?.securitySchemes || {};
  for (const [name, def] of Object.entries(sec)) {
    schemes.push({
      name,
      type: def?.type || "unknown",
      in: def?.in || null,
      scheme: def?.scheme || null,
      bearerFormat: def?.bearerFormat || null,
      flows: def?.flows ? Object.keys(def.flows).sort() : []
    });
  }
  return schemes;
}

/** Extract base URLs from OpenAPI servers */
function extractBaseUrls(openapi) {
  const servers = Array.isArray(openapi?.servers) ? openapi.servers : [];
  return servers
    .map((s) => (s && typeof s === "object" ? s.url : null))
    .filter(Boolean);
}

/**
 * Extract endpoints from OpenAPI paths.
 */
function extractEndpoints(openapi) {
  const paths = openapi?.paths || {};
  const endpoints = [];
  const METHODS = ["get", "post", "put", "patch", "delete"];

  for (const [path, ops] of Object.entries(paths)) {
    if (!ops || typeof ops !== "object") continue;

    for (const m of METHODS) {
      const op = ops[m];
      if (!op) continue;

      const purpose =
        op.summary ||
        (typeof op.description === "string" ? op.description.split("\n")[0] : null) ||
        "No description";

      // Conservative auth inference:
      // - If global security or op security exists => auth_required = true
      // - If neither exists => null (unknown)
      const auth_required =
        (Array.isArray(openapi?.security) && openapi.security.length > 0) ||
        (Array.isArray(op?.security) && op.security.length > 0) ||
        null;

      endpoints.push({
        method: m.toUpperCase(),
        path,
        purpose,
        auth_required,
        scopes: [], // left empty intentionally (scopes need deep OAuth flow parsing)
        request_schema_hint: op.requestBody ? "Has requestBody (see spec)" : "",
        response_schema_hint: op.responses ? "Has responses (see spec)" : "",
        criticality: "supporting",
        notes: []
      });
    }
  }

  return endpoints;
}

/** Normalize into a stable structure for agents */
function normalizeSurfaceMap(openapi) {
  const title = openapi?.info?.title || "Unknown API";
  const version = openapi?.info?.version || null;

  return {
    api: { title, version },
    base_urls: extractBaseUrls(openapi),
    auth: { schemes: extractAuthSchemes(openapi), notes: [] },
    endpoints: extractEndpoints(openapi),
    notes: []
  };
}

/**
 * For params nested under { parameters: {...} }.
 * Accepting both shapes to reduce integration friction.
 */
function readParams(reqBody) {
  if (!reqBody) return {};
  if (reqBody.parameters && typeof reqBody.parameters === "object") return reqBody.parameters;
  return reqBody;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  if (!enforceBearer(req, res)) return;

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
    }
  }

  const params = readParams(body);
  const spec_url = params?.spec_url;

  if (!spec_url || typeof spec_url !== "string") {
    return res.status(400).json({
      error: "spec_url is required (string).",
      example: { spec_url: "https://petstore3.swagger.io/api/v3/openapi.json" }
    });
  }

  try {
    const openapi = await fetchSpec(spec_url);
    const surface_map = normalizeSurfaceMap(openapi);

    return res.status(200).json({
      spec_url,
      surface_map,
      stats: {
        endpoint_count: surface_map.endpoints.length,
        auth_scheme_count: surface_map.auth.schemes.length,
        base_url_count: surface_map.base_urls.length
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to process OpenAPI spec.",
      details: String(err?.message || err)
    });
  }
}
