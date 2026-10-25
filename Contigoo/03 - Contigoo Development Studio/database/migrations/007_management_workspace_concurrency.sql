-- Direct delegated management must invalidate an owner's stale whole-workspace view.
CREATE FUNCTION studio.touch_workspace_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN UPDATE studio.workspace_settings SET revision=revision+1 WHERE id=1; RETURN NULL; END;
$$;
CREATE TRIGGER clients_workspace_revision AFTER INSERT OR UPDATE OR DELETE ON studio.clients FOR EACH ROW EXECUTE FUNCTION studio.touch_workspace_revision();
CREATE TRIGGER projects_workspace_revision AFTER INSERT OR UPDATE OR DELETE ON studio.projects FOR EACH ROW EXECUTE FUNCTION studio.touch_workspace_revision();
CREATE FUNCTION studio.lock_workspace_for_project(target uuid) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE revision bigint;
BEGIN
  IF NOT studio.can_access_project(target,true) THEN RAISE EXCEPTION 'Project management permission required' USING ERRCODE='42501'; END IF;
  SELECT w.revision INTO revision FROM studio.workspace_settings w WHERE id=1 FOR UPDATE;
  RETURN revision;
END;
$$;
REVOKE ALL ON FUNCTION studio.touch_workspace_revision(),studio.lock_workspace_for_project(uuid) FROM PUBLIC;
