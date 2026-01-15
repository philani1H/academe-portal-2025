# API Migration Guide - Express Server Integration

## Issue
The application has Next.js-style API routes (`src/pages/api/*`) but is running an Express server on port 8080.

## Solution Options

### Option 1: Move APIs to Express Server (Recommended)
Move all API logic to the Express server in `src/server/index.ts`

### Option 2: Proxy API Calls
Configure Vite to proxy `/api/*` requests to Express server

---

## Quick Fix: Add API Routes to Express Server

Add these routes to `src/server/index.ts`:

```typescript
// Email API
app.get('/api/emails', async (req, res) => {
  // Import and use the logic from src/pages/api/emails.ts
});

app.post('/api/emails/send', async (req, res) => {
  // Email sending logic
});

// Tests API  
app.get('/api/tests', async (req, res) => {
  // Tests logic
});

// Students List API
app.get('/api/students/list', async (req, res) => {
  // Students list logic
});

// Bulk Email API
app.post('/api/emails/bulk-send', async (req, res) => {
  // Bulk email logic
});
```

---

## Immediate Fix: Configure Vite Proxy

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

This will forward all `/api/*` requests from Vite (port 5173) to Express (port 8080).

---

## Communication Hub for Teams

Create a dedicated section for internal team communication:

### Features Needed:
1. **Team Channels**
   - General
   - Tutors
   - Finance
   - Admin
   - IT Support

2. **Direct Messages**
   - One-on-one chats
   - Group chats

3. **Announcements**
   - Company-wide
   - Department-specific

4. **File Sharing**
   - Documents
   - Images
   - Videos

5. **Notifications**
   - Real-time alerts
   - Email digests

Would you like me to implement this communication hub?
