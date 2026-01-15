# Bulk Email System - Complete Implementation

## Overview
Professional bulk email system with internal mailbox and external email capabilities for tutors and admins.

---

## Features Implemented

### 1. **Dual Email System**

#### Internal Mailbox (Database)
- **Purpose**: Tutor ↔ Student ↔ Admin communication
- **Storage**: Database (Email model)
- **Domain**: @excellenceakademie.co.za
- **Access**: Via inbox tab in dashboards
- **Features**: Read/unread, star, folders, search

#### External Email (Brevo)
- **Purpose**: Updates, newsletters, announcements
- **Provider**: Brevo API
- **Target**: Personal Gmail accounts
- **Domain**: From Excellence Academia domain
- **Templates**: Professional branded emails

---

## 2. **Bulk Email Composer Component**

**Location**: `src/components/BulkEmailComposer.tsx`

### Features:
✅ **Student Selection**
- Search by name or email
- Filter by course
- Select all / Clear all
- Visual selection with checkboxes
- Shows selected count

✅ **Email Type Toggle**
- Internal Mailbox (system emails)
- External Email (personal Gmail)

✅ **Professional Templates**
1. General Announcement
2. Course Update
3. Session Reminder
4. Newsletter
5. Achievement Congratulations

✅ **Smart Placeholders**
- [Student Name]
- [Course Name]
- [Tutor Name]
- [Date]
- [Time]

✅ **Email Preview**
- Preview before sending
- See how email will look
- Verify content

✅ **Bulk Operations**
- Send to multiple students at once
- Progress tracking
- Error handling per student

---

## 3. **API Endpoints**

### `/api/emails/bulk-send.ts`
**Method**: POST
**Auth**: JWT Required
**Access**: Admin, Tutor

**Request Body**:
```json
{
  "students": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@excellenceakademie.co.za",
      "personalEmail": "john.doe@gmail.com",
      "course": "Mathematics 101"
    }
  ],
  "subject": "Important Update",
  "body": "Email content here",
  "emailType": "internal" | "external",
  "template": "announcement"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sent 5 email(s), 0 failed",
  "results": {
    "sent": 5,
    "failed": 0,
    "errors": []
  }
}
```

**Features**:
- Personalizes each email with student data
- Replaces placeholders automatically
- Sends via Brevo for external emails
- Saves to database for internal emails
- Tracks success/failure per student

---

### `/api/students/list.ts`
**Method**: GET
**Auth**: JWT Required
**Access**: Admin, Tutor

**Response**:
```json
{
  "students": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@excellenceakademie.co.za",
      "personalEmail": "john.doe@gmail.com",
      "course": "Mathematics 101"
    }
  ]
}
```

**Features**:
- Tutors see only their students
- Admins see all students
- Includes both system and personal emails
- Shows enrolled courses

---

### `/api/emails.ts`
**Methods**: GET, POST, PATCH, DELETE
**Auth**: JWT Required

**Features**:
- Get emails by folder (inbox, sent, archived, trash)
- Send individual emails
- Update email status (read, starred)
- Move to trash

---

## 4. **Email Templates**

### Template Structure:
```typescript
{
  name: 'Template Name',
  subject: 'Email Subject with [Placeholders]',
  body: `Professional email body
  
  With proper formatting
  And [Placeholders]
  
  Best regards,
  [Tutor Name]`
}
```

### Available Templates:

#### 1. General Announcement
- For system-wide announcements
- Updates about platform changes
- Important notices

#### 2. Course Update
- Course-specific updates
- Schedule changes
- Material uploads

#### 3. Session Reminder
- Upcoming session reminders
- Date, time, and course details
- Preparation instructions

#### 4. Newsletter
- Monthly newsletters
- Platform updates
- Success stories

#### 5. Achievement Congratulations
- Celebrate student achievements
- Test scores
- Course completions

---

## 5. **Integration**

### Tutor Dashboard
**Location**: `src/pages/tutor/TutorDashboard.tsx`

**Added**:
- "Send Bulk Email" button in Quick Actions
- Opens BulkEmailComposer dialog
- Shows only students in tutor's courses

### Admin Dashboard
**To be added**:
- Similar bulk email button
- Access to all students
- Additional admin-specific templates

---

## 6. **Email Flow**

