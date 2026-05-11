# 인프라 구성

## EC2 구성 요소

하나의 EC2 인스턴스에서 아래 세 가지가 함께 실행됩니다.

| 구성 요소 | 실행 방식 | 포트 |
|-----------|-----------|------|
| Jenkins | EC2에 직접 설치 | 8080 |
| node-app | Docker 컨테이너 | 3000 |
| mysql-db | Docker 컨테이너 | 3306 |

---

## Dockerfile

```dockerfile
FROM node:20-alpine       # 경량 베이스 이미지
WORKDIR /app
COPY package*.json ./
RUN npm ci                # 재현 가능한 설치 (npm install 대신 사용)
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**포인트:**
- Alpine Linux 기반 → 최소한의 이미지 크기
- `npm ci`: `package-lock.json` 기반으로 정확히 일치하는 버전 설치 (CI 환경에 적합)
- `COPY . .` 전에 `package*.json`을 먼저 복사 → 의존성 레이어 캐싱 최적화

---

## Docker Compose

### node-app 서비스

```yaml
app:
  build: .
  container_name: node-app
  ports:
    - "3000:3000"
  env_file:
    - .env
  depends_on:
    mysql:
      condition: service_healthy    # MySQL이 healthy 상태가 될 때까지 대기
  restart: unless-stopped
```

### mysql-db 서비스

```yaml
mysql:
  image: mysql:8.0
  container_name: mysql-db
  ports:
    - "3306:3306"
  volumes:
    - mysql-data:/var/lib/mysql      # 데이터 영속성 보장
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # 최초 실행 시 자동 적용
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

**포인트:**
- `depends_on: condition: service_healthy` → MySQL이 준비되기 전 node-app이 먼저 뜨는 문제 방지
- `init.sql`이 `/docker-entrypoint-initdb.d/`에 마운트되면 최초 컨테이너 생성 시에만 자동 실행
- `mysql-data` 볼륨: 컨테이너 재생성 시에도 데이터 유지

---

## DB 초기화 (init.sql)

```sql
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob',   'bob@example.com');
```

---

## 환경변수 (.env)

| 변수 | 설명 |
|------|------|
| `PORT` | 애플리케이션 포트 (기본 3000) |
| `DB_HOST` | MySQL 호스트 (`mysql` — docker-compose 서비스명) |
| `DB_PORT` | MySQL 포트 (3306) |
| `DB_USER` | MySQL 사용자 |
| `DB_PASSWORD` | MySQL 사용자 비밀번호 |
| `DB_NAME` | 데이터베이스 이름 |
| `MYSQL_ROOT_PASSWORD` | MySQL root 비밀번호 |

- 로컬: `.env` 파일로 관리 (`.gitignore`에 포함)
- Jenkins: Credentials(Secret file, ID: `app-env-file`)로 등록 후 파이프라인에서 워크스페이스에 복사
