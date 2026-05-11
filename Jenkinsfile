pipeline {
    agent any

    environment {
        IMAGE_NAME = 'cicd-app'
        CONTAINER_NAME = 'node-app'
        COMPOSE_FILE = 'docker-compose.yml'
    }
    stages {
        stage('Checkout') {
            steps {
                echo '코드 체크아웃'
                sh 'whoami && ls -la $WORKSPACE'
                checkout scm
                withCredentials([file(credentialsId: 'app-env-file', variable: 'ENV_FILE')]) {
                    sh '''
                        rm -f $WORKSPACE/.env
                        cp $ENV_FILE $WORKSPACE/.env
                        sed -i 's/^export //g' $WORKSPACE/.env
                        sed -i 's/\\r//' $WORKSPACE/.env
                    '''
                }
            }
        }

        stage('Build') {
            steps {
                echo '도커 이미지 빌드'
                sh '''
                    # 기존 이미지가 있으면 previous 태그로 백업
                    if docker image inspect ${IMAGE_NAME}:latest > /dev/null 2>&1; then
                        docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:previous
                        echo "기존 이미지를 ${IMAGE_NAME}:previous 로 백업"
                    else
                        echo "백업할 기존 이미지 없음"
                    fi

                    docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} build --no-cache app
                    docker tag ${IMAGE_NAME} ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Test') {
            steps {
                echo '테스트 실행'
                sh 'docker run --rm ${IMAGE_NAME} npm test'
            }
        }

        stage('Deploy') {
            steps {
                echo '컨테이너 배포'
                sh '''
                    docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} down --remove-orphans
                    docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} up -d
                    docker image prune -f --filter "label!=backup"
                '''
            }
        }
    }

    post {
        success {
            echo '배포 성공'
            sh '''
                # 배포 성공 시 previous 백업 이미지 삭제
                if docker image inspect ${IMAGE_NAME}:previous > /dev/null 2>&1; then
                    docker rmi ${IMAGE_NAME}:previous
                    echo "백업 이미지 삭제 완료"
                fi
            '''
        }

        failure {
            echo '배포 실패 - 이전 이미지로 롤백 시도'
            sh '''
                if docker image inspect ${IMAGE_NAME}:previous > /dev/null 2>&1; then
                    echo "previous 이미지로 롤백"
                    docker tag ${IMAGE_NAME}:previous ${IMAGE_NAME}:latest
                    docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} down --remove-orphans || true
                    docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} up -d
                    echo "롤백 완료"
                else
                    echo "롤백할 이전 이미지 없음"
                fi
            '''
        }
    }
}
