import { betterAuth } from 'better-auth';
import { hashPassword,verifyPassword } from 'better-auth/crypto';
import { fromNodeHeaders } from 'better-auth/node';
import { Pool, type PoolClient } from 'pg';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { HttpException } from '@nestjs/common';
import { z } from 'zod';
import type { Request } from 'express';
import type { Configuration } from './config.js';

export const fail = (status: number, message: string): never => { throw new HttpException({ message }, status); };
export interface Actor { id: string; name: string; email: string; kind: 'owner' | 'employee'; requestId?:string; }
export function normalizeIdentifier(input: unknown): { value: string; kind: 'username' | 'email' | 'phone' } {
  if (typeof input !== 'string' || input.length > 254) return fail(400, 'Enter a valid login identifier.');
  const value = input.trim().toLowerCase();
  if (value.includes('@')) {
    if (!z.email().safeParse(value).success) return fail(400, 'Enter a valid email.');
    return { value, kind: 'email' };
  }
  if (value.startsWith('+')) {
    const phone = parsePhoneNumberFromString(value);
    if (!phone?.isValid()) return fail(400, 'Enter a valid phone number with +country code.');
    if(phone.ext)return fail(400,'Phone-login extensions are not supported. Use a direct international number.');
    return { value: phone.number, kind: 'phone' };
  }
  if(/^[0-9()\s-]+$/.test(value))return fail(400,'For phone login, include the international +country code.');
  if (!/^[a-z][a-z0-9_.-]{2,29}$/.test(value)) return fail(400, 'Use a username of 3–30 letters, digits, dots, dashes or underscores.');
  return { value, kind: 'username' };
}
export class Authentication {
  readonly pool: Pool;
  readonly auth;
  readonly issuer:string;
  constructor(readonly config: Configuration) {
    this.issuer=config.delivery?`contigoo:delivered:${config.delivery.projectId}`:'contigoo:portable-auth';
    this.pool = new Pool(config.identityDatabase);
    this.pool.on('error', () => console.error('Identity database connection error.'));
    this.auth = betterAuth({
      appName: 'Contigoo Studio', database: this.pool, baseURL: config.origin, secret: config.authSecret,
      trustedOrigins: [config.origin],
      emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12, maxPasswordLength: 128 },
      user: { modelName: 'auth_users' },
      account: { modelName: 'auth_accounts', accountLinking: { enabled: false } },
      verification: { modelName: 'auth_verifications' },
      session: { modelName: 'auth_sessions', expiresIn: 8 * 3600, updateAge: 1800, freshAge: 600, cookieCache: { enabled: false } },
      advanced: { database: { generateId: () => randomUUID() }, cookiePrefix: config.delivery ? `contigoo-app-${config.delivery.projectId}` : 'contigoo-studio', useSecureCookies: config.origin.startsWith('https:'),
        defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' } },
      logger: { disabled: true },
    });
  }
  async actor(req: Request): Promise<Actor> {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) return fail(401, 'Sign in to continue.');
    const result = await this.pool.query('SELECT kind,active FROM studio.principals WHERE id=$1 AND issuer=$2', [session.user.id,this.issuer]);
    if (!result.rows[0]?.active) return fail(401, 'This account is not active.');
    const actor={ id: session.user.id, name: session.user.name, email: session.user.email, kind: result.rows[0].kind,requestId:(req as any).auditRequestId };
    (req as any).auditActor=actor;return actor;
  }
  async owner(req: Request): Promise<Actor> {
    const actor = await this.actor(req); if (actor.kind !== 'owner') return fail(403, 'Owner permission required.'); return actor;
  }
  async limited(key: string, max = 10) {
    const hashed = createHmac('sha256', this.config.authSecret).update(key).digest('hex');
    const { rows } = await this.pool.query(`INSERT INTO studio_auth.login_limits(key,attempts,expires_at) VALUES ($1,1,now()+interval '15 minutes')
      ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN studio_auth.login_limits.expires_at<now() THEN 1 ELSE studio_auth.login_limits.attempts+1 END,
        expires_at=CASE WHEN studio_auth.login_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE studio_auth.login_limits.expires_at END RETURNING attempts`, [hashed]);
    if (rows[0].attempts > max) return fail(429, 'Too many attempts. Try again later.');
  }
  async login(req: Request): Promise<Response> {
    await this.limited(`ip:${req.ip}`, 60);
    const identifier = normalizeIdentifier(req.body?.identifier);
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 128) return fail(401, 'Invalid credentials.');
    const { rows } = await this.pool.query(`SELECT u.id,u.name,u.email,p.kind,p.active,i.verified FROM studio_auth.login_identifiers i
      JOIN studio_auth.auth_users u ON u.id=i.user_id JOIN studio.principals p ON p.id=u.id WHERE i.identifier=$1 AND p.issuer=$2`, [identifier.value,this.issuer]);
    await this.limited(rows[0]?.id?`account:${rows[0].id}`:`identifier:${identifier.value}`);
    // These are owner-provisioned password-login aliases. The verification flag
    // separately records external ownership verification; association is not SMS proof.
    const allowed = rows[0]?.active;
    // Better Auth performs password verification and generates the signed HttpOnly session cookie.
    const response=await this.auth.api.signInEmail({ body: { email: allowed ? rows[0].email : `unmatched-${randomUUID()}@invalid.example`, password },
      headers: fromNodeHeaders(req.headers), asResponse: true });
    if(!allowed)return Response.json({message:'Invalid credentials.'},{status:401});
    if(response.ok&&allowed)(req as any).auditActor={id:rows[0].id,name:rows[0].name,email:rows[0].email,kind:rows[0].kind};
    return response;
  }
  validSetupToken(value: unknown) {
    const expected = Buffer.from(this.config.bootstrapToken);
    const supplied = Buffer.from(typeof value === 'string' ? value : '');
    return expected.length >= 32 && supplied.length === expected.length && timingSafeEqual(supplied, expected);
  }
  async identifiers(actor:Actor){return(await this.pool.query('SELECT kind,identifier,verified FROM studio_auth.login_identifiers WHERE user_id=$1 ORDER BY kind',[actor.id])).rows;}
  async setPhoneOnClient(client:PoolClient,actor:Actor,userId:string,value:string){
    const phone=value.trim()?normalizeIdentifier(value):null;if(phone&&phone.kind!=='phone')return fail(400,'Phone requires an international +country code.');
    const previous=(await client.query("SELECT identifier FROM studio_auth.login_identifiers WHERE user_id=$1 AND kind='phone'",[userId])).rows[0]?.identifier||'';
    if(previous===(phone?.value||''))return false;
    await client.query("DELETE FROM studio_auth.login_identifiers WHERE user_id=$1 AND kind='phone'",[userId]);
    if(phone)await client.query("INSERT INTO studio_auth.login_identifiers(identifier,kind,user_id,verified) VALUES($1,'phone',$2,false)",[phone.value,userId]);
    await client.query('DELETE FROM studio_auth.auth_sessions WHERE "userId"=$1',[userId]);
    await client.query('INSERT INTO studio_auth.security_events(actor_id,subject_id,action) VALUES($1,$2,$3)',[actor.id,userId,'phone_login_association_changed']);
    await client.query('SELECT studio.record_action($1,$2,$3,$4,200,NULL,NULL,$5)',[actor.id,actor.requestId||randomUUID(),'CHANGE phone login association','IDENTITY',userId]);
    return true;
  }
  async changeOwnPhone(actor:Actor,input:any){
    await this.limited(`phone-change:${actor.id}`,5);
    if(typeof input.currentPassword!=='string'||typeof input.phone!=='string'||input.currentPassword.length>128)return fail(400,'Current password and phone are required.');
    const account=(await this.pool.query('SELECT password FROM studio_auth.auth_accounts WHERE "userId"=$1 AND "providerId"=$2',[actor.id,'credential'])).rows[0];
    if(!account?.password||!await verifyPassword({hash:account.password,password:input.currentPassword}))return fail(401,'Current password is incorrect.');
    const client=await this.pool.connect();try{await client.query('BEGIN');const changed=await this.setPhoneOnClient(client,actor,actor.id,input.phone);await client.query('COMMIT');return{saved:true,signInAgain:changed};}
    catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  async provision(input: any, kind: 'owner' | 'employee', actor?: Actor): Promise<{ id: string }> {
    const username = normalizeIdentifier(input.username); const email = normalizeIdentifier(input.email);
    if (username.kind !== 'username' || email.kind !== 'email') return fail(400, 'Username and email must be entered in their correct fields.');
    if(input.phone!==undefined&&typeof input.phone!=='string')return fail(400,'Phone must be an international number string.');
    const phone = input.phone ? normalizeIdentifier(input.phone) : null;
    if (phone && phone.kind !== 'phone') return fail(400, 'Phone requires an international +country code.');
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) return fail(400, 'Enter a name of at most 120 characters.');
    if (typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) return fail(400, 'Password must be 12–128 characters.');
    if (kind === 'employee' && actor?.kind !== 'owner') return fail(403, 'Owner permission required.');
    const passwordHash = await hashPassword(input.password);
    const id = randomUUID(); const client = await this.pool.connect();
    try {
      await client.query('BEGIN'); await client.query('SELECT pg_advisory_xact_lock(85423018)');
      await client.query("SELECT set_config('contigoo.actor_id',$1,true),set_config('contigoo.request_id',$2,true)",[actor?.id||id,actor?.requestId||'']);
      if (kind === 'owner' && (await client.query("SELECT 1 FROM studio.principals WHERE kind='owner'")).rowCount) return fail(409, 'Owner setup has already been completed.');
      await client.query('INSERT INTO studio.principals(id,issuer,subject,kind) VALUES ($1,$2,$3,$4)', [id, this.issuer, id, kind]);
      await client.query('INSERT INTO studio_auth.auth_users(id,name,email) VALUES ($1,$2,$3)', [id, input.name.trim(), email.value]);
      await client.query('INSERT INTO studio_auth.auth_accounts(id,"accountId","providerId","userId",password) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), id, 'credential', id, passwordHash]);
      for (const item of [username, email, phone].filter(Boolean)) {
        await client.query('INSERT INTO studio_auth.login_identifiers(identifier,kind,user_id,verified) VALUES ($1,$2,$3,$4)', [item!.value, item!.kind, id, false]);
      }
      if(kind==='employee'&&this.config.delivery){
        await client.query('INSERT INTO studio.project_assignments(principal_id,project_id,can_manage) VALUES($1,$2,$3)',[id,this.config.delivery.projectId,input.writeAccess===true]);
      }
      await client.query('INSERT INTO studio_auth.security_events(actor_id,subject_id,action) VALUES ($1,$2,$3)', [actor?.id || id, id, `${kind}_created`]);
      await client.query('COMMIT'); return { id };
    } catch (error: any) { await client.query('ROLLBACK'); if (error.code === '23505') return fail(409, 'An account identifier is already in use.'); throw error; }
    finally { client.release(); }
  }
  async users() {
    return (await this.pool.query(`SELECT p.id,p.kind,p.active,u.name,u.email,
      coalesce(jsonb_object_agg(i.kind,jsonb_build_object('value',i.identifier,'verified',i.verified)) FILTER(WHERE i.kind IS NOT NULL),'{}') AS identifiers
      FROM studio.principals p JOIN studio_auth.auth_users u ON u.id=p.id LEFT JOIN studio_auth.login_identifiers i ON i.user_id=u.id
      GROUP BY p.id,u.id ORDER BY p.created_at`)).rows;
  }
  async disable(id: string, active: boolean, actor: Actor) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const changed = await client.query("UPDATE studio.principals SET active=$1 WHERE id=$2 AND kind='employee' RETURNING id", [active, id]);
      if (!changed.rowCount) return fail(404, 'Employee not found. The owner cannot be disabled.');
      if (!active) await client.query('DELETE FROM studio_auth.auth_sessions WHERE "userId"=$1', [id]);
      await client.query('INSERT INTO studio_auth.security_events(actor_id,subject_id,action) VALUES ($1,$2,$3)', [actor.id, id, active ? 'employee_enabled' : 'employee_disabled']);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
}
