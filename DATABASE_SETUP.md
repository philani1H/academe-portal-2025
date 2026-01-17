# Database Setup Instructions

## The Issue
Your PostgreSQL database is configured but the tables haven't been created yet. That's why you're seeing errors like:
```
The table 'main.users' does not exist in the current database.
```

## Solution - Run These Commands Locally

Open your terminal on your **Windows machine** where the project is running and execute:

### 1. Stop your development server
Press `Ctrl+C` to stop the running server

### 2. Push the schema to PostgreSQL
```bash
npx prisma db push
```

This will create all the tables in your Neon PostgreSQL database:
- users
- scheduled_sessions
- courses
- notifications
- admin_users
- And all other tables from your schema

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

### 4. (Optional) Create an admin user
You can create an admin user manually or use the API. Here's a quick SQL you can run in Neon dashboard:

```sql
INSERT INTO admin_users (username, display_name, email, password_hash, permissions, created_at, updated_at)
VALUES (
  'admin',
  'System Administrator',
  'admin@academe.com',
  '$2a$10$rBV2.H7ZJlDQxVJNf1hYxOGxNNqKJ5qYZp5lV8fJQVWX1wKl0p8Iq', -- This is 'admin123' hashed
  'all',
  NOW(),
  NOW()
);
```

### 5. Restart your development server
```bash
npm run dev
```

## Verification

After running these commands, you should see:
- ✅ No more "table does not exist" errors
- ✅ APIs working properly
- ✅ Admin dashboard loading data from PostgreSQL
- ✅ Tutor and student dashboards connecting to database

## Troubleshooting

### If `npx prisma db push` fails with connection error:
1. Check your internet connection
2. Verify the DATABASE_URL in .env is correct
3. Make sure Neon database is active (free tier databases sleep after inactivity)
4. Try visiting your Neon dashboard to wake up the database

### If you get "already exists" errors:
The tables are already there! Just run:
```bash
npx prisma generate
npm run dev
```

## Next Steps

Once the tables are created, you can:
1. Access admin dashboard at http://localhost:5173/admin/login
2. Login with: admin / admin123
3. Start creating courses, tutors, and students
4. All data will be stored in PostgreSQL
