// Transport core for client-side scraping: JSON fetching with per-attempt
// timeouts, bounded retries (exponential backoff + jitter) and cooperative
// cancellation. Isomorphic — no browser globals, safe to import from server
// code, scripts, or "use client" components alike.

export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export type FetchJsonOptions = {
  /** Caller-owned cancellation (e.g. from a React effect cleanup). */
  signal?: AbortSignal;
  /** Extra attempts after the first failure. Only retryable errors retry. */
  retries?: number;
  /** Per-attempt timeout. A timed-out attempt is retried; a caller abort is not. */
  timeoutMs?: number;
  init?: RequestInit;
};

// Transient statuses worth retrying; 4xx like 400/404 will never heal on retry.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("Aborted", "AbortError");
}

// Links the caller's signal to a per-attempt controller that also fires on
// timeout. Returns a cleanup so listeners/timers never leak across attempts.
function attemptSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal ? abortReason(signal) : undefined);
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    timeoutMs
  );
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortReason(signal));
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortReason(signal!));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { signal, retries = 2, timeoutMs = 12_000, init } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw abortReason(signal);

    const { signal: combined, cleanup } = attemptSignal(signal, timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: combined });
      if (!res.ok) throw new HttpError(res.status, url);
      return (await res.json()) as T;
    } catch (err) {
      // A caller abort is a decision, not a failure — surface it immediately.
      if (signal?.aborted) throw abortReason(signal);
      lastError = err;
      const retryable = err instanceof HttpError ? RETRYABLE_STATUS.has(err.status) : true;
      if (!retryable || attempt === retries) throw err;
      await sleep(400 * 2 ** attempt + Math.random() * 200, signal);
    } finally {
      cleanup();
    }
  }

  throw lastError;
}
