import { createServer } from 'node:net';
import { randomUUID,randomBytes } from 'node:crypto';
import { unzipSync } from 'fflate';
import { loadConfig } from '../dist/config.js';
import { exportWebPackage } from '../dist/delivery.js';
import { initialState,saveClientProfile,createProject,toggleApp,publishClient } from '../../prototype/model.mjs';
import { enhanceState,definitionFor } from '../../prototype/builder-model.mjs';
import { verifyPackedRuntime } from './package-portability.mjs';

const state=enhanceState(initialState());const client=saveClientProfile(state,{name:'Synthetic package fixture'});
const project=createProject(state,{clientId:client.id,name:'Synthetic portable package'});enhanceState(state);toggleApp(project,'crm');definitionFor(state,project,'crm');publishClient(project);
const bytes=await exportWebPackage({load:async()=>({state})},{id:randomUUID(),kind:'owner'},project.id,1);
const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const config={...await loadConfig('test'),port,authSecret:randomBytes(48).toString('base64url')};
console.log(await verifyPackedRuntime(unzipSync(bytes),config,{},true));
