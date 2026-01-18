# Railway Deployment Guide

This guide will help you deploy your Excellence Academia application to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: You'll need a PostgreSQL database (Railway provides this)

## Step 1: Prepare Your Repository

All necessary files have been created:
- ✅ `Dockerfile` - Container configuration
- ✅ `railway.json` - Railway-specific configuration
- ✅ `.dockerignore` - Files to exclude from Docker build
- ✅ `.env.production` - Production environment template

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Dockerfile and start building

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL instance and provide connection details

## Step 4: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables
```bash
# Database (automatically provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
POSTGRES_PRISMA_URL=${{Postgres.DATABASE_URL}}

# Email Configuration (Brevo)
BREVO_API_KEY=your-brevo-api-key-here
BREVO_FROM_EMAIL=notifications@yourdomain.com
BREVO_FROM_NAME=Your App Name

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Admin Configuration
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_EMAIL=admin@yourdomain.com

# JWT Secret (generate a new one for production)
JWT_SECRET=your-super-secure-jwt-secret-for-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Node Environment
NODE_ENV=production
```

### Railway-Specific Variables
Railway automatically provides:
- `PORT` - The port your app should listen on
- `RAILWAY_PUBLIC_DOMAIN` - Your app's public URL

## Step 5: Deploy

1. Railway will automatically build and deploy your application
2. The build process will:
   - Install dependencies
   - Generate Prisma client
   - Build the frontend
   - Run database migrations
   - Seed the database
   - Start the server

## Step 6: Verify Deployment

1. Check the deployment logs in Railway dashboard
2. Visit your app's URL (provided by Railway)
3. Test the health check: `https://your-app.railway.app/api/health`
4. Verify the admin login works

## Step 7: Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable

## Troubleshooting

### Common Issues

1. **Build Fails**: Check the build logs for specific errors
2. **Database Connection**: Ensure `DATABASE_URL` is correctly set
3. **Environment Variables**: Double-check all required variables are set
4. **Port Issues**: Railway automatically sets the `PORT` variable

### Useful Commands

```bash
# Check logs
railway logs

# Connect to database
railway connect postgres

# Run commands in Railway environment
railway run npm run prisma:studio
```

## Monitoring

Railway provides:
- Real-time logs
- Metrics and analytics
- Automatic deployments on git push
- Health checks
- Auto-scaling

## Security Notes

1. **JWT Secret**: Use a strong, unique secret for production
2. **Database**: Railway PostgreSQL is automatically secured
3. **Environment Variables**: Never commit secrets to git
4. **HTTPS**: Railway provides HTTPS by default

## Cost Optimization

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Auto-scaling**: Configure based on your traffic patterns
3. **Database**: Monitor database usage and optimize queries

## Backup Strategy

1. **Database Backups**: Railway provides automatic backups
2. **Code**: Keep your GitHub repository as source of truth
3. **Environment Variables**: Document all required variables

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: For application-specific issues

---

Your Excellence Academia application is now ready for Railway deployment! 🚀