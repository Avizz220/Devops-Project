pipeline {
    agent any
    
    environment {
        // Docker Hub configuration
        DOCKER_HUB_USERNAME = 'avishka2002'  // Your Docker Hub username
        FRONTEND_IMAGE_NAME = 'community-events-frontend'
        BACKEND_IMAGE_NAME = 'community-events-backend'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code from GitHub....'
                checkout scm
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    echo '🔨 Building Frontend Docker image...'
                    sh """
                        docker build -t ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} .
                        docker tag ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Build Backend Image') {
            steps {
                script {
                    echo '🔨 Building Backend Docker image...'
                    sh """
                        docker build -t ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} -f backend/Dockerfile ./backend
                        docker tag ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo '🚀 Pushing Docker images to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                            
                            echo "Pushing Frontend image..."
                            docker push ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                            docker push ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:latest
                            
                            echo "Pushing Backend image..."
                            docker push ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                            docker push ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:latest
                            
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo '🧹 Cleaning up local images...'
                    sh """
                        docker rmi ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} || true
                        docker rmi ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG} || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            echo "🎉 Frontend image pushed: ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            echo "🎉 Backend image pushed: ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        always {
            echo '🏁 Pipeline finished.'
        }
    }
}
