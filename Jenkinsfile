pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = 'project-frontend'
        BACKEND_IMAGE  = 'project-backend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Docker') {
            steps {
                sh 'docker --version'
                sh 'docker ps'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t $BACKEND_IMAGE ./server'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t $FRONTEND_IMAGE -f Dockerfile.frontend .'
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh 'docker stop crediwork-backend  || true'
                sh 'docker stop crediwork-frontend || true'
                sh 'docker rm   crediwork-backend  || true'
                sh 'docker rm   crediwork-frontend || true'
            }
        }

        stage('Create Network') {
            steps {
                sh 'docker network create crediwork-net || true'
            }
        }

        stage('Start Backend') {
            steps {
                sh '''
                    docker run -d \
                        --name crediwork-backend \
                        --network crediwork-net \
                        -p 3001:3001 \
                        --env-file ./server/.env \
                        --restart unless-stopped \
                        $BACKEND_IMAGE
                '''
            }
        }

        stage('Start Frontend') {
            steps {
                sh '''
                    docker run -d \
                        --name crediwork-frontend \
                        --network crediwork-net \
                        -p 4173:4173 \
                        --restart unless-stopped \
                        $FRONTEND_IMAGE
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 5'
                sh 'docker ps'
                sh 'docker logs crediwork-backend  --tail=20'
                sh 'docker logs crediwork-frontend --tail=20'
            }
        }
    }

    post {
        failure {
            sh 'docker logs crediwork-backend  --tail=50 || true'
            sh 'docker logs crediwork-frontend --tail=50 || true'
        }
    }
}