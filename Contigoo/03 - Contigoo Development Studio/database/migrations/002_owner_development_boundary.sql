-- Delegated project management does not grant Studio development authority.
CREATE FUNCTION studio.guard_project_model() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.draft_model IS DISTINCT FROM OLD.draft_model AND NOT studio.is_owner() THEN
    RAISE EXCEPTION 'Only the Studio owner can change the application model' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION studio.guard_project_model() FROM PUBLIC;
CREATE TRIGGER projects_model_owner BEFORE UPDATE ON studio.projects
  FOR EACH ROW EXECUTE FUNCTION studio.guard_project_model();
