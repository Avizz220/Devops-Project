# Backend Setup Instructions

## Database Setup
If you encounter authentication issues with MySQL, run these commands:

1. Open MySQL command line as an administrator:
```
mysql -u root -p
```

2. Run the following SQL commands:
```sql
ALTER USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongPasswordHere';
FLUSH PRIVILEGES;
```

Alternatively, you can run the SQL file directly:
```
mysql -u root -p < C:\Users\Avishka\Documents\Devops_Project\backend\fix-auth.sql
```

## Configuration
1. Make sure your `.env` file has the correct database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=StrongPasswordHere
DB_NAME=community_events
PORT=4000
```

## Running the Backend
1. Install dependencies (if not already done):
```
npm install
```

2. Verify database connection:
```
node verify-db.js
```

3. Start the backend server:
```
npm run dev
```
This will start the server on http://localhost:4000

## API Endpoints
- POST /api/auth/signup - Register a new user
- POST /api/auth/login - Login with credentials
- GET /api/ping - Health check endpoint
- GET /api/auth/validate - Validate a user (requires user-id header)

## Running the Frontend
1. Open a new terminal
2. Navigate to the frontend directory:
```
cd C:\Users\Avishka\Documents\Devops_Project
```

3. Start the frontend:
```
npm start
```
This will start the frontend on http://localhost:3000
