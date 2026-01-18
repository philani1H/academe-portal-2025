@echo off
echo 🚀 Excellence Academia - Railway Deployment Script
echo ==================================================

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
)

REM Login to Railway (if not already logged in)
echo 🔐 Checking Railway authentication...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Railway:
    railway login
)

REM Check if we're in a Railway project
railway status >nul 2>&1
if %errorlevel% neq 0 (
    echo 📁 No Railway project found. Creating new project...
    railway init
)

REM Build the application locally to check for errors
echo 🔨 Building application locally...
npm run build

REM Generate Prisma client
echo 🗄️  Generating Prisma client...
npx prisma generate

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

REM Check deployment status
echo ✅ Deployment initiated!
echo 📊 Checking deployment status...
railway status

echo.
echo 🎉 Deployment complete!
echo 📱 Your app will be available soon
echo 🔍 Monitor logs with: railway logs
echo ⚙️  Manage environment variables: railway variables
echo.
echo Next steps:
echo 1. Set up your environment variables in Railway dashboard
echo 2. Add a PostgreSQL database service
echo 3. Configure your custom domain (optional)
echo.
echo Happy coding! 🎯

pause