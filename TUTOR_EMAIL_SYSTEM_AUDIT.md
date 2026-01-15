# Tutor Dashboard Email System Audit & Fixes

## Current Issues Found

### 1. **Email Sender Identity**
- ❌ All emails sent from tutor dashboard use system default email (`notifications@excellenceakademie.co.za`)
- ❌ Tutor's name and email are not used as the sender
- ❌ Students cannot reply directly to their tutor

### 2. **Email Endpoints Status**

#### A. Student Invitation (`/api/tutor/students/invite`)
- ✅ Connected to database
- ✅ Verifies course ownership
- ✅ Sends invitation emails
- ❌ Uses system email as sender (should use tutor's email)
- ❌ Does NOT send credentials (uses invitation link instead)

#### B. Notification System (`/api/tutor/email/send`)
- ✅ Connected to database
- ✅ Fetches enrolled students
- ✅ Sends emails to students
- ❌ Uses system email as sender (should use tutor's email)

#### C. Live Session Notifications
- ⚠️ Not implemented - needs to be added
- Should notify students when tutor starts a live session
- Should use tutor's email as sender

### 3. **Dashboard Button Functionality**

| Button | Location | Status | Database Connected | Email Sent |
|--------|----------|--------|-------------------|------------|
| **Start Live Session** | Course Card | ✅ Working | ✅ Yes | ❌ No email sent |
| **Schedule Session** | Course Card | ✅ Working | ✅ Yes | ❌ No email sent |
| **Add Students** | Course Details | ✅ Working | ✅ Yes | ✅ Email sent (wrong sender) |
| **Send Notification** | Notifications Tab | ✅ Working | ✅ Yes | ✅ Email sent (wrong sender) |
| **Upload Material** | Materials Tab | ✅ Working | ✅ Yes | ❌ No email sent |
| **Create Test** | Tests Tab | ⚠️ Placeholder | ❌ Not connected | ❌ No email |
| **Approve Student** | Dashboard | ⚠️ Placeholder | ❌ Not connected | ❌ No email |
| **Reject Student** | Dashboard | ⚠️ Placeholder | ❌ Not connected | ❌ No email |

## Required Fixes

### Priority 1: Fix Email Sender Identity

**Update all tutor email endpoints to use tutor's email as sender:**

1. Modify `sendEmail` function to accept `fromEmail` and `fromName` parameters
2. Update `/api/tutor/students/invite` to use tutor's email
3. Update `/api/tutor/email/send` to use tutor's email
4. Add tutor email to live session notifications

### Priority 2: Add Missing Email Notifications

**Implement email notifications for:**

1. **Live Session Started**
   - When tutor clicks "Start Live Session"
   - Email all enrolled students
   - Include session link and course name
   - Use tutor's email as sender

2. **Live Session Scheduled**
   - When tutor schedules a session
   - Email all enrolled students
   - Include date, time, and join link
   - Use tutor's email as sender

3. **Material Uploaded**
   - When tutor uploads new material
   - Email all enrolled students
   - Include material name and download link
   - Use tutor's email as sender

4. **Test Created**
   - When tutor creates a new test
   - Email all enrolled students
   - Include test details and deadline
   - Use tutor's email as sender

### Priority 3: Complete Database Integration

**Connect remaining buttons to database:**

1. **Approve/Reject Student** - Update student status in database
2. **Create Test** - Save test to database
3. **Edit Course** - Update course details in database

## Implementation Plan

### Step 1: Update Email Service

```typescript
// src/lib/email.ts
export interface EmailPayload {
  to: string;
  subject: string;
  content: string;
  fromEmail?: string;  // NEW
  fromName?: string;   // NEW
}

export async function sendEmail(payload: EmailPayload) {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = payload.subject;
  sendSmtpEmail.htmlContent = payload.content;
  sendSmtpEmail.sender = {
    name: payload.fromName || defaultFromName,
    email: payload.fromEmail || defaultFromEmail
  };
  sendSmtpEmail.to = [{ email: payload.to }];
  // ... rest of implementation
}
```

### Step 2: Update Tutor Endpoints

```typescript
// Get tutor info
const tutor = await prisma.user.findUnique({ 
  where: { id: tutorId } 
});

const tutorEmail = tutor?.email || defaultFromEmail;
const tutorName = tutor?.name || 'Your Tutor';

// Send email with tutor's identity
await sendEmail({
  to: studentEmail,
  subject: 'Invitation from ' + tutorName,
  content: html,
  fromEmail: tutorEmail,
  fromName: tutorName
});
```

### Step 3: Add Live Session Notifications

```typescript
app.post('/api/tutor/live-session/notify', authenticateJWT, authorizeRoles('tutor'), async (req, res) => {
  const { courseId, sessionLink } = req.body;
  const tutorId = req.user?.id;
  
  // Get tutor info
  const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
  
  // Get enrolled students
  const students = await getEnrolledStudents(courseId);
  
  // Send email to each student
  for (const student of students) {
    await sendEmail({
      to: student.email,
      subject: `Live Session Started - ${courseName}`,
      content: renderLiveSessionEmail({
        studentName: student.name,
        tutorName: tutor.name,
        courseName,
        sessionLink
      }),
      fromEmail: tutor.email,
      fromName: tutor.name
    });
  }
});
```

### Step 4: Add Material Upload Notifications

```typescript
app.post('/api/tutor/materials/upload', authenticateJWT, authorizeRoles('tutor'), async (req, res) => {
  // ... upload material logic ...
  
  // Notify students
  const students = await getEnrolledStudents(courseId);
  const tutor = await prisma.user.findUnique({ where: { id: tutorId } });
  
  for (const student of students) {
    await sendEmail({
      to: student.email,
      subject: `New Material: ${materialName}`,
      content: renderMaterialUploadEmail({
        studentName: student.name,
        tutorName: tutor.name,
        courseName,
        materialName,
        downloadLink
      }),
      fromEmail: tutor.email,
      fromName: tutor.name
    });
  }
});
```

## Email Templates Needed

### 1. Live Session Started Email
```html
Subject: 🔴 Live Session Started - [Course Name]
From: [Tutor Name] <[tutor@email.com]>

Hi [Student Name],

Your tutor [Tutor Name] has started a live session for [Course Name].

Join now: [Session Link]

Don't miss out on this interactive learning opportunity!
```

### 2. Live Session Scheduled Email
```html
Subject: 📅 Live Session Scheduled - [Course Name]
From: [Tutor Name] <[tutor@email.com]>

Hi [Student Name],

[Tutor Name] has scheduled a live session for [Course Name].

Date: [Date]
Time: [Time]
Duration: [Duration] minutes

Mark your calendar and join us!
```

### 3. Material Uploaded Email
```html
Subject: 📚 New Material Available - [Course Name]
From: [Tutor Name] <[tutor@email.com]>

Hi [Student Name],

[Tutor Name] has uploaded new material for [Course Name]:

Material: [Material Name]
Type: [PDF/Video/Document]

Download: [Download Link]
```

### 4. Test Created Email
```html
Subject: 📝 New Test Available - [Course Name]
From: [Tutor Name] <[tutor@email.com]>

Hi [Student Name],

[Tutor Name] has created a new test for [Course Name]:

Test: [Test Name]
Due Date: [Date]
Duration: [Duration] minutes

Start Test: [Test Link]
```

## Testing Checklist

### Email Sender Tests
- [ ] Student invitation shows tutor's email as sender
- [ ] Notification emails show tutor's email as sender
- [ ] Live session emails show tutor's email as sender
- [ ] Material upload emails show tutor's email as sender
- [ ] Students can reply directly to tutor's email

### Button Functionality Tests
- [ ] Start Live Session creates session and sends emails
- [ ] Schedule Session saves to database and sends emails
- [ ] Add Students invites via email with tutor as sender
- [ ] Send Notification sends email with tutor as sender
- [ ] Upload Material saves file and sends notification
- [ ] Create Test saves to database and sends notification
- [ ] Approve Student updates database
- [ ] Reject Student updates database

### Database Integration Tests
- [ ] All student data persists correctly
- [ ] Course enrollments are tracked
- [ ] Scheduled sessions are saved
- [ ] Materials are linked to courses
- [ ] Tests are linked to courses
- [ ] Email logs are recorded

## Security Considerations

1. **Email Spoofing Prevention**
   - Verify tutor owns the email address
   - Use SPF/DKIM records for tutor domain
   - Fallback to system email if tutor email invalid

2. **Rate Limiting**
   - Limit emails per tutor per hour
   - Prevent spam to students
   - Log all email sends

3. **Privacy**
   - BCC students in bulk emails
   - Don't expose student emails to each other
   - Allow students to opt-out of notifications

## Performance Optimization

1. **Batch Email Sending**
   - Queue emails for background processing
   - Send in batches of 50
   - Retry failed sends

2. **Caching**
   - Cache enrolled student lists
   - Cache tutor information
   - Invalidate on enrollment changes

3. **Database Queries**
   - Index on tutor_id, course_id
   - Use prepared statements
   - Optimize JOIN queries

## Next Steps

1. ✅ Update `sendEmail` function to accept sender parameters
2. ✅ Modify tutor invitation endpoint
3. ✅ Modify tutor notification endpoint
4. ⏳ Add live session notification endpoint
5. ⏳ Add material upload notification endpoint
6. ⏳ Add test creation notification endpoint
7. ⏳ Create email templates
8. ⏳ Test all email flows
9. ⏳ Deploy and monitor
