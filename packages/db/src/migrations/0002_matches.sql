CREATE TABLE matches (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL,
  started_at     INTEGER NOT NULL,
  ended_at       INTEGER NOT NULL,
  target_score   INTEGER NOT NULL,
  final_score_ns INTEGER NOT NULL,
  final_score_ew INTEGER NOT NULL,
  winner_team    INTEGER NOT NULL CHECK (winner_team IN (0, 1))
);

CREATE TABLE match_seats (
  match_id   TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  seat       INTEGER NOT NULL CHECK (seat IN (0, 1, 2, 3)),
  user_id    TEXT REFERENCES users(id)  ON DELETE SET NULL,
  guest_id   TEXT REFERENCES guests(id) ON DELETE SET NULL,
  nickname   TEXT NOT NULL,
  PRIMARY KEY (match_id, seat),
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

CREATE INDEX match_seats_user_id  ON match_seats(user_id);
CREATE INDEX match_seats_guest_id ON match_seats(guest_id);
CREATE INDEX matches_ended_at     ON matches(ended_at);
