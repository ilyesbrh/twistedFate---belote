CREATE TABLE friendships (
  id                TEXT PRIMARY KEY,
  requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  CHECK (requester_user_id <> addressee_user_id),
  UNIQUE (requester_user_id, addressee_user_id)
);

CREATE INDEX friendships_requester ON friendships(requester_user_id);
CREATE INDEX friendships_addressee ON friendships(addressee_user_id);
