# Timetable Course Display Fix

## Problem
The timetable was displaying the subject/category instead of the actual course name. This made it difficult to identify which specific course was scheduled.

## Solution
Updated the `src/components/Timetable.tsx` component to display the course name instead of the subject.

## Changes Made

### 1. Display Course Name in Timetable Grid
**File:** `src/components/Timetable.tsx`

Changed the display from:
```tsx
<span className="font-semibold text-sm">{cls.courseName || cls.subject}</span>
```

To:
```tsx
<span className="font-semibold text-sm">{cls.courseName}</span>
```

This ensures the timetable always shows the course name (e.g., "Advanced Mathematics", "Physics 101") instead of falling back to the subject category.

### 2. Simplified Course Selection Dropdown
**File:** `src/components/Timetable.tsx`

Updated the course selection dropdown to show only the course name without the redundant subject in parentheses:
```tsx
<option key={c.id} value={c.name}>{c.name}</option>
```

Previously showed: "Advanced Mathematics (Mathematics)"
Now shows: "Advanced Mathematics"

## How It Works

### Data Flow
1. **Courses API** (`/api/courses`) returns courses with:
   - `name`: The course name (e.g., "Advanced Mathematics")
   - `category`: The subject category (e.g., "Mathematics")
   - `tutorId`: The assigned tutor

2. **Timetable Component** loads courses and maps them to include:
   - `name`: Course name
   - `subject`: Category/department for filtering
   - `tutorId`: For tutor-course matching

3. **Display Logic**:
   - Shows `courseName` in the timetable grid
   - Uses `subject` internally for categorization
   - Filters courses by tutor when adding new classes

### Course-Tutor Relationship
The system maintains proper course-tutor relationships:
- Each course has a `tutorId` field linking it to a tutor
- When auto-scheduling, the system matches courses to tutors based on:
  1. Direct `tutorId` match
  2. Subject expertise match (tutor's subjects array)
- Manual scheduling allows selecting courses filtered by the selected tutor

## Verification Steps

### 1. Check Existing Timetable Entries
1. Navigate to Admin Dashboard → Timetable
2. Verify that all timetable entries show course names (not subjects)
3. Check both "All Tutors" and "Individual Tutor" views

### 2. Add New Timetable Entry
1. Click the "+" button in any empty time slot
2. Select a tutor (if in "All Tutors" view)
3. Select a course from the dropdown
4. Verify the dropdown shows only course names
5. Save and verify the course name appears in the timetable

### 3. Test Auto-Schedule
1. Click "Auto Schedule" button
2. Configure time slots
3. Click "Generate"
4. Verify all auto-scheduled entries show course names

### 4. Test Export Functions
1. Export to Excel - verify "Course" column shows course names
2. Export to PDF - verify course names appear in the table

## Database Schema Reference

### Course Model
```prisma
model Course {
  id          Int       @id @default(autoincrement())
  name        String    // Course name (displayed in timetable)
  category    String?   // Subject category (used for filtering)
  department  String?   // Department (auto-assigned)
  tutorId     Int?      // Assigned tutor
  ...
}
```

### TimetableEntry Model
```prisma
model TimetableEntry {
  id        String   @id @default(uuid())
  day       String
  timeSlot  String
  courseId  Int      // Links to Course.id
  tutorId   Int      // Links to User.id (tutor)
  ...
  course    Course   @relation(fields: [courseId], references: [id])
  tutor     User     @relation(fields: [tutorId], references: [id])
}
```

## API Endpoints

### GET /api/timetable
Returns timetable entries with course information:
```json
{
  "data": [
    {
      "id": "uuid",
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "09:00",
      "tutorId": "8",
      "tutorName": "John Doe",
      "courseId": 1,
      "courseName": "Advanced Mathematics",
      "subject": "Mathematics",
      "grade": "Grade 12",
      "type": "Group"
    }
  ]
}
```

### POST /api/timetable
Saves timetable entries by resolving course names to course IDs:
- Looks up course by name
- Validates tutor assignment
- Creates timetable entries with proper relationships

## Testing Checklist

- [x] Code changes applied
- [x] No TypeScript errors
- [ ] Timetable displays course names
- [ ] Course dropdown shows only course names
- [ ] Auto-schedule uses course names
- [ ] Excel export shows course names
- [ ] PDF export shows course names
- [ ] Course-tutor filtering works correctly

## Notes

- The `subject` field is still maintained internally for categorization and filtering
- Export functions include both course name and subject for comprehensive reporting
- The auto-schedule function properly matches courses to tutors based on the `tutorId` field
- All existing timetable data will automatically display course names without migration
