# Project Memory (index)

- [Background jobs don't survive](background-jobs-teardown.md) — detached setsid/nohup processes are killed when the spawning tool call ends; run long jobs as foreground time-boxed chunks.
- [Raw pg schema management](raw-pg-schema-management.md) — no ORM; apply DDL to dev DB directly, prod gets it via publish-diff; scheduled jobs are separate deployments, don't clobber the website's.
