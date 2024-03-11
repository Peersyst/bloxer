--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE pending_event (
  event     TEXT,
  hash      TEXT,
  block     INTEGER     NOT NULL,
  data      BLOB        NOT NULL,
  PRIMARY KEY (event, hash)
);

CREATE TABLE last_event (
  event     TEXT,
  hash      TEXT,
  block     INTEGER     NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE pending_event;
DROP TABLE last_event;
