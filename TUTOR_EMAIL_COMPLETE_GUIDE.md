# Complete Tutor Email System Guide

## 📧 All Email Scenarios in Tutor Dashboard

### ✅ Currently Working

| # | Email Type | Trigger | Location | Status | Sender |
|---|------------|---------|----------|--------|--------|
| 1 | **Student Invitation** | Click "Add Students" | Course → Students Tab | ✅ Working | Tutor's Email |
| 2 | **Custom Notification** | Click "Send Notification" | Notifications Tab | ✅ Working | Tutor's Email |

### ⚠️ Needs Implementation

| # | Email Type | Trigger | Location | Priority | Sender |
|---|------------|---------|----------|----------|--------|
| 3 | **Live Session Started** | Click "Start Live Session" (🔴 video icon) | Course Card | 🔥 HIGH | Tutor's Email |
| 4 | **Live Session Scheduled** | Click "Schedule Session" (🕐 clock icon) | Course Card | 🔥 HIGH | Tutor's Email |
| 5 | **Material Uploaded** | Upload material | Materials Tab | 🟡 MEDIUM | Tutor's Email |
| 6 | **Test Created** | Create/Publish test | Tests Tab | 🟡 MEDIUM | Tutor's Email |
| 7 | **Student Approved** | Click "Approve" | Dashboard Pending | 🟢 LOW | Tutor's Email |
| 8 | **Student Rejected** | Click "Reject" | Dashboard Pending | 🟢 LOW | Tutor's Email |

## 🎯 Priority Implementation Order

### Phase 1: Critical (Immediate)
1. **Live Session Started** - Students need to know immediately
2. **Live Session Scheduled** - Students need advance notice

### Phase 2: Important (Next)
3. **Material Uploaded** - Students should be notified of new content
4. **Test Created** - Students need to know about assessments

### Phase 3: Nice to Have
5. **Student Approved/Rejected** - Enrollment status updates

## 📝 Detailed Email Specifications

### 1. Live Session Started Email

**Endpoint:** `POST /api/tutor/live-session/notify`

**Trigger:** When tutor clicks "Start Live Session" button

**Request Body:**
```json
{
  "courseId": "course-123",
  "sessionId": "session-456",
  "sessionLink": "https://excellenceakademie.co.za/live-session/session-456"
}
```

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: 🔴 LIVE NOW: [Course Name] Session

Hi [Student Name],

Your tutor [Tutor Name] has started a live session for [Course Name].

Join the session now:
[Join Session Button]

Session Link: [sessionLink]

Don't miss this interactive learning opportunity!

---
[Tutor Name]
[Course Name]
```

**Implementation:**
```typescript
app.post('/api/tutor/live-session/notify', authenticateJWT, authorizeRoles('tutor'), async (req, res) => {
  const { courseId, sessionId, sessionLink } = req.body;
  const tutorId = req.user?.id;
  
  // Get tutor info
  const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
  
  // Get course info
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  
  // Get enrolled students
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    include: { user: true }
  });
  
  const results = [];
  for (const enrollment of enrollments) {
    const student = enrollment.user;
    const html = renderLiveSessionStartedEmail({
      studentName: student.name,
      tutorName: tutor.name,
      courseName: course.title,
      sessionLink
    });
    
    const r = await sendEmail({
      to: student.email,
      subject: `🔴 LIVE NOW: ${course.title} Session`,
      content: html,
      fromEmail: tutor.email,
      fromName: tutor.name
    });
    
    results.push({ email: student.email, sent: !!r?.success });
  }
  
  return res.json({ success: true, notified: results });
});
```

### 2. Live Session Scheduled Email

**Endpoint:** `POST /api/tutor/scheduled-sessions` (already exists, needs email addition)

**Trigger:** When tutor schedules a session

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: 📅 Scheduled: [Course Name] Live Session

Hi [Student Name],

[Tutor Name] has scheduled a live session for [Course Name].

📅 Date: [Date]
🕐 Time: [Time]
⏱️ Duration: [Duration] minutes

Mark your calendar! You'll receive a reminder before the session starts.

---
[Tutor Name]
[Course Name]
```

