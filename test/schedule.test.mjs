import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleTasks } from '../src/schedule.mjs';
const t=(id,duration,dependsOn=[],resource='',priority=0)=>({id,duration,dependsOn,resource,priority});
const graph=(order,dependencies,criticalPath=0)=>({order,dependencies,criticalPath});
const entry=(id,worker,start,end)=>({id,worker,start,end});
const tasks=[t('a',4,[],'cpu'),t('b',3,[],'cpu',2),t('c',2,[],'',1),t('d',1,['c']),t('e',2,['a','b'],'gpu')];
const analysis=graph(['a','b','c','d','e'],{a:[],b:[],c:[],d:['c'],e:['a','b']},6);
test('exclusive resources, blocked priority skip and earliest dispatch',()=>{
const before=structuredClone({tasks,analysis}),out=scheduleTasks(tasks,analysis);
assert.deepEqual(out,{workers:2,entries:[entry('b',1,0,3),entry('c',2,0,2),entry('d',2,2,3),entry('a',1,3,7),entry('e',1,7,9)],makespan:9});
assert.deepEqual({tasks,analysis},before);out.entries[0].id='changed';assert.deepEqual({tasks,analysis},before);
});
test('one worker differs without changing dependency/resource rules',()=>{
assert.deepEqual(scheduleTasks(tasks,analysis,{workers:1}),{workers:1,entries:[entry('b',1,0,3),entry('c',1,3,5),entry('a',1,5,9),entry('d',1,9,10),entry('e',1,10,12)],makespan:12});
});
test('finish all simultaneous tasks before dependent dispatch; worker and ID ties',()=>{
assert.deepEqual(scheduleTasks([t('b',2),t('c',1,['b','a']),t('a',2)],graph(['a','b','c'],{a:[],b:[],c:['a','b']},3)),
{workers:2,entries:[entry('a',1,0,2),entry('b',2,0,2),entry('c',1,2,3)],makespan:3});
assert.deepEqual(scheduleTasks([],graph([],{})),{workers:2,entries:[],makespan:0});
});
test('skip busy resource even for next-highest priority',()=>{
assert.deepEqual(scheduleTasks([t('a',3,[],'cpu',9),t('b',2,[],'cpu',8),t('c',4,[],'',1)],graph(['a','b','c'],{a:[],b:[],c:[]})),
{workers:2,entries:[entry('a',1,0,3),entry('c',2,0,4),entry('b',1,3,5)],makespan:5});
});
test('reject mismatched analysis and invalid options/tasks',()=>{
for(const g of [null,graph(['a'],{a:[]}),graph(['b','a','c','d','e'],{...analysis.dependencies,d:[]}),
graph(['e','a','b','c','d'],analysis.dependencies),graph(['a','a','c','d','e'],analysis.dependencies),graph(analysis.order,{...analysis.dependencies,x:[]}),graph(analysis.order,analysis.dependencies,-1)]) assert.throws(()=>scheduleTasks(tasks,g),TypeError);
for(const options of [null,[],{workers:0},{workers:3},{workers:'2'},{workers:1.5}]) assert.throws(()=>scheduleTasks(tasks,analysis,options),TypeError);
for(const bad of [[t('a',0)],[t('a',1,[],'CPU')],[t('a',1,[],'',10)],[t('a',1,['x'])],[t('a'),t('a')]]) assert.throws(()=>scheduleTasks(bad,graph(['a'],{a:[]})),TypeError);
});
