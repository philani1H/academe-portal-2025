# Railway Deployment Troubleshooting Guide

This guide helps resolve common issues during Railway deployment.

## 🚨 Current Issue: Build Failures

### Problem: Node.js Version Mismatch
**Error:** `Unsupported engine` warnings and `better-sqlite3` compilation failures

**Root Cause:** 
- Some packages require Node.js 20+ but Dockerfile was using Node.js 18
- `better-sqlite3` needs native compilation with proper build tools
- Missing Python `distutils` module in Alpine Linux

### ✅ Solutions Provided

#### Solution 1: Fixed Main Dockerfile (Recommended)
- **Fixed npm config syntax** using environment variables
- **Upgraded to Node.js 20** (bullseye-slim base)
- **Added proper build tools** (python3, build-essential)
- **Uses environment variables** instead of npm config commands

#### Solution 2: Simple Dockerfile (Dockerfile.simple)
- **Minimal dependencies** approach
- **Prefers prebuilt binaries** over compilation
- **Faster build times** with fewer dependencies

#### Solution 3: PostgreSQL-only Dockerfile (Dockerfile.postgres)
- **Avoids SQLite entirely** - uses only PostgreSQL
- **No native compilation** needed
- **Smallest image size** and fastest builds

#### Solution 4: Multi-stage Alternative (Dockerfile.alternative)
- **Multi-stage build** for optimization
- **Separate build and runtime stages**
- **Better security** with non-root user

## 🔧 How to Apply the Fix

### Option 1: Use Fixed Main Dockerfile (Recommended)
```bash
# The main Dockerfile has been updated with proper environment variables
# Railway will automatically use it on next deployment
git add Dockerfile
git commit -m "fix: Fix npm config syntax in Dockerfile"
git push origin master
```

### Option 2: Use Simple Dockerfile (Fastest Build)
```bash
# Use the simple version that avoids compilation
cp Dockerfile.simple Dockerfile
git add Dockerfile
git commit -m "fix: Use simple Dockerfile with prebuilt binaries"
git push origin master
```

### Option 3: Use PostgreSQL-only Dockerfile (Most Reliable)
```bash
# Use PostgreSQL-only version (no SQLite)
cp Dockerfile.postgres Dockerfile
git add Dockerfile
git commit -m "fix: Use PostgreSQL-only Dockerfile"
git push origin master
```

### Option 4: Use Multi-stage Alternative
```bash
# Use the multi-stage build
cp Dockerfile.alternative Dockerfile
# Or update railway.json to use it
cp railway.alternative.json railway.json
```

## 🐛 Common Build Issues & Solutions

### Issue 1: `better-sqlite3` Compilation Failure
**Symptoms:**
- `gyp ERR! configure error`
- `ModuleNotFoundError: No module named 'distutils'`

**Solution:**
- ✅ Use Debian-based image instead of Alpine
- ✅ Install `python3-dev` and `build-essential`
- ✅ Set `npm config set python python3`

### Issue 2: Engine Version Warnings
**Symptoms:**
- `npm warn EBADENGINE Unsupported engine`
- Packages requiring Node.js 20+

**Solution:**
- ✅ Upgrade to Node.js 20 in Dockerfile
- ✅ Add engines specification in package.json
- ✅ Use `--legacy-peer-deps` flag

### Issue 3: Package Installation Failures
**Symptoms:**
- `npm ci` fails with dependency conflicts
- Version resolution errors

**Solution:**
- ✅ Use `--legacy-peer-deps` flag
- ✅ Use `--omit=dev` instead of `--only=production`
- ✅ Clear npm cache if needed

## 🚀 Deployment Steps After Fix

1. **Push the updated code:**
   ```bash
   git add .
   git commit -m "fix: Resolve Docker build issues with Node.js 20 and proper build tools"
   git push origin master
   ```

2. **Trigger new Railway deployment:**
   - Railway will automatically detect changes
   - Or manually trigger in Railway dashboard

3. **Monitor the build:**
   - Check Railway build logs
   - Look for successful package installation
   - Verify Prisma generation works

4. **Test the deployment:**
   - Check health endpoint: `/api/health`
   - Verify database connection
   - Test main application features

## 📊 Expected Build Output (Success)

```
✅ [1/10] FROM docker.io/library/node:20-bullseye-slim
✅ [2/10] WORKDIR /app
✅ [3/10] RUN apt-get update && apt-get install...
✅ [4/10] COPY package*.json ./
✅ [5/10] RUN npm ci --omit=dev --legacy-peer-deps
✅ [6/10] COPY . .
✅ [7/10] RUN npx prisma generate
✅ [8/10] RUN npm run build
✅ [9/10] RUN mkdir -p public/uploads
✅ [10/10] EXPOSE $PORT
```

## 🔍 Debugging Commands

### Check Railway Logs
```bash
railway logs
```

### Connect to Railway Shell
```bash
railway shell
```

### Test Build Locally
```bash
docker build -t excellence-academia .
docker run -p 3000:3000 excellence-academia
```

## 🆘 If Issues Persist

### Alternative Approaches

1. **Use Railway's Node.js buildpack** instead of Docker:
   - Remove `Dockerfile`
   - Railway will auto-detect Node.js project

2. **Simplify dependencies:**
   - Consider replacing `better-sqlite3` with `sqlite3`
   - Remove packages that require Node.js 20+ if not essential

3. **Use Railway's PostgreSQL** instead of SQLite:
   - Update Prisma schema to use PostgreSQL
   - Remove SQLite-related dependencies

### Contact Support

- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **GitHub Issues:** Create issue in your repository

## 📝 Prevention Tips

1. **Keep dependencies updated** regularly
2. **Test Docker builds locally** before pushing
3. **Use specific Node.js versions** in engines field
4. **Monitor deprecation warnings** and update accordingly
5. **Use multi-stage builds** for production optimization

---

The updated Dockerfile should resolve the build issues. Railway will automatically use the new configuration on the next deployment! 🚀