**Update existing endpoint:**
```typescript
// After creating scheduled session in database
const enrollments = await prisma.courseEnrollment.findMany({
  where: { courseId: schedulingCourse.id },
  include: { user: true }
});

for (const enrollment of enrollments) {
  const html = renderScheduledSessionEmail({
    studentName: enrollment.user.name,
    tutorName: tutor.name,
    courseName: course.title,
    scheduledDate: scheduledAt,
    duration: duration
  });
  
  await sendEmail({
    to: enrollment.user.email,
    subject: `📅 Scheduled: ${course.title} Live Session`,
    content: html,
    fromEmail: tutor.email,
    fromName: tutor.name
  });
}
```

### 3. Material Uploaded Email

**Endpoint:** `POST /api/tutor/materials/upload` (needs email addition)

**Trigger:** After successful material upload

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: 📚 New Material: [Material Name]

Hi [Student Name],

[Tutor Name] has uploaded new material for [Course Name]:

📄 Material: [Material Name]
📁 Type: [PDF/Video/Document]
📊 Size: [Size]

[Download Button]

Download Link: [downloadLink]

---
[Tutor Name]
[Course Name]
```

### 4. Test Created Email

**Endpoint:** `POST /api/tutor/tests/create` (needs email addition)

**Trigger:** When test is published (status changed to "published")

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: 📝 New Test: [Test Name]

Hi [Student Name],

[Tutor Name] has published a new test for [Course Name]:

📝 Test: [Test Name]
📅 Due Date: [Date]
⏱️ Duration: [Duration] minutes
💯 Total Points: [Points]

[Start Test Button]

Test Link: [testLink]

Good luck!

---
[Tutor Name]
[Course Name]
```

### 5. Student Approved Email

**Endpoint:** Update approval handler

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: ✅ Enrollment Approved - [Course Name]

Hi [Student Name],

Great news! [Tutor Name] has approved your enrollment in [Course Name].

You now have full access to:
✓ Course materials
✓ Live sessions
✓ Tests and assignments
✓ Direct communication with your tutor

[Access Course Button]

Welcome to the class!

---
[Tutor Name]
[Course Name]
```

### 6. Student Rejected Email

**Email Template:**
```
From: [Tutor Name] <tutor@email.com>
To: student@email.com
Subject: Enrollment Status - [Course Name]

Hi [Student Name],

Thank you for your interest in [Course Name].

Unfortunately, your enrollment request has not been approved at this time.

If you have questions, please reply to this email to contact [Tutor Name] directly.

