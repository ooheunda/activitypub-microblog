CREATE TABLE IF NOT EXISTS users (
  id       INTEGER NOT NULL PRIMARY KEY CHECK (id = 1), -- only one record
  username TEXT    NOT NULL UNIQUE      CHECK (trim(lower(username)) = username
                                               AND username <> ''
                                               AND length(username) <= 50)
);

CREATE TABLE IF NOT EXISTS actors (
  id               INTEGER NOT NULL PRIMARY KEY,
  user_id          INTEGER          REFERENCES users (id),
  uri              TEXT    NOT NULL UNIQUE CHECK (uri <> ''),
  handle           TEXT    NOT NULL UNIQUE CHECK (handle <> ''),
  name             TEXT,
  inbox_url        TEXT    NOT NULL UNIQUE CHECK (inbox_url LIKE 'https://%'
                                                  OR inbox_url LIKE 'http://%'),
  shared_inbox_url TEXT                    CHECK (shared_inbox_url
                                                  LIKE 'https://%'
                                                  OR shared_inbox_url
                                                  LIKE 'http://%'),
  url              TEXT                    CHECK (url LIKE 'https://%'
                                                  OR url LIKE 'http://%'),
  created          TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP)
                                           CHECK (created <> '')
);

CREATE TABLE IF NOT EXISTS keys (
  user_id     INTEGER NOT NULL REFERENCES users (id),
  type        TEXT    NOT NULL CHECK (type IN ('RSASSA-PKCS1-v1_5', 'Ed25519')),
  private_key TEXT    NOT NULL CHECK (private_key <> ''),
  public_key  TEXT    NOT NULL CHECK (public_key <> ''),
  created     TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP) CHECK (created <> ''),
  PRIMARY KEY (user_id, type)
);
-- type IN (RSA_PKCS#1-v1.5, Ed25519) 형식을 따름

-- sqlite3 microblog.sqlite3 < src/schema.sql 로 베이스 파일 생성
-- echo "SELECT * FROM users;" | sqlite3 -table microblog.sqlite3 로 Query Execute