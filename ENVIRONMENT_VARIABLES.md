# Environment Variables Configuration

This document lists all required environment variables for the Excellence Academia application.

## 🔒 Security Notice

**NEVER commit actual API keys, passwords, or secrets to your repository!**

Use the Railway dashboard to set these variables securely.

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database
```
*Note: Railway will automatically provide these when you add a PostgreSQL service*

### Email Service (Brevo)
```bash
BREVO_API_KEY=your-brevo-api-key-from-dashboard
BREVO_FROM_EMAIL=notifications@yourdomain.com
BREVO_FROM_NAME=Your App Name
```

### Application URLs
```bash
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://your-railway-app.railway.app
```

### Authentication
```bash
JWT_SECRET=your-super-secure-random-string-at-least-32-characters
```

### Admin Account
```bash
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_EMAIL=admin@yourdomain.com
```

### File Storage (Cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### System Configuration
```bash
NODE_ENV=production
PORT=3000
```
*Note: Railway automatically sets PORT*

## 🛠️ How to Set Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable name and value
6. Click "Deploy" to apply changes

## 🔐 Security Best Practices

1. **Use Strong Passwords**: Generate random, complex passwords
2. **Rotate Secrets**: Regularly update API keys and secrets
3. **Limit Access**: Only give access to necessary team members
4. **Monitor Usage**: Check logs for suspicious activity
5. **Use Environment-Specific Values**: Different values for dev/staging/prod

## 📋 Variable Checklist

Before deploying, ensure you have:

- [ ] Database connection string (Railway provides)
- [ ] Brevo API key (from Brevo dashboard)
- [ ] Strong JWT secret (generate new for production)
- [ ] Admin credentials (secure password)
- [ ] Cloudinary credentials (from Cloudinary dashboard)
- [ ] Correct domain URLs

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate** the exposed credentials
2. **Remove from git history** using `git filter-branch` or BFG
3. **Update environment variables** with new values
4. **Force push** the cleaned repository

## 📞 Support

If you need help with environment variables:
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Brevo Support: [help.brevo.com](https://help.brevo.com)
- Cloudinary Support: [support.cloudinary.com](https://support.cloudinary.com)