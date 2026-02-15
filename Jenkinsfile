pipeline {
    agent any

    triggers {
        pollSCM '* * * * *'
    }
    
    environment {
        DOCKER_HUB_USERNAME = 'avishka2002'
        FRONTEND_IMAGE_NAME = 'community-events-frontend'
        BACKEND_IMAGE_NAME = 'community-events-backend'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        AWS_DEFAULT_REGION = 'us-east-1'
        // Enable Terraform plugin caching to speed up init
        TF_PLUGIN_CACHE_DIR = "${HOME}/.terraform.d/plugin-cache"
    }
    
    stages {
        stage('Setup Dependencies') {
            steps {
                script {
                    echo 'Checking and installing required dependencies...'
                   
                    sh 'mkdir -p ${TF_PLUGIN_CACHE_DIR}'
                    
                    sh '''
                        # Function to check and install a package
                        install_if_missing() {
                            PACKAGE=$1
                            COMMAND=$2
                            
                            if command -v $COMMAND &> /dev/null; then
                                echo "$PACKAGE is already installed"
                            else
                                echo "Installing $PACKAGE..."
                                
                                # Detect OS and install
                                if [ -f /etc/debian_version ]; then
                                    sudo apt-get update -qq
                                    sudo apt-get install -y $PACKAGE
                                elif [ -f /etc/redhat-release ]; then
                                    sudo yum install -y $PACKAGE
                                else
                                    echo "Unknown OS. Please install $PACKAGE manually"
                                    exit 1
                                fi
                                
                                echo "$PACKAGE installed successfully"
                            fi
                        }
                        
                        # Install jq for JSON parsing
                        install_if_missing "jq" "jq"
                        
                        # Install unzip (needed for Terraform)
                        install_if_missing "unzip" "unzip"
                        
                        # Install Terraform if not present
                        if command -v terraform &> /dev/null; then
                            echo "Terraform is already installed: $(terraform version | head -1)"
                        else
                            echo "Installing Terraform..."
                            TERRAFORM_VERSION="1.5.0"
                            cd /tmp
                            wget -q https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
                            unzip -o terraform_${TERRAFORM_VERSION}_linux_amd64.zip
                            sudo mv terraform /usr/local/bin/
                            sudo chmod +x /usr/local/bin/terraform
                            rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip
                            echo "Terraform installed: $(terraform version | head -1)"
                        fi
                        
                        echo ""
                        echo "========================================="
                        echo "All dependencies ready!"
                        echo "Terraform: $(terraform version | head -1)"
                        echo "jq: $(jq --version)"
                        echo "Docker: $(docker --version)"
                        echo "========================================="
                    '''
                }
            }
        }
        
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub....'
                checkout scm
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    echo 'Building Frontend Docker image...'
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
                    echo 'Building Backend Docker image...'
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
                    echo 'Pushing Docker images to Docker Hub...'
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
                    echo 'Cleaning up local images...'
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
                    echo 'Initializing Terraform...'
                    dir('terraform') {
                        // Configure Terraform plugin cache via CLI config
                        sh '''
                            echo "plugin_cache_dir   = \\"$HOME/.terraform.d/plugin-cache\\"" > $HOME/.terraformrc
                            mkdir -p $HOME/.terraform.d/plugin-cache
                        '''
                        
                        // Check Terraform installation
                        sh 'terraform version'
                        
                        // Clean up any existing state locks checks (optional)
                        sh 'rm -f .terraform/terraform.tfstate || true'
                        
                        // Initialize with AWS credentials
                        withCredentials([
                            string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                            string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                        ]) {
                            sh '''
                                set -e
                                echo "========================================="
                                echo "Checking AWS Credentials..."
                                echo "AWS_ACCESS_KEY_ID length: ${#AWS_ACCESS_KEY_ID}"
                                echo "AWS_SECRET_ACCESS_KEY length: ${#AWS_SECRET_ACCESS_KEY}"
                                
                                if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
                                    echo "ERROR: AWS credentials are not set!"
                                    echo "Please check Jenkins credentials configuration"
                                    exit 1
                                fi
                                
                                echo "AWS Credentials found"
                                echo "========================================="
                                
                                export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                                export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                                export AWS_DEFAULT_REGION=us-west-2
                                
                                echo "Initializing Terraform..."
                                # Use standard init (uses cache, respects lock file)
                                terraform init
                                
                                echo "Terraform initialized successfully"
                            '''
                        }
                    }
                }
            }
        }
        
        // Terraform stages disabled - deploying directly to existing server
        // To re-enable infrastructure changes, uncomment Terraform Plan and Apply stages
        
        stage('Deploy to Production Server') {
            steps {
                script {
                    echo 'Deploying to production server: 35.175.125.161...'
                    
                    sshagent(['aws-ec2-ssh-key']) {
                        sh '''
                            set -e
                            
                            # Production server details
                            SERVER_IP="35.175.125.161"
                            SERVER_USER="ubuntu"
                            DEPLOY_DIR="/opt/community-events"
                            
                            echo "========================================="
                            echo "🚀 Deploying to: ${SERVER_IP}"
                            echo "========================================="
                            
                            # SSH and deploy
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
                                set -e
                                cd /opt/community-events
                                
                                echo "📥 Pulling latest Docker images..."
                                sudo docker-compose pull
                                
                                echo "🔄 Restarting containers..."
                                sudo docker-compose up -d
                                
                                echo "⏳ Waiting for containers to start..."
                                sleep 10
                                
                                echo "✅ Container status:"
                                sudo docker-compose ps
                                
                                echo "========================================="
                                echo "✅ Deployment complete!"
                                echo "🌐 Application URL: http://35.175.125.161"
                                echo "========================================="
ENDSSH
                            
                            echo "✅ Successfully deployed to production!"
                        '''
                    }
                }
            }
        }
        
        stage('Deployment Summary') {
            steps {
                script {
                    echo '''
                        =========================================
                        ✅ DEPLOYMENT COMPLETE
                        =========================================
                        🌐 Frontend: http://35.175.125.161
                        🔌 Backend API: http://35.175.125.161:4000/api
                        📦 Containers: MySQL, Backend, Frontend
                        =========================================
                        Your changes are now live!
                        =========================================
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'DEPLOYMENT PIPELINE COMPLETED SUCCESSFULLY!'
            echo "Frontend image pushed: ${DOCKER_HUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            echo "Backend image pushed: ${DOCKER_HUB_USERNAME}/${BACKEND_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            echo "Application deployed to: http://35.175.125.161"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}
