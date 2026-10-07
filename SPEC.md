# Resource project planner contract

Implement only the six named ES modules, using Node built-ins. This full contract is authoritative beyond tests. All functions preserve inputs; returned arrays/objects must be fresh and mutable, with no aliased dependency arrays. Invalid required shapes/values throw TypeError with a nonempty message unless specified otherwise. ASCII IDs compare by code-unit order, not locale. Empty task lists are valid.

## Canonical records

A normalized task is `{id,title,duration,dependsOn,resource,priority}`. IDs/nonempty resources match `[a-z][a-z0-9_-]*`. Duration is integer 1..1000000; priority integer -9..9 (larger first). Empty resource means no reservation. dependsOn is a sorted array of distinct IDs. Titles are nonempty, trimmed, with every JavaScript whitespace run replaced by one ASCII space.

## Ingest — src/ingest.mjs

Export `parseCsv(text)`: string CSV to fresh ordinary row objects in input order. Header values must be exactly `id,title,duration,depends_on,resource,priority` in that order. Each row has exactly those six string keys; preserve field text without trimming, including empty strings. Empty input is invalid; header alone returns [].

Support comma delimiters, LF/CRLF records, one optional initial U+FEFF and one optional final record ending. Quoted fields start with a double quote at field start; doubled quotes decode to one quote. Quoted commas and LF/CRLF are preserved. Closing quote must be followed immediately by comma, record ending or EOF. Reject unquoted quotes, unterminated quotes, bare CR outside quotes, blank records or wrong field counts. Quoted headers obey the same parser and must decode to the exact names. Business validation belongs to normalize.

## Normalize — src/normalize.mjs

Export `normalizeRows(rows)`. Require an array of nonnull nonarray objects with exactly the six own enumerable raw keys above, all strings. Trim/lowercase ID, resource and dependency tokens before grammar checks. Normalize titles as above. Trim duration: require `[1-9][0-9]*` and range 1..1000000. Trim priority: empty defaults to 0; otherwise accept only `0` or a digit 1..9 optionally preceded by minus (reject -0, +1, leading zeros).

Empty trimmed depends_on becomes []; otherwise split on `|`, normalize tokens, and reject empty/invalid/repeated tokens or self dependency. Reject duplicate normalized task IDs. Unknown dependencies/cycles belong to analyze. Return fresh canonical records sorted by ID, with sorted fresh dependency arrays and exactly the six canonical keys.

## Analyze — src/analyze.mjs

Export `analyzeDependencies(tasks)`. Independently require an array with canonical unique id, duration and distinct canonical dependsOn arrays; other fields are ignored. Reject unknown IDs, self dependencies and cycles.

Return `{order,dependencies,criticalPath}`. At every Kahn removal, choose the smallest currently ready ID (including newly ready IDs). dependencies is a fresh ordinary object with all ID keys inserted sorted and fresh sorted arrays. criticalPath is maximum summed durations along a dependency path, ignoring resource/workers; empty result is `{order:[],dependencies:{},criticalPath:0}`.

## Schedule — src/schedule.mjs

Export `scheduleTasks(tasks,analysis,options = {})`. Options must be a nonnull nonarray object. Absent workers defaults to 2; otherwise require integer 1 or 2. Ignore other option keys. Independently require canonical unique id, duration, dependsOn, resource and priority; title is unnecessary. Analysis must have order listing all IDs exactly once, dependencies with exactly those keys and matching dependency sets, and nonnegative integer criticalPath. Order must be topological; reject mismatches/unknown dependencies/cycles without repair. Scheduler need not recompute criticalPath. Other task fields may be ignored.

Use nonpreemptive integer time from 0. Tasks occupy one worker for duration and wait for all dependencies to finish. Nonempty resources are exclusive across workers; empty resource is unlimited. At each timestamp, finish ALL ending tasks and release resources/workers first. Visit free workers numbered 1..workers ascending: choose highest-priority ready task with free resource, tie by smallest ID; reserve immediately. Skip blocked resources and allow lower-ranked runnable tasks. When nothing else starts, advance to earliest running finish; insert no gratuitous delay. Half-open [start,end) permits finish/dependent start at the same time.

Return `{workers,entries,makespan}` with fresh entries `{id,worker,start,end}` in dispatch order (time then worker), each task once. Makespan is maximum end, or 0 for empty. No titles in entries.

## Report — src/report.mjs

Export `renderReport(tasks,analysis,plan)`. Require unique canonical `{id,title}` records (nonempty string titles), nonnegative integer analysis.criticalPath, plan.workers 1 or 2 and nonnegative integer makespan. Entries must contain every ID once: worker integer in range, integer start >=0, integer end > start. Reject unknown/duplicate/missing IDs and makespan differing from maximum end (empty:0). Rechecking scheduling/resource/dependency semantics is unnecessary.

Use supplied entry order. Titles are already whitespace-normalized; escape each ORIGINAL backslash to two and pipe to backslash-pipe in one pass, preserving other characters. Exact template below has a data row per entry, a blank line before footer even when empty, and final LF. No CR/extra spaces/commentary.

```text
# Project plan

| Task | Title | Worker | Start | End |
| --- | --- | --- | --- | --- |
| ID | ESCAPED_TITLE | WORKER | START | END |

Makespan: M
Critical path: C
Workers: W
```

## CLI — src/cli.mjs

Export `runCli(argv)` returning text without printing. Import/compose parseCsv→normalizeRows→analyzeDependencies→scheduleTasks→renderReport from existing modules. Require string-array argv: one input path and optionally one `--workers` followed by `1` or `2`, flag before/after path; default 2. Reject duplicate/unknown flags, missing values/path or extra paths. Sole `--help` returns `Usage: planner <tasks.csv> [--workers 1|2]` plus LF without reading a file. Resolve relative paths against cwd, read complete UTF-8 via Node fs. Argument/data errors throw; I/O may retain native Error. No network/writes.

Direct execution prints returned text once to stdout, exit0. Errors leave stdout empty, print only `planner: ` + error.message + LF to stderr, exit2. Importing must not run/print; never consume process.argv from imported calls. Immutable tests use/remove temporary files under ignored .runtime only.
