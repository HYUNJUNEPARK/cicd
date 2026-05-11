# 프로젝트 개요

## 목적

GitHub → Jenkins → Docker 파이프라인을 구성하여 코드 푸시 시 자동으로 빌드, 테스트, 배포까지 이어지는 CI/CD 워크플로우 구현.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js 20 (Alpine) |
| 프레임워크 | Express 5 |
| 데이터베이스 | MySQL 8.0 |
| 컨테이너 | Docker + Docker Compose |
| CI/CD | Jenkins (Declarative Pipeline) |
| 테스트 | Jest + Supertest |

## 전체 아키텍처

```
GitHub
  │
  │ git push (webhook)
  ▼
Jenkins (EC2 직접 설치)
  │
  ├─ Checkout   → 코드 클론 + .env 주입
  ├─ Build      → docker compose build
  ├─ Test       → npm test (컨테이너 내)
  └─ Deploy     → docker compose up -d
                    │
                    ├─ node-app  (port 3000)
                    └─ mysql-db  (port 3306)
```

## 디렉토리 구조

```
cicd/
├── Jenkinsfile             # CI/CD 파이프라인 정의
├── Dockerfile              # 애플리케이션 이미지
├── docker-compose.yml      # 멀티 컨테이너 구성
├── init.sql                # DB 초기화 스크립트
├── server.js               # 애플리케이션 진입점
├── .env.example            # 환경변수 템플릿
├── doc/                    # 프로젝트 문서
└── src/
    ├── app.js              # Express 앱 설정
    ├── db/
    │   └── pool.js         # MySQL 커넥션 풀
    ├── handlers/           # 요청 처리 로직
    ├── routes/             # 라우트 정의
    ├── middlewares/        # 공통 미들웨어
    └── tests/              # Jest 테스트
```
