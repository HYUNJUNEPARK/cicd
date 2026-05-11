# 애플리케이션 구조 및 API

## 애플리케이션 레이어

```
server.js          ← 진입점, 포트 Listen
└── src/app.js     ← Express 초기화, 미들웨어/라우트 등록
    ├── middlewares/logger.js         ← 요청 로깅
    ├── middlewares/errorHandler.js   ← 에러 처리
    ├── routes/example.route.js       ← /example
    ├── routes/dbExample.route.js     ← /db-example
    ├── handlers/example.handler.js
    ├── handlers/dbExample.handler.js
    └── db/pool.js                    ← MySQL 커넥션 풀
```

---

## API 엔드포인트

### GET /example

기본 응답 테스트 엔드포인트.

**응답 예시:**
```json
{
  "status": "success",
  "message": "Hello from example API!",
  "timestamp": "2025-05-11T00:00:00.000Z"
}
```

### GET /db-example

MySQL 연결 테스트. `users` 테이블의 모든 행을 반환.

**응답 예시 (성공):**
```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "Alice", "email": "alice@example.com", "created_at": "..." },
    { "id": 2, "name": "Bob",   "email": "bob@example.com",   "created_at": "..." }
  ]
}
```

**응답 예시 (DB 오류):**
```json
{
  "status": "error",
  "message": "DB 연결 실패"
}
```
HTTP 500 반환.

---

## 미들웨어

### logger.js

```
[2025-05-11T00:00:00.000Z] GET /example 200 12ms
```

모든 요청에 대해 타임스탬프, HTTP 메서드, URL, 상태코드, 응답시간을 출력.

### errorHandler.js

라우트 핸들러에서 발생한 에러를 캐치하여 일관된 형식으로 응답.
- 기본 상태코드: 500
- 핸들러에서 `err.statusCode`를 설정하면 해당 코드 사용

---

## DB 커넥션 풀 (src/db/pool.js)

```
mysql2/promise 기반
Pool 최대 연결 수: 10
연결 대기: 활성화 (waitForConnections: true)
```

환경변수(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)로 연결 설정.

---

## 테스트

| 파일 | 대상 | 주요 케이스 |
|------|------|-------------|
| `src/tests/example.test.js` | GET /example | 200 응답, 응답 구조 검증 |
| `src/tests/dbExample.test.js` | GET /db-example | DB 정상 응답, DB 오류 시 500 반환 |

- DB 테스트는 `jest.mock`으로 MySQL 풀을 목(mock) 처리
- `npm test` = `jest --forceExit`

---

## NPM 스크립트

| 스크립트 | 명령 | 용도 |
|----------|------|------|
| `npm run dev` | `nodemon server.js` | 로컬 개발 (파일 변경 시 자동 재시작) |
| `npm start` | `node server.js` | 프로덕션 실행 |
| `npm test` | `jest --forceExit` | 테스트 실행 |
