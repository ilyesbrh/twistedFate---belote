CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname      TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE guests (
  id                  TEXT PRIMARY KEY,
  nickname            TEXT NOT NULL,
  created_at          INTEGER NOT NULL,
  upgraded_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id)  ON DELETE CASCADE,
  guest_id    TEXT REFERENCES guests(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  CHECK ((user_id IS NULL) <> (guest_id IS NULL))
);

CREATE INDEX sessions_user_id  ON sessions(user_id);
CREATE INDEX sessions_guest_id ON sessions(guest_id);
CREATE INDEX sessions_expires  ON sessions(expires_at);
