pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'avishka2002'
        FRONTEND_IMAGE_NAME = 'community-events-frontend'
        BACKEND_IMAGE_NAME = 'community-events-backend'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        AWS_DEFAULT_REGION = 'us-east-1'
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
        
        stage('Cleanup Docker Images') {
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
        
        stage('Terraform Init') {
            steps {
                script {
                    echo '🔧 Initializing Terraform...'
                    dir('terraform') {
                        // Check if Terraform is installed
                        sh 'which terraform || echo "Terraform not found in PATH"'
                        sh 'terraform version || echo "Terraform command failed"'
                        
                        // Initialize with AWS credentials
                        withCredentials([
                            string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                            string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                        ]) {
                            sh '''
                                export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                                export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                                terraform init -upgrade
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Terraform Plan') {
            steps {
                script {
                    echo '📋 Creating Terraform execution plan...'
                    dir('terraform') {
                        withCredentials([
                            string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                            string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                        ]) {
                            sh '''
                                set -e
                                echo "Verifying AWS credentials..."
                                export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                                export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                                export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
                                
                                echo "Running Terraform plan..."
                                terraform plan \
                                    -var="frontend_image_tag=latest" \
                                    -var="backend_image_tag=latest" \
                                    -out=tfplan || {
                                        echo "Terraform plan failed!"
                                        terraform version
                                        exit 1
                                    }
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Terraform Apply') {
            steps {
                script {
                    echo '🚀 Deploying infrastructure to AWS...'
                    dir('terraform') {
                        withCredentials([
                            string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                            string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                        ]) {
                            sh '''
                                set -e
                                export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                                export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                                export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
                                
                                echo "Applying Terraform configuration..."
                                terraform apply -auto-approve tfplan
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Get Deployment Info') {
            steps {
                script {
                    echo '📡 Fetching deployment information...'
                    dir('terraform') {
                        sh '''
                            echo "========================================="
                            echo "🌐 Application URLs:"
                            
                            # Check if jq is available
                            if command -v jq &> /dev/null; then
                                EC2_IP=$(terraform output -json ec2_public_ips | jq -r '.[0]' 2>/dev/null || echo "Unable to fetch IP")
                            else
                                # Fallback without jq
                                EC2_IP=$(terraform output ec2_public_ips | grep -oP '\\d+\\.\\d+\\.\\d+\\.\\d+' | head -1)
                            fi
                            
                            if [ ! -z "$EC2_IP" ] && [ "$EC2_IP" != "Unable to fetch IP" ]; then
                                echo "Frontend: http://${EC2_IP}"
                                echo "Backend API: http://${EC2_IP}:4000/api"
                            else
                                echo "EC2 IP not available yet. Check Terraform outputs:"
                                terraform output ec2_public_ips || echo "Output not found"
                            fi
                            
                            echo ""
                            echo "📦 Containers: MySQL, Backend, Frontend"
                            echo "========================================="
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ DEPLOYMENT PIPELINE COMPLETED SUCCESSFULLY!'
            echo "🎉 Frontend image pushed: ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            echo "🎉 Backend image pushed: ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            echo "🚀 Application deployed to AWS!"
        }
        failure {
            echo '❌ Pipeline failed! Check logs for details.'
        }
        always {
            echo '🏁 Pipeline finished.'
        }
    }
}
