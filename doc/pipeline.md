# Jenkins CI/CD 파이프라인

## 파이프라인 환경변수

```groovy
IMAGE_NAME     = 'cicd-app'
CONTAINER_NAME = 'node-app'
COMPOSE_FILE   = 'docker-compose.yml'
```

## 스테이지 흐름

```
Checkout → Build → Test → Deploy
                              │
                     post: success / failure
```

---

## 각 스테이지 상세

### 1. Checkout

**무슨 일이 일어나는가**

Jenkins가 GitHub에서 소스코드를 EC2의 `$WORKSPACE`로 내려받고, 애플리케이션 실행에 필요한 `.env` 파일을 Jenkins Credentials에서 가져와 워크스페이스에 배치합니다.

```
GitHub 리포지토리
      │ checkout scm (git clone)
      ▼
$WORKSPACE/                  ← /var/lib/jenkins/workspace/<job명>/
    ├── Jenkinsfile
    ├── Dockerfile
    ├── docker-compose.yml
    └── src/

Jenkins Credentials (app-env-file)
      │ cp $ENV_FILE $WORKSPACE/.env
      ▼
$WORKSPACE/.env              ← docker compose가 읽을 환경변수 파일
```

**코드 설명**

```groovy
checkout scm
// Jenkins job에 연결된 GitHub 리포지토리에서 현재 브랜치 코드를 $WORKSPACE로 클론

withCredentials([file(credentialsId: 'app-env-file', variable: 'ENV_FILE')]) {
    sh '''
        rm -f $WORKSPACE/.env
        // 이전 빌드에서 남은 .env가 있을 수 있어 먼저 삭제

        cp $ENV_FILE $WORKSPACE/.env
        // Jenkins Credentials에 등록된 Secret file을 워크스페이스로 복사
        // $ENV_FILE은 Jenkins가 임시 경로에 파일을 써두고 전달하는 변수

        sed -i 's/^export //g' $WORKSPACE/.env
        // .env 파일에 "export KEY=VALUE" 형태로 작성된 경우 "export " 제거
        // docker compose는 "export" 구문을 인식하지 못하므로 제거 필요

        sed -i 's/\r//' $WORKSPACE/.env
        // Windows에서 작성된 파일의 줄바꿈(\r\n)을 Linux 형식(\n)으로 변환
        // \r이 남아있으면 환경변수 값 끝에 \r이 붙어 오작동 발생
    '''
}
```

---

### 2. Build

**무슨 일이 일어나는가**

Checkout에서 받은 소스코드와 Dockerfile을 이용해 Docker 이미지를 빌드합니다. MySQL 이미지는 빌드 대상이 아니고 Docker Hub에서 자동으로 pull됩니다.

```
$WORKSPACE/Dockerfile + 소스코드
      │ docker compose build --no-cache app
      ▼
cicd-app 이미지 생성 (EC2 로컬 이미지 저장소)
```

**코드 설명**

```sh
docker compose --env-file $WORKSPACE/.env -f docker-compose.yml build --no-cache app
```

| 옵션 | 설명 |
|------|------|
| `--env-file $WORKSPACE/.env` | Credentials에서 가져온 .env를 빌드에 사용 |
| `-f docker-compose.yml` | 사용할 Compose 파일 명시 |
| `build` | 이미지 빌드 명령 |
| `--no-cache` | 레이어 캐시를 사용하지 않고 처음부터 빌드 (항상 최신 코드 반영) |
| `app` | docker-compose.yml의 `app` 서비스만 빌드 (mysql은 pull 대상) |

**Dockerfile 빌드 과정**

```
FROM node:20-alpine          ← 베이스 이미지 pull
WORKDIR /app                 ← 작업 디렉토리 설정
COPY package*.json ./        ← 의존성 파일 복사 (레이어 캐싱 목적)
RUN npm ci                   ← node_modules 설치
COPY . .                     ← 소스코드 전체 복사
EXPOSE 3000
CMD ["node", "server.js"]
```

---

### 3. Test

**무슨 일이 일어나는가**

