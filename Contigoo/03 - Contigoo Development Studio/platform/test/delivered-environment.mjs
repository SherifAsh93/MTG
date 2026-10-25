import { randomBytes } from 'node:crypto';
import { bootstrapSettings,connect,ident,literal } from '../../database/hosted.mjs';
import { migrate } from '../../database/migration-core.mjs';

export async function deliveredEnvironment({initialize=true}={}){
  const base=await bootstrapSettings();const admin=await connect(base.settings);const suffix=randomBytes(6).toString('hex');
  const database=`contigoo_delivery_${suffix}`;
  const roles=Object.fromEntries(['migrator','app','identity'].map(kind=>[kind,{user:`cd_${suffix}_${kind}`,password:randomBytes(32).toString('base64url')}]));
  let databaseCreated=false;const createdRoles=[];
  const settings=kind=>({...base.settings,CONTIGOO_DB_NAME:database,CONTIGOO_DB_USER:roles[kind].user,CONTIGOO_DB_PASSWORD:roles[kind].password});
  async function cleanup(){
    if(databaseCreated){await admin.query(`SET ROLE ${ident(roles.migrator.user)}`);try{await admin.query(`DROP DATABASE ${ident(database)}`);}finally{await admin.query('RESET ROLE');}}
    for(const name of [...createdRoles].reverse())await admin.query(`DROP ROLE ${ident(name)}`);
    await admin.end();
  }
  try{
    if((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount)throw new Error('Temporary database collision.');
    for(const credentials of Object.values(roles)){
      await admin.query(`CREATE ROLE ${ident(credentials.user)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${literal(credentials.password)}`);createdRoles.push(credentials.user);
    }
    await admin.query(`GRANT ${ident(roles.migrator.user)} TO ${ident(base.settings.CONTIGOO_DB_USER)} WITH INHERIT FALSE, SET TRUE`);
    await admin.query(`CREATE DATABASE ${ident(database)} OWNER ${ident(roles.migrator.user)} TEMPLATE template0`);databaseCreated=true;
    const migration=await connect(settings('migrator'));
    try{
      await migration.query(`REVOKE ALL ON DATABASE ${ident(database)} FROM PUBLIC; GRANT CONNECT ON DATABASE ${ident(database)} TO ${ident(roles.app.user)},${ident(roles.identity.user)}`);
      if(initialize){await migrate(migration,roles.app.user);
      await migration.query(`GRANT USAGE ON SCHEMA studio_auth,studio TO ${ident(roles.identity.user)};
        GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA studio_auth TO ${ident(roles.identity.user)};
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA studio_auth TO ${ident(roles.identity.user)};
        GRANT SELECT,INSERT,UPDATE,DELETE ON studio.principals,studio.project_assignments TO ${ident(roles.identity.user)};
        GRANT SELECT,UPDATE ON studio.employees TO ${ident(roles.identity.user)};
        GRANT SELECT ON studio.action_events,studio.audit_events TO ${ident(roles.identity.user)};
        GRANT EXECUTE ON FUNCTION studio.record_action(uuid,uuid,text,text,integer,uuid,uuid,uuid),studio.is_owner(),studio.actor_id() TO ${ident(roles.identity.user)}`);}
    }finally{await migration.end();}
    const pool=kind=>({host:base.settings.CONTIGOO_DB_HOST,port:Number(base.settings.CONTIGOO_DB_PORT),database,user:roles[kind].user,password:roles[kind].password,ssl:{rejectUnauthorized:true},max:3,idleTimeoutMillis:1000,connectionTimeoutMillis:15000,...(kind==='identity'?{options:'-c search_path=studio_auth,pg_catalog'}:{})});
    return{appDatabase:pool('app'),identityDatabase:pool('identity'),migrationDatabase:pool('migrator'),cleanup};
  }catch(error){await cleanup();throw error;}
}
