-- Internal Studio control schema. No credentials or real identities are seeded.
CREATE SCHEMA studio;
REVOKE ALL ON SCHEMA studio FROM PUBLIC;

CREATE TABLE studio.principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL CHECK (length(issuer) BETWEEN 1 AND 500),
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 500),
  kind text NOT NULL CHECK (kind IN ('owner', 'employee')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, subject)
);
CREATE UNIQUE INDEX studio_single_owner ON studio.principals (kind) WHERE kind = 'owner';

CREATE TABLE studio.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0),
  contact varchar(160) NOT NULL DEFAULT '',
  email varchar(254) NOT NULL DEFAULT '',
  phone varchar(40) NOT NULL DEFAULT '',
  industry varchar(120) NOT NULL DEFAULT '',
  address varchar(1000) NOT NULL DEFAULT '',
  notes varchar(5000) NOT NULL DEFAULT '',
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE studio.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES studio.clients(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0),
  description varchar(2000) NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  draft_model jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(draft_model) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_client ON studio.projects(client_id);
CREATE TABLE studio.project_assignments (
  principal_id uuid NOT NULL REFERENCES studio.principals(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES studio.projects(id) ON DELETE CASCADE,
  can_manage boolean NOT NULL DEFAULT false,
  PRIMARY KEY (principal_id, project_id)
);
CREATE INDEX assignments_project ON studio.project_assignments(project_id);
CREATE TABLE studio.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  entity text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  revision bigint NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_record ON studio.audit_events(entity, record_id, occurred_at);

-- The trusted API must derive this transaction-local identity from a verified session.
-- Clients/browser input must never be allowed to choose the actor. This is not login.
CREATE FUNCTION studio.actor_id() RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path = pg_catalog AS $$
BEGIN
  RETURN nullif(current_setting('contigoo.actor_id', true), '')::uuid;
EXCEPTION WHEN invalid_text_representation THEN RETURN NULL;
END;
$$;
CREATE FUNCTION studio.is_owner() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM studio.principals
    WHERE id = studio.actor_id() AND kind = 'owner' AND active);
$$;
CREATE FUNCTION studio.can_access_project(target uuid, write_access boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT studio.is_owner() OR EXISTS (
    SELECT 1 FROM studio.project_assignments a JOIN studio.principals p ON p.id = a.principal_id
    WHERE p.id = studio.actor_id() AND p.active AND a.project_id = target
      AND (NOT write_access OR a.can_manage));
$$;
CREATE FUNCTION studio.can_read_client(target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT studio.is_owner() OR EXISTS (
    SELECT 1 FROM studio.projects p WHERE p.client_id = target AND studio.can_access_project(p.id, false));
$$;

ALTER TABLE studio.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_read ON studio.clients FOR SELECT USING (studio.can_read_client(id));
CREATE POLICY clients_insert ON studio.clients FOR INSERT WITH CHECK (studio.is_owner());
CREATE POLICY clients_update ON studio.clients FOR UPDATE USING (studio.is_owner()) WITH CHECK (studio.is_owner());
CREATE POLICY clients_delete ON studio.clients FOR DELETE USING (studio.is_owner());
ALTER TABLE studio.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_read ON studio.projects FOR SELECT USING (studio.can_access_project(id, false));
CREATE POLICY projects_insert ON studio.projects FOR INSERT WITH CHECK (studio.is_owner());
CREATE POLICY projects_update ON studio.projects FOR UPDATE USING (studio.can_access_project(id, true)) WITH CHECK (studio.can_access_project(id, true));
CREATE POLICY projects_delete ON studio.projects FOR DELETE USING (studio.is_owner());
ALTER TABLE studio.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_owner_read ON studio.audit_events FOR SELECT USING (studio.is_owner());

CREATE FUNCTION studio.bump_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  NEW.revision = OLD.revision + 1;
  NEW.created_at = OLD.created_at;
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;
CREATE FUNCTION studio.audit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE changed_id uuid; changed_revision bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN changed_id = OLD.id; changed_revision = OLD.revision;
  ELSE changed_id = NEW.id; changed_revision = NEW.revision; END IF;
  INSERT INTO studio.audit_events(actor_id, entity, record_id, action, revision)
    VALUES (studio.actor_id(), TG_TABLE_NAME, changed_id, TG_OP, changed_revision);
  RETURN NULL;
END;
$$;
CREATE TRIGGER clients_revision BEFORE UPDATE ON studio.clients FOR EACH ROW EXECUTE FUNCTION studio.bump_revision();
CREATE TRIGGER projects_revision BEFORE UPDATE ON studio.projects FOR EACH ROW EXECUTE FUNCTION studio.bump_revision();
CREATE TRIGGER clients_audit AFTER INSERT OR UPDATE OR DELETE ON studio.clients FOR EACH ROW EXECUTE FUNCTION studio.audit_change();
CREATE TRIGGER projects_audit AFTER INSERT OR UPDATE OR DELETE ON studio.projects FOR EACH ROW EXECUTE FUNCTION studio.audit_change();
REVOKE ALL ON ALL TABLES IN SCHEMA studio FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA studio FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA studio FROM PUBLIC;
