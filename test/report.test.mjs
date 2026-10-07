import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../src/report.mjs';
const header='# Project plan\n\n| Task | Title | Worker | Start | End |\n| --- | --- | --- | --- | --- |\n';
const tasks=[{id:'a',title:'A | B\\C'},{id:'b',title:'Second'}],analysis={criticalPath:3},plan={workers:2,entries:[{id:'b',worker:2,start:0,end:1},{id:'a',worker:1,start:0,end:3}],makespan:3};
test('exact Markdown, original-character escaping and supplied dispatch order',()=>{
const before=structuredClone({tasks,analysis,plan});
assert.equal(renderReport(tasks,analysis,plan),header+'| b | Second | 2 | 0 | 1 |\n| a | A \\| B\\\\C | 1 | 0 | 3 |\n\nMakespan: 3\nCritical path: 3\nWorkers: 2\n');
assert.deepEqual({tasks,analysis,plan},before);
});
test('empty report retains blank line and final LF',()=>{
assert.equal(renderReport([],{criticalPath:0},{workers:1,entries:[],makespan:0}),header+'\nMakespan: 0\nCritical path: 0\nWorkers: 1\n');
});
test('reject incomplete or duplicate result membership',()=>{
for(const entries of [[],[plan.entries[0]],[plan.entries[0],plan.entries[0]],[{...plan.entries[0],id:'x'},plan.entries[1]]]) assert.throws(()=>renderReport(tasks,analysis,{...plan,entries}),TypeError);
});
test('reject invalid report shapes, times and maximum end',()=>{
for(const bad of [null,{...plan,workers:3},{...plan,makespan:4},{...plan,entries:[{...plan.entries[0],worker:0},plan.entries[1]]},
{...plan,entries:[{...plan.entries[0],start:1},plan.entries[1]]},{...plan,entries:[{...plan.entries[0],end:1.5},plan.entries[1]]}]) assert.throws(()=>renderReport(tasks,analysis,bad),TypeError);
for(const bad of [null,{},[{id:'a',title:''}],tasks.concat(tasks[0])]) assert.throws(()=>renderReport(bad,analysis,plan),TypeError);
assert.throws(()=>renderReport(tasks,{criticalPath:-1},plan),TypeError);
});
