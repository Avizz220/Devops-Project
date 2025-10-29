Manual database setup for the backend

1) Ensure MySQL client is installed and in your PATH (mysql.exe). On Windows this is typically available if you installed MySQL Server or MySQL Shell.

2) Edit `create_users_manual.sql` if you want to replace the placeholder password `StrongPasswordHere` with a secure password. Alternatively leave it and update the password later.

3) Run the PowerShell helper (recommended) which will prompt for the root password and execute the SQL:

```powershell
cd "C:\Users\Avishka\Documents\Devops_Project\backend"
.\init-db.ps1
```

The script will run `create_users_manual.sql` with the MySQL root user and prompt you for the password (secure interactive prompt).

4) After successful run, create a `.env` file in `backend` with these values (replace password):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=StrongPasswordHere
DB_NAME=community_events
PORT=4000
```

5) Start the backend:

```powershell
npm run dev
```

## Quick verify and run

A small verify script `verify-db.js` was added to test DB connectivity using values from `.env`.

Run from PowerShell in the backend folder:

```powershell
cd "C:\Users\Avishka\Documents\Devops_Project\backend"
node verify-db.js
```

If the script prints a users count, the DB connection works and you can start the server:

```powershell
npm run dev
```

Troubleshooting
- If you see an authentication plugin error like "Server requests authentication using unknown plugin auth_gssapi_client", alter the MySQL account to use `mysql_native_password`:

Run as admin in mysql client:

```sql
ALTER USER 'existing_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'TheirPassword';
FLUSH PRIVILEGES;
```

- If `mysql` is not in PATH, set the `-MysqlClientPath` parameter when calling `init-db.ps1` to the full path of `mysql.exe`.
