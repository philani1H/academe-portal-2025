#!/bin/bash

# EduPlatform Setup Script
echo "🚀 Setting up EduPlatform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration before running the application"
else
    echo "✅ .env file already exists"
fi

# Check if Prisma is installed
if ! command -v npx prisma &> /dev/null; then
    echo "❌ Prisma CLI not found. Installing..."
    npm install -g prisma
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database is configured
if grep -q "postgresql://" .env; then
    echo "🗄️  Database URL found in .env"
    echo "📊 Pushing database schema..."
    npx prisma db push
else
    echo "⚠️  Please configure DATABASE_URL in .env file before running database commands"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Set up your PostgreSQL database"
echo "3. Run 'npm run db:push' to create database tables"
echo "4. Run 'npm run dev' to start the development server"
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, check the README.md file"