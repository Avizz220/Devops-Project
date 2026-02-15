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
                    
                    withCredentials([
                        string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            set -e
                            
                            export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                            export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                            export AWS_DEFAULT_REGION=us-east-1
                            
                            echo "========================================="
                            echo "🚀 Deploying to production server..."
                            echo "========================================="
                            
                            # Find the instance ID by private IP or tag
                            INSTANCE_ID=$(aws ec2 describe-instances \
                                --filters "Name=ip-address,Values=35.175.125.161" "Name=instance-state-name,Values=running" \
                                --query "Reservations[0].Instances[0].InstanceId" \
                                --output text 2>/dev/null || echo "")
                            
                            if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
                                echo "Could not find instance with IP 35.175.125.161"
                                echo "Trying to find by name tag..."
                                INSTANCE_ID=$(aws ec2 describe-instances \
                                    --filters "Name=tag:Name,Values=*community*" "Name=instance-state-name,Values=running" \
                                    --query "Reservations[0].Instances[0].InstanceId" \
                                    --output text 2>/dev/null || echo "")
                            fi
                            
                            if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
                                echo "ERROR: Could not find the production instance!"
                                echo "Please manually provide the instance ID"
                                exit 1
                            fi
                            
                            echo "Found instance: $INSTANCE_ID"
                            echo "Sending deployment command via AWS SSM..."
                            
                            # Send command via AWS Systems Manager
                            COMMAND_ID=$(aws ssm send-command \
                                --instance-ids "$INSTANCE_ID" \
                                --document-name "AWS-RunShellScript" \
                                --comment "Deploy latest Docker images from Jenkins" \
                                --parameters 'commands=[
                                    "cd /opt/community-events",
                                    "echo Stopping containers...",
                                    "sudo docker-compose down",
                                    "echo Removing old images...",
                                    "sudo docker rmi avishka2002/community-events-frontend:latest || true",
                                    "sudo docker rmi avishka2002/community-events-backend:latest || true",
                                    "echo Pulling latest images...",
                                    "sudo docker-compose pull",
                                    "echo Starting containers...",
                                    "sudo docker-compose up -d",
                                    "sleep 15",
                                    "echo Container status:",
                                    "sudo docker-compose ps",
                                    "echo Deployment complete!"
                                ]' \
                                --output text \
                                --query "Command.CommandId" || {
                                    echo "Failed to send command. Check if SSM agent is running on the instance."
                                    exit 1
                                })
                            
                            echo "Command sent! Command ID: $COMMAND_ID"
                            echo "Waiting for command to complete..."
                            sleep 15
                            
                            # Check command status
                            aws ssm get-command-invocation \
                                --command-id "$COMMAND_ID" \
                                --instance-id "$INSTANCE_ID" \
                                --output text \
                                --query 'StandardOutputContent' || echo "Output not available yet"
                            
                            echo "========================================="
                            echo "✅ Deployment command sent successfully!"
                            echo "🌐 Application URL: http://35.175.125.161"
                            echo "========================================="
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
