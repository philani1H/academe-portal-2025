# Quick Start Guide - Admin Dashboard Fixes

## What Was Fixed

### 1. User Statistics (Total Users 0/NaN%)
**Before**: Showed "0 active (NaN%)"
**After**: Shows "150 active (75%)" with correct calculations

### 2. Department Statistics
**Before**: All departments showed "0 students, 0 tutors"
**After**: Shows actual counts like "45 students, 8 tutors"

### 3. Tutor Course Counts
**Before**: Course count column was empty
**After**: Shows number of courses each tutor teaches

### 4. Cloudinary Integration
**Before**: No cloud storage for images/videos
**After**: Full Cloudinary integration with upload/delete/transform

## How to Test

### Test User Statistics
1. Open Admin Dashboard
2. Look at top stat cards
3. Verify "Total Users" shows a number > 0
4. Verify percentage is shown (e.g., "112 active (75%)")
5. No "NaN" should appear anywhere

### Test Department Statistics
1. Scroll to "Department Overview" section
2. Each department card should show:
   - Number of students (e.g., "45 students")
   - Number of courses (e.g., "5 courses")
   - Number of tutors (e.g., "8 tutors")
3. All numbers should be > 0 if you have data

### Test Tutor Course Counts
1. Go to "Tutors" tab in Admin Dashboard
2. Look at the "Courses" column in the table
3. Each tutor should show their course count (e.g., "3")
4. Click on a tutor to see their course list

### Test Cloudinary (Optional)
1. Go to Content Management
2. Try uploading an image or video
3. Use the Cloudinary utility functions
4. Check uploads appear in Cloudinary dashboard

## Quick Fixes if Issues Persist

### If Stats Still Show 0:
```bash
# Check if you have users in database
# Run this in your database client:
SELECT role, COUNT(*) FROM user GROUP BY role;

# Should show:
# student | 120
# tutor   | 30
# admin   | 5
```

### If Department Counts Are 0:
```bash
# Check if users have department field set
SELECT department, COUNT(*) FROM user WHERE role='student' GROUP BY department;
SELECT department, COUNT(*) FROM user WHERE role='tutor' GROUP BY department;

# If empty, update users:
UPDATE user SET department='Mathematics' WHERE id IN (1,2,3);
```

### If Tutor Course Counts Are 0:
```bash
# Check if courses have tutorId set
SELECT tutorId, COUNT(*) FROM course GROUP BY tutorId;

# If empty, assign tutors to courses:
UPDATE course SET tutorId=1 WHERE id IN (1,2,3);
```

## Using Cloudinary

### Basic Upload
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary'

// In your component
const handleFileUpload = async (file: File) => {
  const result = await uploadToCloudinary(file, 'course-materials')
  console.log('Uploaded URL:', result.secure_url)
  // Save result.secure_url to your database
}
```

### Delete File
```typescript
import { deleteFromCloudinary } from '@/lib/cloudinary'

const handleDelete = async (publicId: string) => {
  await deleteFromCloudinary(publicId, 'image')
}
```

### Get Optimized Image
```typescript
import { getCloudinaryUrl } from '@/lib/cloudinary'

const thumbnailUrl = getCloudinaryUrl('my-image', {
  width: 300,
  height: 200,
  crop: 'fill',
  quality: 'auto'
})
```

## Environment Setup

Add to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=dszurpfhf
CLOUDINARY_API_KEY=649648851431394
CLOUDINARY_API_SECRET=lVtK5OH5DI1fk3YMluxdXqjVGnY
```

## Verification Checklist

- [ ] Total Users shows number > 0
- [ ] Active percentage shows (not NaN)
- [ ] All stat cards have numbers
- [ ] Department cards show student counts
- [ ] Department cards show tutor counts
- [ ] Tutor table shows course counts
- [ ] Cloudinary credentials configured
- [ ] Can upload images/videos

## Common Issues

**Issue**: "Cannot read property 'totalUsers' of undefined"
**Fix**: API endpoint might be failing. Check server logs.

**Issue**: Department counts still 0
**Fix**: Users need `department` field populated in database.

**Issue**: Tutor course count is 0
**Fix**: Courses need `tutorId` field set in database.

**Issue**: Cloudinary upload fails
**Fix**: Check credentials and upload preset in Cloudinary dashboard.

## Need Help?

1. Check browser console for errors (F12)
2. Check server logs for API errors
3. Verify database has data
4. Review ADMIN_DASHBOARD_FIXES.md for details

## Summary

✅ All statistics now display correctly
✅ Department overview shows real data
✅ Tutor management shows course counts
✅ Cloudinary ready for media uploads

Everything should work out of the box. If you see any 0 values, it means you need to populate that data in your database!

---

**Quick Test**: Refresh admin dashboard and check if numbers appear. If yes, you're all set! 🎉
