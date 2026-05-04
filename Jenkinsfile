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
                sh 'docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} build --no-cache app'
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
                '''
            }
        }
    }

    post {
        success {
            echo '배포 성공'
        }
        
        failure {
            echo '배포 실패 - 이전 컨테이너 복구 시도'
            sh 'docker compose --env-file $WORKSPACE/.env -f ${COMPOSE_FILE} up -d || true'
        }
    }
}
