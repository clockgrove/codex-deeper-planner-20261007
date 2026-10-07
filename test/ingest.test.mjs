import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/ingest.mjs';
const header = 'id,title,duration,depends_on,resource,priority';
test('ordinary rows preserve order and raw strings', () => {
assert.deepEqual(parseCsv(header+'\na, A ,3,,cpu,2\nb,B,1,a,,\n'), [
{id:'a',title:' A ',duration:'3',depends_on:'',resource:'cpu',priority:'2'},
{id:'b',title:'B',duration:'1',depends_on:'a',resource:'',priority:''}]);
});
test('quoted delimiters, doubled quotes, multiline and CRLF', () => {
assert.deepEqual(parseCsv('\ufeff'+header+'\r\na,"A, ""quoted""\r\nline",2,,,0\r\n')[0],
{id:'a',title:'A, "quoted"\r\nline',duration:'2',depends_on:'',resource:'',priority:'0'});
assert.equal(parseCsv(header+'\na,"first\nsecond",1,,,0')[0].title,'first\nsecond');
});
test('header-only, quoted header and independent row objects', () => {
assert.deepEqual(parseCsv(header), []);
assert.deepEqual(parseCsv(header+'\n'), []);
const rows=parseCsv('"id",title,duration,depends_on,resource,priority\na,A,1,,,\na,A,1,,,');
rows[0].title='Changed'; assert.equal(rows[1].title,'A');
});
test('reject malformed syntax and headers', () => {
for(const text of ['', 'ID,title,duration,depends_on,resource,priority', header+'\n\n', header+'\na,A,1,,',
header+'\na,A,1,,,,', header+'\na,A"bad,1,,,0', header+'\na,"open,1,,,0',
header+'\na,"A" x,1,,,0', header+'\ra,A,1,,,0', header+'\na,A,1,,,0\n\n']) assert.throws(()=>parseCsv(text),TypeError,text);
for(const value of [null,42,[],{}]) assert.throws(()=>parseCsv(value),TypeError);
});
