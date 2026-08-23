// Verifies the agent-readiness fixes actually behave as intended, against a
// running server (local dev/build or production). This repo has no test
// framework installed (no jest/vitest/playwright in package.json), so this
// is a plain, dependency-free Node script rather than a real test suite —
// run it manually after any change to these behaviors:
//
//   node scripts/verify-agent-readiness.mjs
//   BASE_URL=https://www.homzrealtor.com node scripts/verify-agent-readiness.mjs
//
// Exits non-zero (and prints which check failed) if anything regresses.

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let failures = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  // 1. Agent-friendly 404s: real 404 status + recovery links.
  {
    const res = await fetch(`${BASE_URL}/some-path-that-does-not-exist-xyz`);
    const body = await res.text();
    check("404 status for a nonexistent path", res.status === 404, `got ${res.status}`);
    check(
      "404 page links to sitemap.xml and llms.txt",
      body.includes("sitemap.xml") && body.includes("llms.txt")
    );
  }

  // 2. Homepage renders real content without JS.
  {
    const res = await fetch(`${BASE_URL}/`);
    const body = await res.text();
    check("homepage has an <h1>", /<h1[\s>]/.test(body));
    check("homepage has 500+ chars of raw HTML", body.length > 500, `got ${body.length}`);
  }

  // 3. OpenAPI spec is published and self-describing.
  {
    const res = await fetch(`${BASE_URL}/openapi.json`);
    check("/openapi.json returns 200", res.status === 200, `got ${res.status}`);
    const spec = await res.json();
    check("openapi.json has an openapi version", typeof spec.openapi === "string");
    const ops = Object.values(spec.paths || {}).flatMap((p) => Object.values(p));
    check("every operation has a unique operationId", (() => {
      const ids = ops.map((op) => op.operationId);
      return ids.length > 0 && ids.every(Boolean) && new Set(ids).size === ids.length;
    })());
    check("every operation has a description", ops.every((op) => !!op.description));
  }

  // 4. JSON error responses on the public API.
  {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const data = await res.json().catch(() => null);
    check("/api/contact returns JSON (not HTML) on a bad request", res.status === 400 && !!data);
    check(
      "/api/contact's error has a code, message and hint",
      !!(data?.error?.code && data?.error?.message && data?.error?.hint)
    );
  }
  {
    const res = await fetch(`${BASE_URL}/api/listings?segment=bogus&category=Sale`);
    const data = await res.json().catch(() => null);
    check("/api/listings returns a structured JSON error on invalid params", res.status === 400 && !!data?.error);
  }

  // 5. Markdown content negotiation (https://acceptmarkdown.com) + Vary.
  {
    const res = await fetch(`${BASE_URL}/`, { headers: { Accept: "text/markdown" } });
    const contentType = res.headers.get("content-type") || "";
    const vary = res.headers.get("vary") || "";
    const body = await res.text();
    check(
      "Accept: text/markdown returns a markdown content-type",
      contentType.includes("text/markdown"),
      `got "${contentType}"`
    );
    check("that response's Vary header includes Accept", vary.toLowerCase().includes("accept"), `got "${vary}"`);
    check("the markdown body actually looks like markdown", body.trimStart().startsWith("# "));
  }
  {
    // A plain browser request must be completely unaffected.
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const contentType = res.headers.get("content-type") || "";
    check("a normal Accept: text/html request still gets HTML", contentType.includes("text/html"));
  }

  // 6/7/9/10/11. Developer resource discoverability.
  {
    const res = await fetch(`${BASE_URL}/llms.txt`);
    const body = await res.text();
    check("/llms.txt returns 200", res.status === 200, `got ${res.status}`);
    check('/llms.txt has a "When to use" section', body.includes("When to use"));
  }
  {
    const res = await fetch(`${BASE_URL}/developers`);
    const body = await res.text();
    check("/developers returns 200", res.status === 200, `got ${res.status}`);
    check("/developers mentions HomzRealtor in its title", /<title>[^<]*HomzRealtor/.test(body));
  }

  // 12/13. Organization identity + contact point in JSON-LD.
  {
    const res = await fetch(`${BASE_URL}/`);
    const body = await res.text();
    check(
      'homepage JSON-LD declares an "Organization" identity type',
      body.includes('"Organization"')
    );
    check("homepage JSON-LD has a ContactPoint", body.includes('"ContactPoint"'));
  }

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
