CREATE TABLE studio.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id uuid NOT NULL UNIQUE REFERENCES studio.principals(id) ON DELETE CASCADE,
  employee_code varchar(32) NOT NULL UNIQUE DEFAULT ('EMP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)))
    CHECK(employee_code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  display_name varchar(120) NOT NULL DEFAULT '', department varchar(120) NOT NULL DEFAULT '',
  job_title varchar(120) NOT NULL DEFAULT '', notes varchar(2000) NOT NULL DEFAULT '',
  revision bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO studio.employees(principal_id,display_name)
  SELECT p.id,coalesce(u.name,'') FROM studio.principals p LEFT JOIN studio_auth.auth_users u ON u.id=p.id WHERE p.kind='employee';
CREATE FUNCTION studio.create_employee_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM studio.principals WHERE id=NEW.id AND kind='employee') THEN
    INSERT INTO studio.employees(principal_id,display_name) VALUES(NEW.id,NEW.name);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER employee_profile_after_user AFTER INSERT ON studio_auth.auth_users FOR EACH ROW EXECUTE FUNCTION studio.create_employee_profile();
REVOKE ALL ON FUNCTION studio.create_employee_profile() FROM PUBLIC;

ALTER TABLE studio.audit_events ADD COLUMN request_id uuid,
  ADD COLUMN actor_name text, ADD COLUMN employee_code text,
  ADD COLUMN project_id uuid, ADD COLUMN project_name text,
  ADD COLUMN client_id uuid, ADD COLUMN client_name text,
  ADD COLUMN changed_fields text[] NOT NULL DEFAULT '{}';
CREATE INDEX audit_actor_time ON studio.audit_events(actor_id,occurred_at DESC);
CREATE INDEX audit_project_time ON studio.audit_events(project_id,occurred_at DESC);
CREATE OR REPLACE FUNCTION studio.audit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE data jsonb; old_data jsonb; actor uuid; actor_label text; reference text;
  project uuid; project_label text; client uuid; client_label text; fields text[]; request uuid;
BEGIN
  actor=studio.actor_id(); data=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  old_data=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  SELECT u.name,e.employee_code INTO actor_label,reference FROM studio_auth.auth_users u LEFT JOIN studio.employees e ON e.principal_id=u.id WHERE u.id=actor;
  IF TG_TABLE_NAME='projects' THEN
    project=(data->>'id')::uuid;project_label=data->>'name';client=(data->>'client_id')::uuid;
  ELSIF TG_TABLE_NAME='clients' THEN client=(data->>'id')::uuid;client_label=data->>'name';
  ELSIF TG_TABLE_NAME='app_records' THEN project=(data->>'project_id')::uuid;
    SELECT p.name,p.client_id INTO project_label,client FROM studio.projects p WHERE p.id=project;
  END IF;
  IF client_label IS NULL THEN SELECT c.name INTO client_label FROM studio.clients c WHERE c.id=client; END IF;
  SELECT coalesce(array_agg(key ORDER BY key),'{}') INTO fields FROM jsonb_each(data)
    WHERE key NOT IN ('created_at','updated_at','revision') AND (TG_OP<>'UPDATE' OR value IS DISTINCT FROM old_data->key);
  BEGIN request=nullif(current_setting('contigoo.request_id',true),'')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN request=NULL; END;
  INSERT INTO studio.audit_events(actor_id,entity,record_id,action,revision,request_id,actor_name,employee_code,project_id,project_name,client_id,client_name,changed_fields)
    VALUES(actor,TG_TABLE_NAME,(data->>'id')::uuid,TG_OP,coalesce((data->>'revision')::bigint,1),request,actor_label,reference,project,project_label,client,client_label,fields);
  RETURN NULL;
END;
$$;
CREATE TRIGGER employees_revision BEFORE UPDATE ON studio.employees FOR EACH ROW EXECUTE FUNCTION studio.bump_revision();
CREATE TRIGGER employees_audit AFTER INSERT OR UPDATE OR DELETE ON studio.employees FOR EACH ROW EXECUTE FUNCTION studio.audit_change();

CREATE TABLE studio.action_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, request_id uuid NOT NULL,
  actor_id uuid, actor_name text, employee_code text,
  action varchar(160) NOT NULL, method varchar(12) NOT NULL, status integer NOT NULL CHECK(status BETWEEN 100 AND 599),
  project_id uuid,project_name text,client_id uuid,client_name text,record_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX actions_actor_time ON studio.action_events(actor_id,occurred_at DESC);
CREATE INDEX actions_project_time ON studio.action_events(project_id,occurred_at DESC);
CREATE FUNCTION studio.record_action(actor uuid,request uuid,action_name text,http_method text,http_status integer,target_project uuid,target_client uuid,target_record uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor_label text;reference text;project_label text;client_label text;event_id bigint;
BEGIN
  SELECT u.name,e.employee_code INTO actor_label,reference FROM studio_auth.auth_users u LEFT JOIN studio.employees e ON e.principal_id=u.id WHERE u.id=actor;
  IF target_project IS NOT NULL THEN SELECT p.name,p.client_id INTO project_label,target_client FROM studio.projects p WHERE p.id=target_project; END IF;
  SELECT c.name INTO client_label FROM studio.clients c WHERE c.id=target_client;
  INSERT INTO studio.action_events(request_id,actor_id,actor_name,employee_code,action,method,status,project_id,project_name,client_id,client_name,record_id)
    VALUES(request,actor,actor_label,reference,action_name,http_method,http_status,target_project,project_label,target_client,client_label,target_record) RETURNING id INTO event_id;
  RETURN event_id;
END;
$$;
REVOKE ALL ON studio.employees,studio.action_events FROM PUBLIC;
REVOKE ALL ON FUNCTION studio.record_action(uuid,uuid,text,text,integer,uuid,uuid,uuid) FROM PUBLIC;
