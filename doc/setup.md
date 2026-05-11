# 로컬 개발 및 운영 설정 가이드

## 로컬 개발 환경

### 1. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정
```

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev        # nodemon으로 자동 재시작
```

### 3. Docker Compose로 전체 스택 실행

```bash
docker compose up -d
```

- node-app: http://localhost:3000
- mysql-db: localhost:3306

### 4. 테스트 실행

```bash
npm test
```

---

## Jenkins 서버 초기 설정

### 필수 설치 (EC2)

```bash
# Docker
sudo apt install docker.io docker-compose-plugin

# Jenkins
# https://www.jenkins.io/doc/book/installing/linux/ 참고
```

### Jenkins Credentials 등록

1. Jenkins 관리 → Credentials → System → Global credentials
2. **Add Credentials** 클릭
3. 아래와 같이 입력:

| 항목 | 값 |
|------|-----|
| Kind | Secret file |
| File | 실제 `.env` 파일 업로드 |
| ID | `app-env-file` |

### GitHub Webhook 등록

1. GitHub 리포지토리 → Settings → Webhooks → Add webhook
2. Payload URL: `http://<EC2_IP>:8080/github-webhook/`
3. Content type: `application/json`
4. Trigger: `Just the push event`

### Jenkins Pipeline 생성

1. New Item → Pipeline
2. Pipeline Definition: **Pipeline script from SCM**
3. SCM: Git, 리포지토리 URL 입력
4. Script Path: `Jenkinsfile`

---

## 운영 중 유용한 명령어

### 컨테이너 상태 확인

```bash
docker compose ps
docker logs node-app
docker logs mysql-db
```

### 컨테이너 재시작

```bash
docker compose restart app
```

### DB 접속

```bash
docker exec -it mysql-db mysql -u appuser -p cicd_db
```

### 이미지/볼륨 정리

```bash
docker image prune -f          # 미사용 이미지 삭제
docker volume ls               # 볼륨 목록 확인
```
