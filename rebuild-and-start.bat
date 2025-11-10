@echo off
echo ======================================
echo Rebuilding and Restarting Docker
echo ======================================
echo.

echo Stopping existing containers...
docker-compose down

echo.
echo Building fresh Docker images...
docker-compose build --no-cache

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo ======================================
echo Deployment Complete!
echo ======================================
echo.
echo Services running at:
echo   Frontend: http://localhost
echo   Backend:  http://localhost:4000
echo   phpMyAdmin: http://localhost:8081
echo.

docker-compose ps

echo.
echo To view logs: docker-compose logs -f
pause
