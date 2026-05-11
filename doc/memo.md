# CI/CD 구성 정리

## 전체 구조

```
GitHub (소스코드)
    |
    | git push
    v
Jenkins (EC2 내 직접 설치)
    |
    | Jenkinsfile 파이프라인 실행
    v
Docker Compose (EC2 내)
    |
    |-- node-app 컨테이너 (Node.js 서버)
    |-- mysql-db 컨테이너 (MySQL 8.0)
```

---

## EC2 구성

하나의 EC2 인스턴스 안에 아래 세 가지가 함께 실행됩니다.

| 구성 요소 | 종류 | 설명 |
|-----------|------|------|
| Jenkins | EC2에 직접 설치 | 파이프라인 실행 주체 |
| node-app | Docker 컨테이너 | Node.js Express 서버, 포트 3000 |
| mysql-db | Docker 컨테이너 | MySQL 8.0, 포트 3306 |

---

## Jenkins 파이프라인 흐름 (Jenkinsfile)

```
1. Checkout
   - GitHub에서 코드 체크아웃
   - Jenkins Credentials(app-env-file)에서 .env 파일을 workspace로 복사

2. Build
   - docker compose build로 node-app 이미지 빌드

3. Test
   - 빌드된 이미지에서 npm test 실행

4. Deploy
   - docker compose down으로 기존 컨테이너 중지 및 삭제
   - docker compose up -d로 새 컨테이너 실행

post
   - 성공: 배포 성공 메시지 출력
   - 실패: docker compose up -d로 이전 컨테이너 복구 시도
```

---

## Docker Compose 구성 (docker-compose.yml)

### node-app 컨테이너
- 이미지: Dockerfile로 직접 빌드 (node:20-alpine 기반)
- 포트: 3000:3000
- .env 파일로 환경변수 주입
- mysql-db가 healthy 상태일 때만 시작 (depends_on)
- restart: unless-stopped

### mysql-db 컨테이너
- 이미지: mysql:8.0
- 포트: 3306:3306
- 볼륨: cicd_mysql-data (데이터 영속성)
- 초기화: init.sql이 최초 실행 시 자동 적용 (users 테이블 생성)
- healthcheck: mysqladmin ping (10초 간격, 5회 재시도)
- restart: unless-stopped

---

## 환경변수 관리 (.env)

- 로컬에는 `.env` 파일로 관리 (git 제외)
- Jenkins에는 Credentials(Secret file, ID: app-env-file)로 등록
- 파이프라인 실행 시 workspace로 복사되어 docker compose에 주입

```
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=...
DB_NAME=cicd_db
MYSQL_ROOT_PASSWORD=...
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /example | 기본 응답 테스트 |
| GET | /db-example | DB 연결 테스트 (users 테이블 조회) |
