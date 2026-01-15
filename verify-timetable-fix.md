# Timetable Course Display - Verification Guide

## Quick Verification Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Login as Admin
- Navigate to `http://localhost:5173`
- Login with admin credentials
- Go to Admin Dashboard → Timetable tab

### 3. Visual Verification

#### Check Existing Entries
Look at the timetable grid and verify:
- ✅ Each timetable entry shows the **course name** (e.g., "Advanced Mathematics")
- ✅ NOT showing subject categories (e.g., "Mathematics")
- ✅ Course names are clearly visible in the colored boxes

#### Check Course Selection
1. Click the "+" button in any empty time slot
2. Look at the "Select Course" dropdown
3. Verify:
   - ✅ Dropdown shows only course names
   - ✅ No redundant subject in parentheses
   - ✅ Courses are filtered by selected tutor (if applicable)

### 4. Functional Testing

#### Test Manual Entry
1. Click "+" in an empty slot
2. Select a tutor (if in "All Tutors" view)
3. Select a course from dropdown
4. Set time range
5. Click "Save"
6. Verify: The new entry shows the course name

#### Test Auto-Schedule
1. Click "Auto Schedule" button
2. Configure:
   - Start Time: 08:00
   - End Time: 17:00
   - Class Duration: 60 minutes
   - Break Duration: 15 minutes
3. Click "Generate"
4. Verify: All generated entries show course names

#### Test Export Functions
1. Click "Excel" button
2. Open the downloaded CSV file
3. Verify: "Course" column contains course names
4. Click "PDF" button
5. Verify: PDF shows course names in the table

### 5. Database Verification (Optional)

If you have access to Prisma Studio:
```bash
npm run prisma:studio
```

1. Open TimetableEntry table
2. Check that entries have valid `courseId`
3. Open Course table
4. Verify courses have proper `name` and `category` fields

### 6. API Testing (Optional)

Test the API endpoint directly:
```bash
curl http://localhost:5173/api/timetable
```

Expected response structure:
```json
{
  "data": [
    {
      "id": "...",
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "tutorName": "John Doe",
      "courseName": "Advanced Mathematics",  // ← Should show course name
      "subject": "Mathematics",              // ← Subject for categorization
      "grade": "Grade 12",
      "type": "Group"
    }
  ]
}
```

## Expected Results

### ✅ Success Indicators
- Timetable displays course names clearly
- No confusion between course names and subjects
- Course selection is intuitive
- Auto-schedule works correctly
- Exports contain course names

### ❌ Issues to Watch For
- If you see generic subjects instead of course names, check:
  1. Course data exists in database
  2. Courses have proper `name` field
  3. TimetableEntry has valid `courseId` reference

## Troubleshooting

### Issue: Timetable shows empty course names
**Solution:** 
1. Check if courses exist: `npm run prisma:studio`
2. Verify courses have `name` field populated
3. Check timetable entries have valid `courseId`

### Issue: Course dropdown is empty
**Solution:**
1. Verify courses are assigned to tutors
2. Check `/api/courses` endpoint returns data
3. Ensure courses have `tutorId` field set

### Issue: Auto-schedule doesn't work
**Solution:**
1. Ensure courses exist in database
2. Verify courses have `tutorId` assigned
3. Check tutors have matching subjects

## Course-Tutor Management Reference

### How Courses are Assigned to Tutors

In the Admin Dashboard → Courses tab:
1. Each course has a "Tutor" field
2. When creating/editing a course, select the tutor from dropdown
3. The system stores `tutorId` in the course record
4. Timetable uses this relationship to:
   - Filter courses by tutor
   - Auto-schedule courses to correct tutors
   - Display tutor-course associations

### Viewing Course-Tutor Relationships

**Admin Dashboard → Courses Tab:**
- Shows all courses with assigned tutors
- Format: "Course Name • Department • Tutor: [Tutor Name]"

**Admin Dashboard → Tutors Tab:**
- Shows tutors with their assigned courses
- Click "View Details" to see course list

**Admin Dashboard → Timetable Tab:**
- Shows scheduled courses per tutor
- Organized by day and time
- Displays course name in each time slot

## Summary

The timetable now correctly displays:
- **Course names** in the timetable grid (e.g., "Advanced Mathematics")
- **Course names** in selection dropdowns
- **Course names** in exports (Excel/PDF)

The subject/category is still maintained internally for:
- Filtering and categorization
- Department assignment
- Reporting purposes

This provides a clearer, more intuitive timetable interface while maintaining all necessary data relationships.
