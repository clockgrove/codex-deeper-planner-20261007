# Resource project planner

Build the complete dependency-free Node24 SPEC.md contract. Only six existing src/*.mjs may change; preserve all other committed bytes. No dependencies, new source files, services or features.

## Validation commands

Core tests use concrete contract inputs without other source-module imports; run independently before dependencies:

### ingest

- `node --test test/ingest.test.mjs`
### normalize

- `node --test test/normalize.test.mjs`
### analyze

- `node --test test/analyze.test.mjs`
### schedule

- `node --test test/schedule.test.mjs`
### report

- `node --test test/report.test.mjs`
### CLI after dependencies

- `node --test test/cli.test.mjs`
### Final

- `npm test`

## Work graph

Ingest, normalize and analyze are independent. Schedule consumes normalize+analyze; report consumes schedule; CLI imports/composes all five. Each item owns one disjoint source file. Run `node src/cli.mjs fixtures/tasks.csv --workers 2`. Tests remove their .runtime temporary files. No network.
