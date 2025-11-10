#!/bin/bash
echo '=== Stopping existing containers ==='
docker-compose down

echo ''
echo '=== Removing old images ==='
docker-compose rm -f

echo ''
echo '=== Rebuilding containers ==='
docker-compose build --no-cache frontend

echo ''
echo '=== Starting containers ==='
docker-compose up -d

echo ''
echo '=== Waiting for services to be ready ==='
sleep 10

echo ''
echo '=== Checking container status ==='
docker-compose ps

echo ''
echo '=== Frontend logs (last 20 lines) ==='
docker-compose logs --tail=20 frontend

echo ''
echo '=== Done! ==='
echo 'Access the app at http://localhost'
echo 'To view logs: docker-compose logs -f'
echo 'To clear browser storage: Open DevTools Console and run: clearAppStorage()'
