# Performance checks

Run with the project's Node >=22.12 and installed dependencies:

```sh
VUE_APP_DOCHUB_DATALAKE_CACHE=memory npm run test:performance
VUE_APP_DOCHUB_DATALAKE_CACHE=memory npm run bench:performance
node --import tsx scripts/performance/real-smartants.mts
VUE_APP_DOCHUB_DATALAKE_CACHE=/tmp/seaf-bench-cache node --import tsx scripts/performance/file-bench.mts
```

On PowerShell, set environment variables with `$env:NAME='value'` before running.
Use the same Node version, cache mode, input and machine for both revisions.
`bench.mts` reports medians of seven rounds. Its 5ms worker and 3ms import
source are controlled fixtures, not browser/network measurements.
`real-smartants.mts` uses the shipped layout library in a Node worker, excluding
the first calculation; this measures repeated layouts, not SVG/DOM rendering.
`file-bench.mts` measures 50 writes of 3,000 nodes and a scheduled timer's delay.

Implementation limits: backend memory cache retains 1,000 entries; validators
retain 100 schemas; browser layouts retain at most 32 snapshots and 8 MiB of
estimated UTF-16 payload. Rendering gets private copies of cached layouts.
Imports have a default concurrency of 16, configurable through the Parser
constructor's `importConcurrency` option. This bounds pressure on remote Git
services and can make imports from a very fast source slower.
