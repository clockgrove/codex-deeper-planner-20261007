import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRows } from '../src/normalize.mjs';
const row = (overrides={}) => ({id:'a',title:'Task A',duration:'1',depends_on:'',resource:'',priority:'',...overrides});
test('canonicalize, sort, preserve input and return fresh records', () => {
const input=[row({id:' B ',title:'\tBeta \n task ',duration:' 4 ',depends_on:' C | A ',resource:' CPU ',priority:' -2 '}), row()];
const before=structuredClone(input), output=normalizeRows(input);
assert.deepEqual(output,[{id:'a',title:'Task A',duration:1,dependsOn:[],resource:'',priority:0},
{id:'b',title:'Beta task',duration:4,dependsOn:['a','c'],resource:'cpu',priority:-2}]);
assert.deepEqual(input,before); output[1].dependsOn.push('x'); output[0].title='Changed'; assert.deepEqual(input,before);
assert.deepEqual(normalizeRows([]),[]);
});
test('duration and priority bounds are exact', () => {
assert.equal(normalizeRows([row({duration:'1000000',priority:'9'})])[0].duration,1000000);
assert.equal(normalizeRows([row({priority:'-9'})])[0].priority,-9);
for(const duration of ['','0','01','-1','+1','1.5','1e2','1000001','9007199254740993','NaN']) assert.throws(()=>normalizeRows([row({duration})]),TypeError);
for(const priority of ['-0','+1','01','10','-10','1.0','NaN']) assert.throws(()=>normalizeRows([row({priority})]),TypeError);
});
test('reject invalid business identities, titles and dependencies', () => {
for(const id of ['','1x','a b','a.b']) assert.throws(()=>normalizeRows([row({id})]),TypeError);
for(const resource of ['1x','a b','a.b']) assert.throws(()=>normalizeRows([row({resource})]),TypeError);
for(const depends_on of ['a',' A ','b|B','b||c','|b','b|','1x']) assert.throws(()=>normalizeRows([row({depends_on})]),TypeError);
assert.throws(()=>normalizeRows([row(),row({id:' A '})]),TypeError);
assert.throws(()=>normalizeRows([row({title:' \t\n '})]),TypeError);
assert.deepEqual(normalizeRows([row({depends_on:'z'})])[0].dependsOn,['z']);
});
test('raw rows require exactly the six string fields', () => {
for(const input of [null,{},[null],[[]],[row({duration:1})],[{...row(),extra:'x'}],[{id:'a'}]]) assert.throws(()=>normalizeRows(input),TypeError);
});
