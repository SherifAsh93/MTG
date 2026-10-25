/** Create an isolated imagesfix release workspace; never write the running release. */
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const source='/home/sherif/sites/Ahmed-Elakad';
const release='/home/sherif/sites/ahmed-elakad-releases/20261008-imagesfix';
await fs.mkdir(release,{mode:0o700,recursive:true});
try { await fs.access(release+'/next-env.d.ts'); throw Error('Release already prepared; use a new release directory'); } catch(e) { if(e.code!=='ENOENT')throw e; }
for(const name of ['src','public','scripts','ops','docs','data','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','eslint.config.mjs','AGENTS.md','HANDOFF.md','README.md','next-env.d.ts']) {
 if(name==='public')await fs.mkdir(release+'/public',{recursive:true});
 const p=spawnSync('rsync',name==='public'?['-a','--exclude=/media',source+'/public/',release+'/public/']:['-a',source+'/'+name,release+'/'],{encoding:'utf8'});
 if(p.status!==0)throw Error('Release copy failed: '+name);
}
for(const [from,to] of [[source+'/.env.local',release+'/.env.local'],[source+'/public/media',release+'/public/media']]) {
 try{await fs.symlink(from,to);}catch(e){if(e.code!=='EEXIST'||await fs.readlink(to)!==from)throw e;}
}
const install=spawnSync('npm',['ci','--no-audit','--no-fund'],{cwd:release,stdio:'inherit',timeout:600000});
if(install.status!==0)throw Error('Release dependency install failed');
console.log('Imagesfix release prepared at '+release);
