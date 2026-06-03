---
name: Background jobs don't survive tool-call teardown
description: Long-running background processes are killed when the spawning tool call ends; run them as foreground time-boxed chunks instead.
---

# Background jobs are killed when the spawning tool call ends

Detached background processes (even `setsid bash -c '...' < /dev/null &` or `nohup`)
are reliably killed by this Replit agent environment shortly after the bash tool
call that launched them returns. A newly launched detached process often dies
before it writes its first log line.

**Why:** the environment appears to clean up the tool call's process tree on
teardown, including detached children in a new session.

**How to apply:** for any long job (data backfills, batch enrichment, large
migrations), run it in the **foreground** inside bash calls, time-boxed under the
tool limit, e.g. `timeout 110 node script.mjs`. Make the job **idempotent and
resumable** (skip already-completed work) so each chunk advances and you can call
it repeatedly. Do not rely on a single background launch persisting across turns.

Also: running a heavy foreground job in the same container can stop the app
workflow — restart `Start application` afterward.
