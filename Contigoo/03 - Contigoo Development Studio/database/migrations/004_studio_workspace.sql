ALTER TABLE studio.projects ADD COLUMN studio_state jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(studio_state)='object');
CREATE TABLE studio.workspace_settings (
  id integer PRIMARY KEY CHECK(id=1), revision bigint NOT NULL DEFAULT 0,
  configuration jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(configuration)='object')
);
INSERT INTO studio.workspace_settings(id) VALUES (1);
ALTER TABLE studio.workspace_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_owner ON studio.workspace_settings USING(studio.is_owner()) WITH CHECK(studio.is_owner());

CREATE TABLE studio.project_apps (
  project_id uuid NOT NULL REFERENCES studio.projects(id) ON DELETE CASCADE,
  app_id text NOT NULL, enabled boolean NOT NULL, definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object'),
  PRIMARY KEY(project_id,app_id)
);
CREATE TABLE studio.app_records (
  project_id uuid NOT NULL, app_id text NOT NULL, entity_id text NOT NULL, id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0), "values" jsonb NOT NULL CHECK(jsonb_typeof("values")='object'),
  PRIMARY KEY(project_id,app_id,entity_id,id),
  FOREIGN KEY(project_id,app_id) REFERENCES studio.project_apps(project_id,app_id) ON DELETE CASCADE
);
CREATE TABLE studio.project_versions (
  project_id uuid NOT NULL REFERENCES studio.projects(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK(version>0), configuration jsonb NOT NULL CHECK(jsonb_typeof(configuration)='object'),
  published_at timestamptz, PRIMARY KEY(project_id,version)
);
ALTER TABLE studio.project_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio.app_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio.project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY apps_read ON studio.project_apps FOR SELECT USING(studio.can_access_project(project_id,false));
CREATE POLICY apps_owner ON studio.project_apps FOR ALL USING(studio.is_owner()) WITH CHECK(studio.is_owner());
CREATE POLICY records_read ON studio.app_records FOR SELECT USING(studio.can_access_project(project_id,false));
CREATE POLICY records_write ON studio.app_records FOR ALL USING(studio.can_access_project(project_id,true)) WITH CHECK(studio.can_access_project(project_id,true));
CREATE POLICY versions_read ON studio.project_versions FOR SELECT USING(studio.can_access_project(project_id,false));
CREATE POLICY versions_insert ON studio.project_versions FOR INSERT WITH CHECK(studio.is_owner());
REVOKE ALL ON ALL TABLES IN SCHEMA studio FROM PUBLIC;
