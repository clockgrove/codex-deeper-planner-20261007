import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export function runCli(argv) { throw new Error('Not implemented'); }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(runCli(process.argv.slice(2))); }
  catch (error) { process.stderr.write(`planner: ${error.message}\n`); process.exitCode = 2; }
}