### Internal Email Flow:
```
Tutor/Admin → Compose → Select Students → Send
                ↓
        Save to Database
                ↓
        Sender: sent folder (read: true)
        Recipients: inbox folder (read: false)
```

### External Email Flow:
```
Tutor/Admin → Compose → Select Students → Send
                ↓
        Use Personal Emails
                ↓
        Send via Brevo API
                ↓
        Branded HTML Template
                ↓
        Delivered to Gmail
```

---

## 7. **Placeholder Replacement**

Automatic replacement for each student:
- `[Student Name]` → Actual student name
- `[Course Name]` → Student's enrolled course
- `[Tutor Name]` → Sender's name
- `[Date]` → Current date
- `[Time]` → Current time

---

## 8. **Security & Permissions**

### Authentication:
- JWT token required
- Role-based access control
- Tutors: Only their students
- Admins: All students

### Data Privacy:
- Personal emails only visible to authorized users
- System emails for internal communication
- Personal emails for external updates

---

## 9. **User Experience**

### For Tutors:
1. Click "Send Bulk Email" in Quick Actions
2. Choose email type (internal/external)
3. Select template or write custom
4. Search and select students
5. Preview email
6. Send to all selected

### For Students:
- **Internal emails**: Appear in mailbox inbox
- **External emails**: Delivered to personal Gmail
- Both show sender name and role
- Professional branding

---

## 10. **Error Handling**

### Per-Student Tracking:
- Tracks success/failure for each student
- Continues sending even if one fails
- Returns detailed error report
- Shows which students received email

### User Feedback:
- Loading states during send
- Success toast with count
- Error toast with details
- Retry capability

---

## 11. **Future Enhancements**

### Planned Features:
- [ ] Email scheduling
- [ ] Attachment support
- [ ] Email analytics (open rates)
- [ ] Custom template builder
- [ ] Email history per student
- [ ] Unsubscribe management
- [ ] Email groups/lists
- [ ] A/B testing

---

## 12. **Testing Checklist**

### Tutor Testing:
- [ ] Open bulk email composer
- [ ] Search students
- [ ] Filter by course
- [ ] Select multiple students
- [ ] Switch between internal/external
- [ ] Try different templates
- [ ] Preview email
- [ ] Send internal email
- [ ] Send external email
- [ ] Verify delivery

### Admin Testing:
- [ ] Access all students
- [ ] Send to different courses
- [ ] Test all templates
- [ ] Verify permissions

### Student Testing:
- [ ] Receive internal email in mailbox
- [ ] Receive external email in Gmail
- [ ] Verify formatting
- [ ] Check personalization

---

## 13. **Configuration**

### Environment Variables:
```env
# Brevo API (for external emails)
BREVO_API_KEY=your_api_key
BREVO_FROM_EMAIL=notifications@excellenceakademie.co.za
BREVO_FROM_NAME=Excellence Academia

# JWT
JWT_SECRET=your_secret_key

# Database
DATABASE_URL=file:../APP-Database.db
```

---

## 14. **Database Schema**

### Email Model:
```prisma
model Email {
  id        String   @id @default(uuid())
  from      String
  fromName  String
  to        String
  subject   String
  body      String
  htmlBody  String?
  timestamp DateTime @default(now())
  read      Boolean  @default(false)
  starred   Boolean  @default(false)
  folder    String   @default("inbox")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### User Model (Updated):
```prisma
model User {
  id            Int     @id @default(autoincrement())
  name          String
  email         String  @unique  // System email
  personalEmail String? // Personal Gmail
  role          String
  // ... other fields
}
```

---

## 15. **Best Practices**

### Email Content:
✅ Professional tone
✅ Clear subject lines
✅ Personalized greetings
✅ Actionable content
✅ Contact information
✅ Unsubscribe option (for newsletters)

### Technical:
✅ Rate limiting (prevent spam)
✅ Error handling per recipient
✅ Logging for audit trail
✅ Template validation
✅ HTML sanitization

---

## 16. **Support & Maintenance**

### Monitoring:
- Track email delivery rates
- Monitor Brevo API usage
- Log failed sends
- Review bounce rates

### Maintenance:
- Update templates regularly
- Review and improve content
- Add new templates as needed
- Monitor student feedback

---

**Implementation Status**: ✅ Complete
**Testing Status**: ⏳ Ready for Testing
**Documentation**: ✅ Complete

---

*Last Updated: January 14, 2026*
*Version: 1.0.0*
