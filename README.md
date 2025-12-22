# Opal OpenAPI Surface Tool (JS)

Endpoints (public):
- GET /discovery
- POST /tools/opal_openapi_surface_map

Input:
{ "spec_url": "https://.../openapi.json|yaml" }

Optional auth:
Set OPAL_TOOL_BEARER_TOKEN on Vercel to require:
Authorization: Bearer <token>
