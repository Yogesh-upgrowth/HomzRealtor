---
name: AI content generation quirks
description: Gotchas for lib/intelligence/content.ts AI narrative generation via the Replit OpenAI gateway.
---

# AI content generation (project intelligence)

## Model must be an OpenAI model, not llama
The app talks to OpenAI through the Replit AI gateway (base URL `AI_INTEGRATIONS_OPENAI_BASE_URL`, a local proxy). The gateway rejects `llama-3.1-8b-instant` with `400 Model ... is not supported`. Supported models tested working: `gpt-4o-mini`, `gpt-4o`, `gpt-5`, `gpt-4.1-mini`. Default is `gpt-4o-mini` (cheap/fast). `AI_INTEGRATIONS_OPENAI_MODEL` env overrides it.
**Why:** an earlier default of a llama model silently failed, so all AI narrative sections hid themselves.
**How to apply:** if AI sections vanish, check logs for a model-not-supported 400 before assuming a data problem.

## unstable_cache caches empty/failed AI results for 30 days
`generateProjectContent` wraps `callOpenAI` in `unstable_cache` (revalidate 30d). If `callOpenAI` swallows an error and returns empty strings, that empty payload gets cached and suppresses sections until the cache expires.
**Why:** after fixing the model, sections stayed blank because the prior failed (empty) result was already cached in `.next/cache` and survived restarts.
**How to apply:** (1) `callOpenAI` now rethrows on failure so failures are NOT cached (caller falls back to empty for that request and retries next time). (2) To force regeneration after prompt/model changes, bump `CONTENT_CACHE_VERSION` (part of the cache key).
