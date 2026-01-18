# Neon DB + Railway Deployment Guide

Since you're using Neon DB (PostgreSQL) instead of Railway's built-in PostgreSQL, here's the specific setup guide.

## 🗄️ Database Configuration

### Option 1: Use Your Existing Neon DB (Recommended)
Since you already have a Neon DB setup, you can continue using it:

```bash
# In Railway environment variables, set:
DATABASE_URL=postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Option 2: Create New Railway PostgreSQL (Alternative)
If you want to use Railway's managed PostgreSQL:

1. Add PostgreSQL service in Railway
2. Railway will automatically provide `DATABASE_URL`
3. Update your local `.env` to use Railway's database for testing

## 🔧 Fixed Docker Issues

### Problem: Prisma trying to use Bun
**Error:** `Command failed with ENOENT: bun add @prisma/client`

**Root Cause:** Prisma detected `bun.lockb` file and tried to use Bun instead of npm

### ✅ Solution Applied:
```dockerfile
# Set Prisma to use npm instead of bun
ENV PRISMA_CLI_BINARY_TARGETS=native
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Install Prisma client explicitly with npm
RUN npm install @prisma/client

# Generate Prisma client
RUN npx prisma generate
```

## 🚀 Railway Environment Variables

Set these in your Railway project:

### Required Variables:
```bash
# Database (use your existing Neon DB)
DATABASE_URL=your-neon-db-connection-string
POSTGRES_PRISMA_URL=your-neon-db-connection-string

# Email Configuration
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=notifications@excellenceakademie.co.za
BREVO_FROM_NAME=Excellence Academia

# Frontend URL
FRONTEND_URL=https://www.excellenceakademie.co.za

# Admin Configuration
ADMIN_USERNAME=philani chade
ADMIN_PASSWORD=philani.chade@EA25!
ADMIN_EMAIL=philanishoun4@gmail.com

# JWT Secret (generate new for production)
JWT_SECRET=academe-portal-2025-jwt-secret-change-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dszurpfhf
CLOUDINARY_API_KEY=649648851431394
CLOUDINARY_API_SECRET=lVtK5OH5DI1fk3YMluxdXqjVGnY

# System
NODE_ENV=production
```

## 🔍 Deployment Process

1. **Railway detects changes** and starts build
2. **Docker build process:**
   ```
   ✅ Install Node.js 20
   ✅ Install system dependencies
   ✅ Install npm packages
   ✅ Install Prisma client with npm
   ✅ Generate Prisma client
   ✅ Build application
   ✅ Start server
   ```

3. **Application starts** and connects to Neon DB
4. **Migrations run** automatically on startup
5. **Database seeded** with initial data

## 🎯 Benefits of Neon DB + Railway

### Neon DB Advantages:
- ✅ **Serverless PostgreSQL** - scales to zero
- ✅ **Branching** - database branches for development
- ✅ **Point-in-time recovery**
- ✅ **Global edge locations**
- ✅ **Cost-effective** for variable workloads

### Railway Advantages:
- ✅ **Easy deployment** from GitHub
- ✅ **Automatic HTTPS** and custom domains
- ✅ **Environment management**
- ✅ **Monitoring and logs**
- ✅ **Auto-scaling**

## 🔒 Security Considerations

1. **Connection Pooling:** Neon provides connection pooling
2. **SSL Required:** Always use `sslmode=require`
3. **Environment Variables:** Never commit database URLs to git
4. **Access Control:** Use Neon's IP allowlist if needed

## 📊 Expected Build Success

```
✅ [1/10] FROM docker.io/library/node:20-bullseye-slim
✅ [2/10] WORKDIR /app
✅ [3/10] RUN apt-get update && apt-get install...
✅ [4/10] COPY package*.json ./
✅ [5/10] ENV PYTHON=/usr/bin/python3
✅ [6/10] RUN npm ci --omit=dev --legacy-peer-deps
✅ [7/10] COPY . .
✅ [8/10] ENV PRISMA_CLI_BINARY_TARGETS=native
✅ [9/10] RUN npm install @prisma/client
✅ [10/10] RUN npx prisma generate
✅ [11/10] RUN npm run build
```

## 🚨 Troubleshooting

### If Prisma generation still fails:
```bash
# Try the simple Dockerfile
cp Dockerfile.simple Dockerfile
git add . && git commit -m "use simple dockerfile" && git push
```

### If database connection fails:
1. Check DATABASE_URL format
2. Verify Neon DB is accessible
3. Check Railway logs for connection errors

Your Neon DB + Railway deployment should now work perfectly! 🎉