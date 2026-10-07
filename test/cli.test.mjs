import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join,dirname } from 'node:path';
import { runCli } from '../src/cli.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url))),csv=join(root,'fixtures/tasks.csv'),cli=join(root,'src/cli.mjs');
const header='# Project plan\n\n| Task | Title | Worker | Start | End |\n| --- | --- | --- | --- | --- |\n';
const expected=header+'| b | Prepare assets | 1 | 0 | 3 |\n| c | Collect inputs | 2 | 0 | 2 |\n| d | Check inputs | 2 | 2 | 3 |\n| a | Compile core | 1 | 3 | 7 |\n| e | Publish plan | 1 | 7 | 9 |\n\nMakespan: 9\nCritical path: 6\nWorkers: 2\n';
const execute=args=>spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8'});
test('real CLI end-to-end stdout, zero stderr and default workers',()=>{
const before=readFileSync(csv),result=execute(['fixtures/tasks.csv']);
assert.equal(result.status,0);assert.equal(result.stderr,'');assert.equal(result.stdout,expected);assert.deepEqual(readFileSync(csv),before);
assert.equal(runCli([csv,'--workers','2']),expected);
});
test('worker flag either side, one-worker result and standalone help',()=>{
assert.equal(execute(['--workers','2',csv]).stdout,expected);
const one=execute([csv,'--workers','1']);assert.equal(one.status,0);assert.ok(one.stdout.includes('Makespan: 12\nCritical path: 6\nWorkers: 1\n'));
const help=execute(['--help']);assert.deepEqual([help.status,help.stdout,help.stderr],[0,'Usage: planner <tasks.csv> [--workers 1|2]\n','']);
});
test('all argument/data/I/O errors are stderr-only exit2',()=>{
for(const args of [[],[csv,'other.csv'],[csv,'--workers'],[csv,'--workers','0'],[csv,'--workers','2','--workers','1'],['--bad',csv],['--help',csv],['missing-input.csv']]) {
const result=execute(args);assert.equal(result.status,2);assert.equal(result.stdout,'');assert.match(result.stderr,/^planner: .+\n$/);
}
for(const value of [null,{},[3]]) assert.throws(()=>runCli(value));
const runtime=join(root,'.runtime');mkdirSync(runtime,{recursive:true,mode:0o700});const temporary=mkdtempSync(join(runtime,'cli-'));
try {const invalid=join(temporary,'cycle.csv');writeFileSync(invalid,'id,title,duration,depends_on,resource,priority\na,A,1,b,,0\nb,B,1,a,,0\n');const result=execute([invalid]);assert.equal(result.status,2);assert.equal(result.stdout,'');assert.match(result.stderr,/^planner: .+\n$/);}finally{rmSync(temporary,{recursive:true,force:true});}
});
test('import has no execution/printing; outputs repeat identically',()=>{
const imported=spawnSync(process.execPath,['--input-type=module','-e',`await import(${JSON.stringify(new URL('../src/cli.mjs',import.meta.url).href)})`],{cwd:root,encoding:'utf8'});
assert.deepEqual([imported.status,imported.stdout,imported.stderr],[0,'','']);
assert.equal(execute([csv]).stdout,expected);assert.equal(execute([csv]).stdout,expected);
});
