import { mkdir,writeFile,chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
try{
  const directory=path.resolve('.private');await mkdir(directory,{recursive:true,mode:0o700});
  if(process.platform==='win32'){
    const identity=execFileSync('whoami.exe',[],{encoding:'utf8'}).trim();execFileSync('icacls.exe',[directory,'/inheritance:r','/grant:r',`${identity}:(OI)(CI)F`,'*S-1-5-18:(OI)(CI)F'],{stdio:'pipe'});
  }else await chmod(directory,0o700);
  await writeFile(path.join(directory,'instance.env'),`AUTH_SECRET=${randomBytes(48).toString('base64url')}\nOWNER_SETUP_TOKEN=${randomBytes(32).toString('base64url')}\n`,{mode:0o600,flag:'wx'});
  console.log('Private instance secrets created in .private/instance.env. Existing secrets are never overwritten.');
}catch{console.error('Secret initialization failed or the private file already exists. No secret values were printed.');process.exitCode=1;}
