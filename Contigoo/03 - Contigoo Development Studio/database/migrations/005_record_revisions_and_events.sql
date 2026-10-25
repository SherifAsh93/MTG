ALTER TABLE studio.app_records ADD COLUMN revision bigint NOT NULL DEFAULT 1 CHECK(revision>0);
CREATE TRIGGER app_records_audit AFTER INSERT OR UPDATE OR DELETE ON studio.app_records
  FOR EACH ROW EXECUTE FUNCTION studio.audit_change();
CREATE TABLE studio.record_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES studio.projects(id) ON DELETE CASCADE,
  app_id text NOT NULL, entity_id text NOT NULL, record_id uuid NOT NULL,
  actor_id uuid, note varchar(2000) NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE studio.record_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY record_events_read ON studio.record_events FOR SELECT USING(studio.can_access_project(project_id,false));
CREATE POLICY record_events_insert ON studio.record_events FOR INSERT WITH CHECK(studio.can_access_project(project_id,true) AND actor_id=studio.actor_id());
REVOKE ALL ON studio.record_events FROM PUBLIC;
