---
name: AI content generation quirks
description: Gotchas for lib/intelligence/content.ts AI narrative generation via Groq's OpenAI-compatible API.
---

# AI content generation (project intelligence)

## Model must be one Groq currently serves
The app talks to Groq's OpenAI-compatible API directly (base URL `AI_INTEGRATIONS_GROQ_BASE_URL` = `https://api.groq.com/openai/v1`, key `AI_INTEGRATIONS_GROQ_API_KEY`). Renamed from `AI_INTEGRATIONS_OPENAI_*` on 2026-08-31 — the vars were always pointed at Groq, the OpenAI naming was leftover from an earlier provider. `llama-3.1-8b-instant` was removed from Groq's lineup entirely and 400s. Default/tested-working model: `openai/gpt-oss-20b` (free tier, supports JSON mode). `AI_INTEGRATIONS_GROQ_MODEL` env overrides it.
**Why:** an earlier default of a since-removed llama model silently failed, so all AI narrative sections hid themselves.
**How to apply:** if AI sections vanish, check logs for a model-not-supported 400 before assuming a data problem; check `GET https://api.groq.com/openai/v1/models` for what's currently available.

## unstable_cache caches empty/failed AI results for 30 days
`generateProjectContent` wraps `callOpenAI` in `unstable_cache` (revalidate 30d). If `callOpenAI` swallows an error and returns empty strings, that empty payload gets cached and suppresses sections until the cache expires.
**Why:** after fixing the model, sections stayed blank because the prior failed (empty) result was already cached in `.next/cache` and survived restarts.
**How to apply:** (1) `callOpenAI` now rethrows on failure so failures are NOT cached (caller falls back to empty for that request and retries next time). (2) To force regeneration after prompt/model changes, bump `CONTENT_CACHE_VERSION` (part of the cache key).
