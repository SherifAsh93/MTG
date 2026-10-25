CREATE SCHEMA studio_auth;
REVOKE ALL ON SCHEMA studio_auth FROM PUBLIC;
CREATE TABLE studio_auth.auth_users (
  id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false, image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX auth_email_normalized ON studio_auth.auth_users(lower(email));
CREATE TABLE studio_auth.auth_sessions (
  id uuid PRIMARY KEY, "expiresAt" timestamptz NOT NULL, token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text, "userAgent" text, "userId" uuid NOT NULL REFERENCES studio_auth.auth_users(id) ON DELETE CASCADE
);
CREATE INDEX auth_sessions_user ON studio_auth.auth_sessions("userId");
CREATE TABLE studio_auth.auth_accounts (
  id uuid PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES studio_auth.auth_users(id) ON DELETE CASCADE,
  "accessToken" text, "refreshToken" text, "idToken" text,
  "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz,
  scope text, password text, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("providerId", "accountId")
);
CREATE INDEX auth_accounts_user ON studio_auth.auth_accounts("userId");
CREATE TABLE studio_auth.auth_verifications (
  id uuid PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
  "expiresAt" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_verifications_identifier ON studio_auth.auth_verifications(identifier);
CREATE TABLE studio_auth.login_identifiers (
  identifier text PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('username','email','phone')),
  user_id uuid NOT NULL REFERENCES studio_auth.auth_users(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT false, UNIQUE (user_id,kind)
);
CREATE TABLE studio_auth.login_limits (
  key text PRIMARY KEY, attempts integer NOT NULL CHECK (attempts > 0), expires_at timestamptz NOT NULL
);
CREATE TABLE studio_auth.security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid, subject_id uuid, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA studio_auth FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA studio_auth FROM PUBLIC;
