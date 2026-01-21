# Email Configuration Guide - Brevo Integration

## Overview
The Excellence Academia platform uses Brevo (formerly Sendinblue) for sending transactional emails. The system supports both Brevo API and SMTP methods for maximum reliability.

## Configuration Options

### Option 1: Brevo API (Recommended)
The API method is faster and more reliable for high-volume sending.

**Required Environment Variables:**
```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=notifications@excellenceakademie.co.za
BREVO_FROM_NAME=Excellence Academia
```

### Option 2: Brevo SMTP (Fallback)
SMTP is used as a fallback or can be the primary method if API is not available.

**Required Environment Variables:**
```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=7c0d28001@smtp-brevo.com
BREVO_SMTP_PASS=your_smtp_password_here
```

## Current Configuration
Based on the provided SMTP details:
- **SMTP Server:** smtp-relay.brevo.com
- **Port:** 587
- **Username:** 7c0d28001@smtp-brevo.com
- **Password:** [You need to provide this]

## Setup Instructions

### 1. Get Your Brevo Credentials
1. Log into your Brevo account at https://app.brevo.com
2. Go to **SMTP & API** section
3. For API: Copy your API key
4. For SMTP: Use the provided credentials

### 2. Update Environment Variables
Add the following to both `.env` and `.env.production`:

```env
# Brevo Email Configuration
BREVO_API_KEY=your_actual_api_key_here
BREVO_FROM_EMAIL=notifications@excellenceakademie.co.za
BREVO_FROM_NAME=Excellence Academia

# Brevo SMTP Configuration (alternative to API)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=7c0d28001@smtp-brevo.com
BREVO_SMTP_PASS=your_actual_smtp_password_here
```

### 3. Email Sending Priority
The system will try methods in this order:
1. **SMTP** (if BREVO_SMTP_USER and BREVO_SMTP_PASS are configured)
2. **Brevo API** (if BREVO_API_KEY is configured)
3. **Development Mode** (logs emails to console if neither is configured)

## Email Features Implemented

### Tutor Credentials Email
- Sends login credentials to tutors' personal emails
- Includes course assignments and department information
- Uses consistent password generation
- Professional email template with branding

### Student Credentials Email
- Sends login credentials to students' personal emails
- Includes course enrollments and department information
- Student number and portal access information
- Responsive email template

### Email Templates Available
- Tutor credential emails
- Student credential emails
- Welcome emails
- Password reset emails
- Course enrollment confirmations
- Assignment notifications
- Live session notifications

## Testing Email Configuration

### 1. Check Configuration Status
The system will log the email method being used:
- `✅ SMTP transporter configured for Brevo` - SMTP ready
- `✅ Email sent successfully via SMTP` - SMTP working
- `✅ Email sent successfully via Brevo API` - API working
- `⚠️ Neither SMTP nor BREVO_API_KEY configured` - Development mode

### 2. Send Test Email
Use the admin dashboard to send credentials to a test user to verify the configuration works.

## Troubleshooting

### Common Issues
1. **SMTP Authentication Failed**
   - Verify BREVO_SMTP_USER and BREVO_SMTP_PASS are correct
   - Check if your Brevo account is active

2. **API Key Invalid**
   - Verify BREVO_API_KEY is correct and active
   - Check API key permissions in Brevo dashboard

3. **Emails Not Delivered**
   - Check spam/junk folders
   - Verify sender domain is configured in Brevo
   - Check Brevo sending limits

### Email Delivery Best Practices
1. **Domain Authentication**: Configure SPF, DKIM, and DMARC records
2. **Sender Reputation**: Use consistent from addresses
3. **Content Quality**: Avoid spam trigger words
4. **List Hygiene**: Remove bounced/invalid emails

## Security Notes
- Never commit actual API keys or passwords to version control
- Use environment variables for all sensitive configuration
- Regularly rotate API keys and passwords
- Monitor email sending logs for suspicious activity

## Next Steps
1. Obtain your actual Brevo API key and SMTP password
2. Update the environment variables with real credentials
3. Test email sending functionality
4. Configure domain authentication for better deliverability
5. Set up monitoring for email delivery rates