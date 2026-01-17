# 🚀 QUICK FIX GUIDE - Database Setup

## The Problem
Your database tables don't exist yet in PostgreSQL. The error says:
```
The table 'main.admin_users' does not exist in the current database.
The table 'main.users' does not exist in the current database.
```

## ✅ THE SOLUTION (Run on Your Windows Machine)

### Step 1: Stop Your Server
Press `Ctrl+C` in your terminal

### Step 2: Create All Database Tables
```bash
npx prisma db push
```

This will create ALL tables in your Neon database:
- ✅ users
- ✅ admin_users
- ✅ scheduled_sessions
- ✅ courses
- ✅ And all other tables

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Seed Initial Data (Optional but Recommended)
```bash
npm run seed
```

This creates:
- Admin: `admin` / `admin123`
- Tutor: `tutor@academe.com` / `tutor123`
- Student: `student@academe.com` / `student123`

### Step 5: Restart Your Server
```bash
npm run dev
```

## 🎯 Expected Result

After running these commands, you should see:
- ✅ No more "table does not exist" errors
- ✅ Admin login works
- ✅ All dashboards work
- ✅ All APIs functional

## 📋 One-Line Command (All Steps at Once)

If you want to run everything in one command:

```bash
npx prisma db push && npx prisma generate && npm run seed && npm run dev
```

## ⚠️ Important Notes

1. **Internet Required**: Make sure you have internet connection
2. **Neon Database**: Your Neon database must be awake (it auto-sleeps after inactivity)
3. **Hardcoded URL**: The database URL is now hardcoded in prisma/schema.prisma
4. **No .env Needed**: Database connection works without .env file now

## 🔍 Troubleshooting

### If "Can't reach database server" error:
1. Check your internet connection
2. Visit your Neon dashboard to wake up the database
3. Try again after 30 seconds

### If you see existing data warnings:
- Use --accept-data-loss flag: npx prisma db push --accept-data-loss

### If admin users already exist in database:
- The seed script checks for existing data and won't duplicate
- You can skip seeding if you already have admin accounts

## 🎉 That's It!

Your database will be fully set up and working!
