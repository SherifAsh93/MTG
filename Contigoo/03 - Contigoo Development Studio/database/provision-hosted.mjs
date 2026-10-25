import { provisionServices, safeCode } from './hosted.mjs';
try { console.log(JSON.stringify(await provisionServices(), null, 2)); }
catch (error) { console.error(`Hosted service provisioning failed (${safeCode(error)}). Private details were suppressed; existing resources were not reset.`); if (error.setupStage) console.error(`Stage: ${error.setupStage}`); process.exitCode = 1; }
