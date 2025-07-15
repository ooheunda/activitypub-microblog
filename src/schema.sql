CREATE TABLE IF NOT EXISTS users (
  id       INTEGER NOT NULL PRIMARY KEY CHECK (id = 1), -- only one record
  username TEXT    NOT NULL UNIQUE      CHECK (trim(lower(username)) = username
                                               AND username <> ''
                                               AND length(username) <= 50)
);

-- sqlite3 microblog.sqlite3 < src/schema.sql 로 베이스 파일 생성
-- echo "SELECT * FROM users;" | sqlite3 -table microblog.sqlite3 로 Query Execute