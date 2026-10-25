import { z } from 'zod';
import type { Authentication,Actor } from './authentication.js';
import { fail } from './authentication.js';

const profile=z.object({employeeCode:z.string().regex(/^[A-Z0-9][A-Z0-9_-]{1,31}$/),name:z.string().trim().min(1).max(120),
  department:z.string().max(120),jobTitle:z.string().max(120),notes:z.string().max(2000),phone:z.string().max(40).optional(),revision:z.number().int().positive()}).strict();
export class Employees {
  constructor(private readonly identity:Authentication){}
  async list(){return(await this.identity.pool.query(`SELECT e.id,e.principal_id,e.employee_code,e.display_name AS name,e.department,e.job_title,e.notes,e.revision,
    p.active,u.email,(SELECT identifier FROM studio_auth.login_identifiers WHERE user_id=p.id AND kind='phone') AS phone,
    coalesce(jsonb_agg(jsonb_build_object('projectId',a.project_id,'canManage',a.can_manage)) FILTER(WHERE a.project_id IS NOT NULL),'[]') AS assignments
    FROM studio.employees e JOIN studio.principals p ON p.id=e.principal_id JOIN studio_auth.auth_users u ON u.id=p.id
    LEFT JOIN studio.project_assignments a ON a.principal_id=p.id GROUP BY e.id,p.id,u.id ORDER BY e.employee_code`)).rows;}
  async update(actor:Actor,principalId:string,input:unknown){
    const value=profile.parse(input);const c=await this.identity.pool.connect();
    try{await c.query('BEGIN');await c.query("SELECT set_config('contigoo.actor_id',$1,true),set_config('contigoo.request_id',$2,true)",[actor.id,actor.requestId||'']);
      const changed=await c.query(`UPDATE studio.employees SET employee_code=$1,display_name=$2,department=$3,job_title=$4,notes=$5
        WHERE principal_id=$6 AND revision=$7 RETURNING id,principal_id,employee_code,revision`,[value.employeeCode,value.name,value.department,value.jobTitle,value.notes,principalId,value.revision]);
      if(!changed.rowCount)fail(409,'Employee not found or profile changed. Reload before saving.');
      await c.query('UPDATE studio_auth.auth_users SET name=$1,"updatedAt"=now() WHERE id=$2',[value.name,principalId]);
      if(value.phone!==undefined)await this.identity.setPhoneOnClient(c,actor,principalId,value.phone);
      await c.query('COMMIT');return changed.rows[0];
    }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
  async audit(actor:Actor,query:any){
    const parsed=z.object({employeeId:z.uuid().optional(),projectId:z.uuid().optional(),action:z.string().max(100).optional(),
      from:z.iso.date().optional(),to:z.iso.date().optional(),outcome:z.enum(['all','success','denied','failed']).default('all'),
      page:z.coerce.number().int().min(0).max(10000).default(0)}).strict().parse(query);
    const c=await this.identity.pool.connect();
    try{await c.query('BEGIN');await c.query("SELECT set_config('contigoo.actor_id',$1,true)",[actor.id]);
      const result=await c.query(`WITH events AS (
        SELECT id,'request'::text AS source,occurred_at,request_id,actor_id,actor_name,employee_code,action,method,status,
          project_id,project_name,client_id,client_name,record_id,'{}'::text[] AS changed_fields FROM studio.action_events
        UNION ALL
        SELECT id,'change'::text,occurred_at,request_id,actor_id,actor_name,employee_code,action,entity,200,
          project_id,project_name,client_id,client_name,record_id,changed_fields FROM studio.audit_events
      ) SELECT events.*,
        coalesce(project_name,(SELECT h.project_name FROM studio.audit_events h WHERE h.project_id=events.project_id AND h.project_name IS NOT NULL AND h.occurred_at<=events.occurred_at ORDER BY h.occurred_at DESC,h.id DESC LIMIT 1)) AS display_project_name,
        coalesce(client_name,(SELECT h.client_name FROM studio.audit_events h WHERE h.project_id=events.project_id AND h.client_name IS NOT NULL AND h.occurred_at<=events.occurred_at ORDER BY h.occurred_at DESC,h.id DESC LIMIT 1)) AS display_client_name
      FROM events WHERE ($1::uuid IS NULL OR actor_id=$1) AND ($2::uuid IS NULL OR project_id=$2)
        AND ($3::text IS NULL OR action ILIKE '%'||$3||'%') AND ($4::date IS NULL OR occurred_at >= $4::date)
        AND ($5::date IS NULL OR occurred_at < $5::date + interval '1 day')
        AND ($6='all' OR ($6='success' AND status<400) OR ($6='denied' AND status IN(401,403)) OR ($6='failed' AND status>=400))
      ORDER BY occurred_at DESC,source DESC,id DESC LIMIT 50 OFFSET $7`,[parsed.employeeId||null,parsed.projectId||null,parsed.action||null,parsed.from||null,parsed.to||null,parsed.outcome,parsed.page*50]);
      await c.query('COMMIT');return{events:result.rows,page:parsed.page,pageSize:50};
    }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
}