---
[Tutor Name]
```

## 🎨 Email Template Functions Needed

Create these in `src/lib/email.ts`:

```typescript
export function renderLiveSessionStartedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  sessionLink: string;
}) {
  const title = `🔴 LIVE NOW: ${params.courseName}`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>${params.tutorName} has started a live session for <strong>${params.courseName}</strong>.</p>
    <p>Join the session now to participate in this interactive learning opportunity!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.sessionLink}" style="display: inline-block; padding: 15px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        🔴 Join Live Session
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      Session Link: <a href="${params.sessionLink}">${params.sessionLink}</a>
    </p>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderScheduledSessionEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  scheduledDate: Date;
  duration: number;
}) {
  const title = `📅 Scheduled: ${params.courseName} Live Session`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>${params.tutorName} has scheduled a live session for <strong>${params.courseName}</strong>.</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${params.scheduledDate.toLocaleDateString()}</p>
      <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${params.scheduledDate.toLocaleTimeString()}</p>
      <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${params.duration} minutes</p>
    </div>
    <p>Mark your calendar! You'll receive a reminder before the session starts.</p>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderMaterialUploadedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  materialName: string;
  materialType: string;
  downloadLink: string;
}) {
  const title = `📚 New Material: ${params.materialName}`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>${params.tutorName} has uploaded new material for <strong>${params.courseName}</strong>:</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>📄 Material:</strong> ${params.materialName}</p>
      <p style="margin: 5px 0;"><strong>📁 Type:</strong> ${params.materialType}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.downloadLink}" style="display: inline-block; padding: 15px 30px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        📥 Download Material
      </a>
    </div>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderTestCreatedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  testName: string;
  dueDate: Date;
  duration: number;
  totalPoints: number;
  testLink: string;
}) {
  const title = `📝 New Test: ${params.testName}`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>${params.tutorName} has published a new test for <strong>${params.courseName}</strong>:</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>📝 Test:</strong> ${params.testName}</p>
      <p style="margin: 5px 0;"><strong>📅 Due Date:</strong> ${params.dueDate.toLocaleDateString()}</p>
      <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${params.duration} minutes</p>
      <p style="margin: 5px 0;"><strong>💯 Total Points:</strong> ${params.totalPoints}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.testLink}" style="display: inline-block; padding: 15px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        📝 Start Test
      </a>
    </div>
    <p>Good luck!</p>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderStudentApprovedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  courseLink: string;
}) {
  const title = `✅ Enrollment Approved - ${params.courseName}`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>Great news! <strong>${params.tutorName}</strong> has approved your enrollment in <strong>${params.courseName}</strong>.</p>
    <p>You now have full access to:</p>
    <ul>
      <li>✓ Course materials</li>
      <li>✓ Live sessions</li>
      <li>✓ Tests and assignments</li>
      <li>✓ Direct communication with your tutor</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.courseLink}" style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
        🎓 Access Course
      </a>
    </div>
    <p>Welcome to the class!</p>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderStudentRejectedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
}) {
  const title = `Enrollment Status - ${params.courseName}`;
  const message = `
    <p>Hi <strong>${params.studentName}</strong>,</p>
    <p>Thank you for your interest in <strong>${params.courseName}</strong>.</p>
    <p>Unfortunately, your enrollment request has not been approved at this time.</p>
    <p>If you have questions, please reply to this email to contact <strong>${params.tutorName}</strong> directly.</p>
  `;
  return renderBrandedEmail({ title, message });
}
```

## ✅ YES - Tutor Can Compose Custom Emails

### Current Functionality (Notifications Tab)

The tutor dashboard **already has** a full email composition feature in the **Notifications Tab**:

**Features:**
- ✅ Write custom subject
- ✅ Write custom message (multi-line)
- ✅ Select specific course or all courses
- ✅ Set priority (low/medium/high)
- ✅ Preview before sending
- ✅ Quick templates for common messages
- ✅ Sends from tutor's email address
- ✅ Students can reply directly

**How to Use:**
1. Navigate to **Notifications** tab
2. Click **"Send Notification"** button
3. Fill in the form:
   - Message (required)
   - Course (optional - defaults to all students)
   - Priority (low/medium/high)
4. Click **"Send Notification"**
5. Email is sent to all enrolled students from tutor's email

**Quick Templates Available:**
- Assignment Posted
- Test Reminder
- Material Update

## 📊 Implementation Checklist

### Immediate (Phase 1)
- [ ] Add live session started email notification
- [ ] Add live session scheduled email notification
- [ ] Create email templates for live sessions
- [ ] Test email delivery

### Next (Phase 2)
- [ ] Add material uploaded email notification
- [ ] Add test created email notification
- [ ] Create email templates for materials and tests
- [ ] Test email delivery

### Future (Phase 3)
- [ ] Add student approved/rejected emails
- [ ] Add automated deadline reminders
- [ ] Add grade posted notifications
- [ ] Create email templates for all scenarios

## 🎯 Summary

**Total Email Scenarios:** 8 main types

**Currently Working:** 2 (Student Invitation, Custom Notifications)

**Needs Implementation:** 6 (Live sessions, materials, tests, approvals)

**Custom Email Composition:** ✅ YES - Available in Notifications Tab

All emails will use **tutor's email address** as sender, enabling direct student-tutor communication.
