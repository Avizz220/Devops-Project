@echo off
echo 🚀 Starting Community Events Platform with Docker...

REM Build and start all services
docker-compose up --build -d

echo ✅ Services starting up...
echo 📊 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:4000
echo 🗄️  MySQL: localhost:3306
echo.
echo 🏥 Checking service health...

REM Wait a bit for services to start
timeout /t 10 /nobreak

echo.
echo 🎉 Services should be up and running!
echo 🌐 Open http://localhost in your browser to access the application
echo.
echo To check status: docker-compose ps
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down