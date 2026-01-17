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

### 4. Seed the database with initial data
```bash
npm run seed
```

This will create:
- ✅ Admin user (admin / admin123)
- ✅ Sample tutor (tutor@academe.com / tutor123)
- ✅ Sample student (student@academe.com / student123)
- ✅ Sample course
- ✅ Hero content
- ✅ Pricing plans
- ✅ Initial departments

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
