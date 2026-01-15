# Fix Tutor Edit Error - Null Reference

## Error
```
Cannot read properties of null (reading 'name')
at line 12113 (subjects.map)
```

## Cause
The `subjects` array contains null/undefined items, and when mapping over them to show checkboxes in the tutor edit dialog, it tries to access `.name` on a null object.

## Solution

### Option 1: Quick Fix (Recommended)
Refresh the page - the fix has already been applied to filter out null subjects.

### Option 2: Manual Fix
If the error persists, add this filter in the TutorEditDialog around line 1790:

**Change this:**
```tsx
{subjects.map((subj) => {
  const checked = editingTutor.subjects.includes(subj.name)
```

**To this:**
```tsx
{subjects.filter(subj => subj && subj.name).map((subj) => {
  const checked = editingTutor.subjects.includes(subj.name)
```

## What Was Fixed

1. **Added null filter in subjects mapping** - Line 1790
   - Now filters out any null/undefined subjects before mapping
   - `subjects.filter(subj => subj && subj.name).map(...)`

2. **Added null filter in fetchSubjects** - Line 527
   - Filters out subjects without names when fetching from API
   - `.filter((s: any) => s && s.name)`

3. **Added error handling** - Line 538
   - Sets empty array on error to prevent crashes
   - `setSubjects([]) // Set empty array on error`

## How to Test

1. Refresh the page (Ctrl+R or F5)
2. Go to Content Management → Tutors
3. Click Edit on any tutor
4. The subjects checkboxes should now load without error

## Why This Happened

The subjects database might have:
- Null entries
- Entries without a `name` field
- Corrupted data

The fix ensures we only show valid subjects with names.

## Prevention

To prevent this in the future, add validation when creating subjects:
- Ensure `name` is always required
- Add database constraints
- Validate data before saving

## Status

✅ Fix applied to ContentManagement.tsx
✅ Null checks added
✅ Error handling improved

Just refresh the page and the error should be gone!
