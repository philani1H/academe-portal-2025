# Comprehensive System Redesign Plan

## Overview
This document outlines the complete redesign and enhancement of the Excellence Akademie platform.

## Phase 1: Live Session Redesign (Modern, Better than Teams)

### Design Features:
- **Modern UI**: Dark theme with glassmorphism effects
- **Grid/Speaker View**: Toggle between layouts
- **HD Video Quality**: WebRTC with adaptive bitrate
- **Screen Sharing**: Full screen + application sharing
- **Interactive Features**:
  - Hand raise for students
  - Live reactions (👍, ❤️, 👏)
  - Polls and quizzes during session
  - Breakout rooms
  - Recording capability
  - Virtual backgrounds
  - Noise cancellation

### Mobile Responsive:
- Touch-optimized controls
- Swipe gestures for switching views
- Picture-in-picture mode
- Landscape/portrait optimization
- Reduced data mode

### Technical Implementation:
```typescript
// Key Components:
- ModernLiveSession.tsx (main component)
- VideoGrid.tsx (participant videos)
- ChatPanel.tsx (messaging)
- ControlBar.tsx (bottom controls)
- ParticipantsList.tsx (sidebar)
- ScreenShare.tsx (screen sharing)
- Whiteboard.tsx (collaborative whiteboard)
```

## Phase 2: Student Portal Redesign

### Features:
- **Dashboard**: Personalized learning dashboard
- **Course Cards**: Visual, interactive course cards
- **Progress Tracking**: Circular progress indicators
- **Upcoming Sessions**: Calendar integration
- **Assignments**: Due date tracking with notifications
- **Grades**: Visual grade reports
- **Resources**: Easy access to materials
- **Live Sessions**: One-click join

### Student Data Display:
```typescript
interface StudentProfile {
  // Personal Information
  personalEmail: string;      // Used for newsletters, updates
  studentEmail: string;       // {studentNumber}@excellenceakademie.co.za
  studentNumber: string;      // e.g., "20261234"
  name: string;
  phone: string;
  address: string;
  
  // Academic Information
  enrolledCourses: Course[];
  department: string;
  level: string;
  gpa: number;
  
  // Progress
  completedCourses: number;
  totalCredits: number;
  attendance: number;
}
```

## Phase 3: Email System Clarification

### Email Types:
1. **Personal Email** (`student@gmail.com`):
   - Used for: Invitations, newsletters, updates, announcements
   - Visible to: Admin only
   - Purpose: External communication

2. **Student Email** (`20261234@excellenceakademie.co.za`):
   - Used for: Login, internal communication, mailbox
   - Visible to: Everyone in system
   - Purpose: Internal communication

3. **Tutor Email** (`tutor@excellenceakademie.co.za`):
   - Used for: Internal mailbox communication
   - Personal Gmail: For newsletters/updates
   - Purpose: Professional communication

### Implementation:
```sql
-- Add personal_email column to users table
ALTER TABLE users ADD COLUMN personal_email VARCHAR(255);
ALTER TABLE users ADD COLUMN show_email_publicly BOOLEAN DEFAULT FALSE;
```

## Phase 4: Tutor Subjects in Content Manager

### Database Schema:
```typescript
interface Tutor {
  id: string;
  name: string;
  email: string;
  personalEmail: string;
  subjects: Subject[];  // Array of subjects they teach
  department: string;   // Auto-assigned based on subjects
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  tutors: Tutor[];  // Multiple tutors can teach same subject
}

// Subject = Course relationship
// If tutor has subject "Mathematics", they're assigned to "Mathematics" course
```

### Content Manager Updates:
- Display tutor subjects in tutor list
- Filter tutors by subject
- Assign/unassign subjects
- Show which tutors teach same subjects
- Auto-assign department based on subject

## Phase 5: Timetable System

### Features:

#### For Tutors:
- **View Timetable**: See their schedule
- **Edit Own Schedule**: Request changes
- **Add Availability**: Mark available times
- **View Student Attendance**: Track who attended

#### For Students:
- **View Only**: See their class schedule
- **Download**: Export to calendar (iCal)
- **Notifications**: Reminders before class

#### For Admin:
- **Full Control**: Create/edit all timetables
- **Upload Document**: Parse Excel/PDF timetable
- **Auto-generate**: AI-powered scheduling
- **Conflict Detection**: Prevent overlaps
- **Bulk Operations**: Update multiple entries

