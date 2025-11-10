@echo off
REM Deploy script using Docker Hub images for Windows
REM Usage: deploy-from-hub.bat [your-dockerhub-username] [image-tag]

SET DOCKERHUB_USERNAME=%1
SET IMAGE_TAG=%2

IF "%DOCKERHUB_USERNAME%"=="" SET DOCKERHUB_USERNAME=yourusername
IF "%IMAGE_TAG%"=="" SET IMAGE_TAG=latest

echo ==================================================
echo Deploying Community Events Platform from Docker Hub
echo ==================================================
echo Docker Hub Username: %DOCKERHUB_USERNAME%
echo Image Tag: %IMAGE_TAG%
echo ==================================================

REM Pull latest images
echo 📥 Pulling latest images from Docker Hub...
docker pull %DOCKERHUB_USERNAME%/community-events-frontend:%IMAGE_TAG%
docker pull %DOCKERHUB_USERNAME%/community-events-backend:%IMAGE_TAG%

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.hub.yml down

REM Start services with Docker Hub images
echo 🚀 Starting services...
docker-compose -f docker-compose.hub.yml up -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak

REM Check status
echo 📊 Checking service status...
docker-compose -f docker-compose.hub.yml ps

echo.
echo ==================================================
echo ✅ Deployment Complete!
echo ==================================================
echo Frontend: http://localhost
echo Backend API: http://localhost:4000
echo phpMyAdmin: http://localhost:8081
echo ==================================================
pause
