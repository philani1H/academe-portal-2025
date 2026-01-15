# Quick Fix - Apply These Changes

## Problem
The bulk upload routes are in the wrong location (inside startup function at line 4471). They need to be BEFORE line 3162.

## Solution
The routes have been added to the correct location in the server file. Just **restart your server**:

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart
npm run dev
```

## After Restart
The API endpoints will work:
- POST `/api/admin/content/pricing-bulk-upload`
- POST `/api/admin/content/tutors-bulk-upload`  
- POST `/api/admin/content/team-bulk-upload`

## Next: Fix ContentManagement.tsx
Now I need to add:
1. Excel file support (.xlsx)
2. Template download buttons
3. Export current data buttons

Let me do that now...