### Document Upload Feature:
```typescript
// Admin uploads Excel file with format:
// Day | Time | Subject | Tutor | Room | Students
// System parses and creates timetable entries in database

interface TimetableEntry {
  id: string;
  day: string;  // Monday, Tuesday, etc.
  startTime: string;  // "09:00"
  endTime: string;    // "10:30"
  subject: string;
  course: Course;
  tutor: Tutor;
  room: string;
  students: Student[];
  recurring: boolean;  // Weekly recurring
}
```

## Phase 6: Finance Department Dashboard

### URL: `/finance-department`

### Features:

#### 1. Payroll Management
- **Generate Payslips**: For tutors and staff
- **Payment History**: Track all payments
- **Tax Calculations**: Automatic tax deductions
- **Bank Integration**: Direct deposits
- **Payslip Templates**: Professional PDF generation

#### 2. Student Fees
- **Fee Structure**: Define fees per course
- **Payment Tracking**: Who paid, who owes
- **Payment Plans**: Installment options
- **Receipts**: Auto-generate receipts
- **Reminders**: Send payment reminders

#### 3. Financial Reports
- **Income Statement**: Revenue and expenses
- **Balance Sheet**: Assets and liabilities
- **Cash Flow**: Money in and out
- **Budget vs Actual**: Compare budgets
- **Profit/Loss**: Monthly/yearly reports

#### 4. Expense Management
- **Record Expenses**: Track all costs
- **Categories**: Utilities, salaries, materials
- **Receipts**: Upload and store
- **Approval Workflow**: Multi-level approval
- **Vendor Management**: Track suppliers

#### 5. Document Generation
- **Payslips**: Professional payslip PDFs
- **Invoices**: Student fee invoices
- **Receipts**: Payment receipts
- **Reports**: Financial reports
- **Contracts**: Employment contracts

### Database Schema:
```typescript
interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;  // "January 2026"
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  paymentDate: Date;
  status: "pending" | "paid";
}

interface StudentFee {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid";
  paymentHistory: Payment[];
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date;
  receipt?: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
}
```

## Implementation Priority

### Week 1:
1. ✅ Live Session Redesign
2. ✅ Student Portal Redesign
3. ✅ Email System Updates

### Week 2:
4. ✅ Tutor Subjects in Content Manager
5. ✅ Personal Email Fields
6. ✅ Timetable System (View/Edit)

### Week 3:
7. ✅ Timetable Document Upload
8. ✅ Finance Dashboard (Basic)
9. ✅ Payslip Generation

### Week 4:
10. ✅ Student Fees Management
11. ✅ Financial Reports
12. ✅ Testing & Polish

## Technical Stack

### Frontend:
- React + TypeScript
- Tailwind CSS + Shadcn UI
- Framer Motion (animations)
- WebRTC (video)
- Socket.IO (real-time)
- React Query (data fetching)
- Zustand (state management)

### Backend:
- Node.js + Express
- Prisma ORM
- PostgreSQL/SQLite
- Socket.IO
- JWT Authentication
- Brevo (emails)

### Document Generation:
- PDFKit (PDF generation)
- ExcelJS (Excel parsing)
- Handlebars (templates)

## Design System

### Colors:
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Dark: Slate (#1E293B)

### Typography:
- Headings: Inter Bold
- Body: Inter Regular
- Code: JetBrains Mono

### Components:
- Glassmorphism cards
- Smooth animations
- Micro-interactions
- Loading skeletons
- Toast notifications

## Mobile Optimization

### Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Features:
- Touch gestures
- Bottom navigation
- Swipe actions
- Pull to refresh
- Offline mode
- PWA support

## Security

### Authentication:
- JWT tokens
- Refresh tokens
- Role-based access
- Session management

### Data Protection:
- Encrypted passwords
- HTTPS only
- CORS configuration
- Rate limiting
- Input validation

## Performance

### Optimization:
- Code splitting
- Lazy loading
- Image optimization
- Caching strategy
- CDN integration
- Compression

## Testing

### Types:
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- Performance tests
- Security tests

## Deployment

### Environments:
- Development
- Staging
- Production

### CI/CD:
- GitHub Actions
- Automated testing
- Automated deployment
- Rollback capability

## Documentation

### Required:
- API documentation
- Component library
- User guides
- Admin manual
- Developer docs

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create design mockups
4. Begin Phase 1 implementation
5. Iterative development and testing

---

**Status**: Ready for implementation
**Estimated Timeline**: 4 weeks
**Team Required**: 2-3 developers + 1 designer
