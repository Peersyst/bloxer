--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE pending_event (
  event TEXT NOT NULL,
  hash TEXT NOT NULL,
  i INTEGER DEFAULT 0 NOT NULL,
  block INTEGER NOT NULL,
  data BLOB,
  PRIMARY KEY (event, hash, i)
);

CREATE TABLE last_event (
  event TEXT,
  hash TEXT,
  i INTEGER DEFAULT 0,
  block INTEGER NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE pending_event;
DROP TABLE last_event;
