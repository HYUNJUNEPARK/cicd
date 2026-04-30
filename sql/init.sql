-- DB 생성
CREATE DATABASE IF NOT EXISTS cicd_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- DB 선택
USE cicd_db;

-- 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 더미 데이터
INSERT INTO users (name, email) VALUES
  ('Alice',   'alice@example.com'),
  ('Bob',     'bob@example.com'),
  ('Charlie', 'charlie@example.com');
