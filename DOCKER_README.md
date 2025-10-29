# Community Events Platform - Docker Setup

## Quick Start

### Option 1: Using the start script (Windows)
```bash
./start.bat
```

### Option 2: Using the start script (Linux/Mac)
```bash
chmod +x start.sh
./start.sh
```

### Option 3: Manual Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services

- **Frontend (React)**: http://localhost
- **Backend (Node.js)**: http://localhost:4000
- **Database (MySQL)**: localhost:3306

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MySQL         │
│   (React)       │    │   (Node.js)     │    │   Database      │
│   Port: 80      │◄──►│   Port: 4000    │◄──►│   Port: 3306    │
│   Nginx         │    │   Express       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

- ✅ User signup and login
- ✅ MySQL database with user management
- ✅ Health checks for all services
- ✅ Hot reloading in development
- ✅ Production-ready builds
- ✅ Nginx reverse proxy
- ✅ Docker networking
- ✅ Persistent database storage

## Environment Variables

Backend environment variables are configured in `backend/.env`:
- `DB_HOST=mysql` (Docker service name)
- `DB_PORT=3306`
- `DB_USER=appuser`
- `DB_PASSWORD=StrongPasswordHere`
- `DB_NAME=community_events`

## Troubleshooting

### Check service status
```bash
docker-compose ps
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Restart services
```bash
docker-compose restart
```

### Clean rebuild
```bash
docker-compose down
docker-compose up --build -d
```

### Access database directly
```bash
docker-compose exec mysql mysql -u appuser -pStrongPasswordHere community_events
```