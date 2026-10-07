import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { parseCsv } from './ingest.mjs';
import { normalizeRows } from './normalize.mjs';
import { analyzeDependencies } from './analyze.mjs';
import { scheduleTasks } from './schedule.mjs';
import { renderReport } from './report.mjs';

export function runCli(argv) {
  if (!Array.isArray(argv) || Array.from(argv).some(argument => typeof argument !== 'string')) throw new TypeError('Arguments must be strings');
  if (argv.length === 1 && argv[0] === '--help') return 'Usage: planner <tasks.csv> [--workers 1|2]\n';
  let input;
  let workers = 2;
  let workersSpecified = false;
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--workers') {
      if (workersSpecified || (argv[index + 1] !== '1' && argv[index + 1] !== '2')) throw new TypeError('Specify --workers once with 1 or 2');
      workersSpecified = true;
      workers = Number(argv[++index]);
    } else if (argument.startsWith('-')) throw new TypeError('Unknown flag');
    else {
      if (input !== undefined || argument === '') throw new TypeError('Exactly one input path is required');
      input = argument;
    }
  }
  if (input === undefined) throw new TypeError('Input path is required');
  const tasks = normalizeRows(parseCsv(readFileSync(resolve(input), 'utf8')));
  const analysis = analyzeDependencies(tasks);
  return renderReport(tasks, analysis, scheduleTasks(tasks, analysis, { workers }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(runCli(process.argv.slice(2))); }
  catch (error) { process.stderr.write(`planner: ${error.message}\n`); process.exitCode = 2; }
}