Build에서 만든 이미지로 **임시 컨테이너**를 실행하고, 그 안에서 Jest 테스트를 돌립니다. 테스트가 끝나면 컨테이너는 자동으로 삭제됩니다. 테스트 실패 시 이 스테이지에서 파이프라인이 중단되어 Deploy까지 가지 않습니다.

```
cicd-app 이미지
      │ docker run --rm cicd-app npm test
      ▼
임시 컨테이너 생성
      │ Jest 실행 (example.test.js, dbExample.test.js)
      ▼
테스트 통과 → 컨테이너 자동 삭제 → 다음 스테이지
테스트 실패 → 파이프라인 중단 → post.failure 실행
```

**코드 설명**

```sh
docker run --rm cicd-app npm test
```

| 옵션 | 설명 |
|------|------|
| `--rm` | 컨테이너 종료 시 자동 삭제 (임시 실행) |
| `cicd-app` | Build 스테이지에서 만든 이미지 |
| `npm test` | `jest --forceExit` 실행 |

**주의:** 이 컨테이너는 MySQL 없이 단독 실행됩니다. DB 테스트(`dbExample.test.js`)는 `jest.mock`으로 DB를 가짜로 대체하기 때문에 MySQL 연결 없이도 테스트 가능합니다.

---

### 4. Deploy

**무슨 일이 일어나는가**

기존에 실행 중인 컨테이너를 내리고, 새로 빌드된 이미지로 컨테이너를 다시 올립니다. node-app과 mysql-db 두 컨테이너가 함께 실행되며, 사용하지 않는 이미지는 정리합니다.

```
기존 컨테이너 (node-app, mysql-db)
      │ docker compose down --remove-orphans
      ▼
컨테이너 중지 및 삭제 (볼륨은 유지 → DB 데이터 보존)
      │ docker compose up -d
      ▼
신규 컨테이너 실행
    ├── mysql-db 먼저 시작 → healthcheck 통과 대기
    └── node-app 시작 (mysql-db healthy 확인 후)
      │ docker image prune -f
      ▼
이전 빌드의 dangling 이미지 삭제
```

**코드 설명**

```sh
docker compose --env-file $WORKSPACE/.env -f docker-compose.yml down --remove-orphans
```
- `down`: 컨테이너 중지 + 삭제 (볼륨은 삭제하지 않음 → DB 데이터 유지)
- `--remove-orphans`: compose 파일에 더 이상 없는 서비스의 컨테이너도 삭제

```sh
docker compose --env-file $WORKSPACE/.env -f docker-compose.yml up -d
```
- `-d`: 백그라운드(detached) 실행
- mysql-db → node-app 순서로 실행 (depends_on + healthcheck에 의해 자동 조율)

```sh
docker image prune -f
```
- 태그가 없는 dangling 이미지 삭제 (`-f`: 확인 없이 바로 삭제)
- `--no-cache`로 매번 새 이미지를 빌드하므로 이전 이미지가 계속 쌓이는 것을 방지

---

## Post 처리

### success

```groovy
echo '배포 성공'
```

현재는 로그 출력만 합니다. Slack, 이메일 알림 등을 추가할 수 있습니다.

### failure

```sh
docker compose --env-file $WORKSPACE/.env -f docker-compose.yml up -d || true
```

- 어느 스테이지에서든 실패하면 실행됨
- `docker compose up -d`로 이전 컨테이너를 복구 시도
- `|| true`: 복구 명령 자체가 실패해도 파이프라인이 에러 없이 종료되도록 처리

**복구의 한계:** Deploy 스테이지에서 `down`까지 실행된 상태라면, 이전 컨테이너가 이미 삭제된 상태입니다. 이 경우 완전한 롤백은 불가능하며, 직전 빌드 이미지가 EC2에 남아있을 때만 복구가 가능합니다.

---

## Jenkins Credentials 설정

Jenkins 관리 > Credentials에 다음을 등록해야 합니다.

| ID | 종류 | 내용 |
|----|------|------|
| `app-env-file` | Secret file | `.env` 파일 (실제 환경변수 포함) |

---

## Webhook 설정

GitHub 리포지토리 → Settings → Webhooks에 Jenkins URL 등록 필요.

```
http://<EC2_IP>:8080/github-webhook/
```
