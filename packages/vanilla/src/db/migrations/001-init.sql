--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE pending_event (
  hash      TEXT        PRIMARY KEY,
  block     INTEGER     NOT NULL,
  data      TEXT        NOT NULL
);

CREATE TABLE last_event (
  hash      TEXT        PRIMARY KEY,
  block     INTEGER     NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE pending_event;
DROP TABLE last_event;
