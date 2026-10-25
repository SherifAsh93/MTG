# Private Contigoo implementation

Read the parent project context and AGENTS.md. The owner approved this workspace and project-local Node dependencies on 23 September 2026.

- Use NestJS/TypeScript with the existing Studio interface and hosted PostgreSQL. Portable maintained-library authentication replaces the earlier Keycloak proposal by explicit owner approval.
- Never copy database configuration, auth secrets, passwords, session tokens, verification codes or real identity details into source, fixtures, logs, screenshots or the public prototype repository.
- Use synthetic isolated test accounts only. Protected owner setup must take actual credentials through the local browser, not hardcoded seeds.
- New SQL changes belong in versioned migrations under ../database/migrations; never modify applied SQL.
- Server authorization and validation must apply independently of UI controls. SQL transaction actors must come from verified sessions.
- This private implementation is not automatically published under the public-demo standing authorization.
- The first standalone target is a self-hostable web package and one DB per delivered solution, with separate credentials from internal Studio. Native mobile output is later scope.
