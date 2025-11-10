@echo off
REM Community Events Platform - Docker Build and Deploy Script (Windows)
REM This script builds and starts all Docker containers

echo ==========================================
echo Community Events Platform - Docker Deploy
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: docker-compose is not installed!
    echo Please install docker-compose and try again.
    pause
    exit /b 1
)

echo docker-compose is available
echo.

REM Stop any existing containers
echo Stopping existing containers...
docker-compose down

echo.
echo Building Docker images...
echo This may take several minutes on first run...
echo.

REM Build and start all containers
docker-compose up -d --build

if errorlevel 0 (
    echo.
    echo ==========================================
    echo Deployment Successful!
    echo ==========================================
    echo.
    echo Container Status:
    docker-compose ps
    echo.
    echo ==========================================
    echo Access URLs:
    echo ==========================================
    echo.
    echo Frontend (Web App):     http://localhost
    echo Backend API:            http://localhost:4000
    echo Backend Health:         http://localhost:4000/api/health
    echo phpMyAdmin (Database):  http://localhost:8080
    echo.
    echo ==========================================
    echo Database Credentials:
    echo ==========================================
    echo.
    echo Host:         localhost
    echo Port:         3306
    echo Database:     community_events
    echo Username:     appuser
    echo Password:     StrongPasswordHere
    echo Root Password: rootpassword
    echo.
    echo ==========================================
    echo View Logs:
    echo ==========================================
    echo.
    echo All logs:        docker-compose logs -f
    echo Frontend logs:   docker-compose logs -f frontend
    echo Backend logs:    docker-compose logs -f backend
    echo Database logs:   docker-compose logs -f mysql
    echo phpMyAdmin logs: docker-compose logs -f phpmyadmin
    echo.
    echo ==========================================
    echo Docker Images:
    echo ==========================================
    echo.
    docker images
    echo.
    echo ==========================================
    echo Notes:
    echo ==========================================
    echo.
    echo - Wait 30-60 seconds for all services to be fully ready
    echo - Check health status: docker ps
    echo - Stop all: docker-compose down
    echo - Remove all data: docker-compose down -v
    echo.
    echo Your application is now running!
    echo.
) else (
    echo.
    echo ==========================================
    echo Deployment Failed!
    echo ==========================================
    echo.
    echo Please check the error messages above.
    echo View detailed logs with: docker-compose logs
    echo.
)

pause
