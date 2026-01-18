#!/bin/bash

# Railway Deployment Script for Excellence Academia
# This script helps prepare and deploy your application to Railway

set -e

echo "🚀 Excellence Academia - Railway Deployment Script"
echo "=================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "📁 No Railway project found. Creating new project..."
    railway init
fi

# Build the application locally to check for errors
echo "🔨 Building application locally..."
npm run build

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Check deployment status
echo "✅ Deployment initiated!"
echo "📊 Checking deployment status..."
railway status

echo ""
echo "🎉 Deployment complete!"
echo "📱 Your app will be available at: $(railway domain)"
echo "🔍 Monitor logs with: railway logs"
echo "⚙️  Manage environment variables: railway variables"
echo ""
echo "Next steps:"
echo "1. Set up your environment variables in Railway dashboard"
echo "2. Add a PostgreSQL database service"
echo "3. Configure your custom domain (optional)"
echo ""
echo "Happy coding! 🎯"