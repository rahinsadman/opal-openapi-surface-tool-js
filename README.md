# Opal Custom Tools — OpenAPI Surface Map + Capability Coverage Matrix

This repo contains a small Vercel-hosted JavaScript tool registry for Optimizely Opal.  
It exposes two functions that parse OpenAPI/Swagger specs to produce evidence-grounded artifacts for integration feasibility workflows.

## Why this exists
Integration feasibility assessments often become slow, inconsistent, and prone to hallucination. This tool converts an OpenAPI/Swagger spec into structured, reusable evidence (endpoint inventory + auth hints) and a capability-to-endpoint coverage matrix with confidence and traceable evidence.

## Live deployment
- **Base URL:** https://opal-openapi-surface-tool-js.vercel.app
- **Discovery URL (Opal Tool Registry):** https://opal-openapi-surface-tool-js.vercel.app/discovery

## Functions exposed

### 1) `opal_openapi_surface_map`
Fetches an OpenAPI/Swagger spec from `spec_url` (JSON/YAML) and returns a normalized endpoint inventory + auth hints.

**HTTP**
- `POST /tools/opal_openapi_surface_map`

**Input**
```json
{ "spec_url": "https://example.com/openapi.json" }
