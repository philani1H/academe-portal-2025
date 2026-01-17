# Database Setup Guide - Neon PostgreSQL

This guide will help you set up your Neon PostgreSQL database for the Excellence Akademie application.

## 🎯 Overview

Your application is configured to use **Neon PostgreSQL** (a serverless PostgreSQL database) instead of local SQLite databases.

**Database URL:** `ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech`

## ✅ Prerequisites

1. Node.js installed (v18 or higher)
2. npm or yarn package manager
3. Active internet connection to reach Neon database

## 🚀 Quick Setup (Run on Your Local Machine)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Check Database Connection

```bash
npm run db:check
```

This will:
- ✅ Test connection to Neon PostgreSQL
- 📊 List all existing tables
- 📈 Count records in key tables
- 💡 Provide recommendations if data is missing

### Step 4: Run Migrations (Create Tables)

If tables are missing, run:

```bash
npx prisma migrate deploy
```

Or use the all-in-one setup command:

```bash
npm run db:setup
```

This will:
1. Run all migrations (create tables)
2. Seed the database with initial content

### Step 5: Verify Setup

```bash
npm run db:check
```

You should see all tables created with data counts.

## 📝 Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:check` | Check database connection and list tables/data |
| `npm run db:deploy` | Run Prisma migrations (create/update tables) |
| `npm run db:setup` | Complete setup (migrate + seed) |
| `npm run seed` | Create test users and courses |
| `npm run seed:all` | Seed all content (hero, features, pricing, etc.) |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |

## 🔧 Troubleshooting

### ❌ "Can't reach database server"

**Cause:** Cannot connect to Neon PostgreSQL

**Solutions:**
1. Check your internet connection
2. Verify `.env` file has correct `DATABASE_URL`
3. Ensure Neon project is active (not paused/suspended)
4. Check if your IP is whitelisted in Neon dashboard

### ❌ "Table does not exist" (P2021 error)

**Cause:** Database tables haven't been created yet

**Solution:**
```bash
npx prisma migrate deploy
```

### ❌ "No admin users found"

**Cause:** Admin user hasn't been seeded

**Solution:**
The server will automatically create an admin user on startup using these environment variables:
- `ADMIN_USERNAME` (default: "admin")
- `ADMIN_PASSWORD` (default: "admin123")
- `ADMIN_EMAIL`

### ❌ "No content data found"

**Cause:** Hero content, features, pricing not seeded

**Solution:**
```bash
npm run seed:all
```

## 🔐 Environment Variables

Make sure your `.env` file contains:

```env
# Database Configuration - Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
ADMIN_EMAIL=""

# JWT Configuration
JWT_SECRET="your-secret-key-change-in-production"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Need Help?** Check the server logs or run `npm run db:check` for diagnostic information.
