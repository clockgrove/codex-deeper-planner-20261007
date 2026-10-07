import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDependencies } from '../src/analyze.mjs';
const t=(id,duration=1,dependsOn=[])=>({id,duration,dependsOn});
test('stable ready queue considers newly ready IDs, not input order', () => {
const input=[t('z',1),t('b',2,['a']),t('a',3)],before=structuredClone(input),out=analyzeDependencies(input);
assert.deepEqual(out,{order:['a','b','z'],dependencies:{a:[],b:['a'],z:[]},criticalPath:5});
assert.deepEqual(input,before);out.dependencies.b.push('z');assert.deepEqual(input,before);
});
test('diamond critical path and complete sorted dependency records', () => {
assert.deepEqual(analyzeDependencies([t('d',2,['c','b']),t('c',5,['a']),t('b',3,['a']),t('a',4)]),
{order:['a','b','c','d'],dependencies:{a:[],b:['a'],c:['a'],d:['b','c']},criticalPath:11});
assert.deepEqual(analyzeDependencies([]),{order:[],dependencies:{},criticalPath:0});
});
test('reject unknown, cyclic, repeated and self dependencies', () => {
for(const tasks of [[t('a',1,['x'])],[t('a',1,['a'])],[t('a',1,['b']),t('b',1,['a'])],
[t('a'),t('b',1,['a','a'])],[t('a'),t('a')]]) assert.throws(()=>analyzeDependencies(tasks),TypeError);
});
test('independent structural input validation', () => {
for(const tasks of [null,{},[null],[t(' A')],[t('a',0)],[t('a',1.5)],[t('a',1000001)],[t('a',1,'b')],[t('a',1,[7])]]) assert.throws(()=>analyzeDependencies(tasks),TypeError);
});
