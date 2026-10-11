import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {needsDeployment} from './check-release-deployment.mjs';
const feed={schemaVersion:1,generatedAt:'2026-10-11T00:00:00Z',releases:[]};
test('unchanged committed feed redeploys when previous deployment failed or is stale',async()=>{assert.equal(await needsDeployment(feed,{request:async()=>new Response('{}')}),true);assert.equal(await needsDeployment(feed,{request:async()=>new Response('',{status:404})}),true)});
test('matching live JSON skips work and a forced recovery still deploys',async()=>{assert.equal(await needsDeployment(feed,{request:async()=>new Response(JSON.stringify(feed))}),false);assert.equal(await needsDeployment(feed,{force:true,request:async()=>{throw Error('should not fetch')}}),true)});
test('network failures and malformed public JSON request recovery without exposing data',async()=>{assert.equal(await needsDeployment(feed,{request:async()=>{throw Error('signed private fragment')}}),true);assert.equal(await needsDeployment(feed,{request:async()=>new Response('invalid')}),true)});
test('sync workflow deploy is gated by live comparison rather than data change alone',()=>{const s=readFileSync('.github/workflows/sync-releases.yml','utf8');assert.match(s,/steps.deployment-check.outputs.needed/);assert.match(s,/needs.sync.outputs.deploy_needed/);assert.match(s,/cron: '17 \*\/6 \* \* \*'/);assert.doesNotMatch(s,/pull_request|repository_dispatch/)});

test('maximum twenty-entry bilingual history stays readable by deployment and browser consumers',async()=>{const {buildPublicReleaseFeed,projectRelease}=await import('./public-release-feed.mjs');const {fixture}=await import('./release-test-fixture.mjs');const records=Array.from({length:20},(_,n)=>{const r=projectRelease(fixture(`0.2.${n}`).record);r.notes={en:'界'.repeat(1200),zh:'汉'.repeat(1200)};return r});const large=buildPublicReleaseFeed({records,generatedAt:feed.generatedAt});const bytes=Buffer.byteLength(JSON.stringify(large));assert.ok(bytes>131072);assert.ok(bytes<524288);assert.equal(await needsDeployment(large,{request:async()=>new Response(JSON.stringify(large))}),false);});
