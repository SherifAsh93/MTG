import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdentifier } from '../dist/authentication.js';

test('Username, email and international phone formats remain unambiguous',()=>{
  assert.deepEqual(normalizeIdentifier('  QA.Owner  '),{value:'qa.owner',kind:'username'});
  assert.deepEqual(normalizeIdentifier('QA.User@EXAMPLE.INVALID'),{value:'qa.user@example.invalid',kind:'email'});
  assert.deepEqual(normalizeIdentifier('+1 (202) 555-0123'),{value:'+12025550123',kind:'phone'});
  assert.deepEqual(normalizeIdentifier('+12025550123'),{value:'+12025550123',kind:'phone'});
});
test('Ambiguous local numbers, extensions and malformed email are rejected before account creation',()=>{
  for(const value of ['2025550123','+1 (202) 555-0123 ext. 9','bad"email@example.invalid','user@@example.invalid','',{},null])assert.throws(()=>normalizeIdentifier(value));
});
