import { Client } from 'pg';
import { connection } from './config.js';
import { migrate,ident } from '../../database/migration-core.mjs';

let client:Client|undefined;
try{
  if(!process.env.MIGRATION_DATABASE_URL||!process.env.APP_DATABASE_ROLE||!process.env.IDENTITY_DATABASE_ROLE)throw new Error('Migration URL and role names are required.');
  client=new Client(connection(process.env.MIGRATION_DATABASE_URL));await client.connect();
  const database=(await client.query('SELECT datname,pg_get_userbyid(datdba)=current_user AS owned FROM pg_database WHERE datname=current_database()')).rows[0];
  if(!database?.owned)throw new Error('The migration role must own the selected database.');
  const installed=await migrate(client,process.env.APP_DATABASE_ROLE);
  const identity=ident(process.env.IDENTITY_DATABASE_ROLE);
  await client.query('BEGIN');
  try{
    const databaseName='"'+database.datname.replaceAll('"','""')+'"';
    await client.query(`REVOKE ALL ON DATABASE ${databaseName} FROM PUBLIC; GRANT CONNECT ON DATABASE ${databaseName} TO ${ident(process.env.APP_DATABASE_ROLE)},${identity}`);
    await client.query(`GRANT USAGE ON SCHEMA studio_auth,studio TO ${identity};
      GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA studio_auth TO ${identity};
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA studio_auth TO ${identity};
      GRANT SELECT,INSERT,UPDATE,DELETE ON studio.principals,studio.project_assignments TO ${identity};
      GRANT SELECT,UPDATE ON studio.employees TO ${identity};
      GRANT SELECT ON studio.action_events,studio.audit_events TO ${identity};
      GRANT EXECUTE ON FUNCTION studio.record_action(uuid,uuid,text,text,integer,uuid,uuid,uuid),studio.is_owner(),studio.actor_id() TO ${identity}`);
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}
  console.log(JSON.stringify({status:'Passed',installed,scope:'Portable SQL migration; no Neon APIs or laptop configuration required'}));
}catch{console.error('Portable migration failed. Verify server-only connection settings and role ownership; credentials were not logged.');process.exitCode=1;}
finally{if(client)await client.end();}
