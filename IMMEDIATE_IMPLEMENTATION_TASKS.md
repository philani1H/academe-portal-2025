# Immediate Implementation Tasks

## Critical Priority (Do First)

### 1. Database Schema Updates

Add to `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...
  
  // NEW FIELDS
  personalEmail     String?  @map("personal_email")  // For newsletters, hidden from public
  showEmailPublicly Boolean  @default(false) @map("show_email_publicly")
  subjects          String?  // JSON array of subject IDs for tutors
  phoneNumber       String?  @map("phone_number")
  address           String?
  
  // Relations
  payslips          Payslip[]
  studentFees       StudentFee[]
  timetableEntries  TimetableEntry[]
}

model Subject {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  department  String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  courses     Course[]
  
  @@map("subjects")
}

model TimetableEntry {
  id          String   @id @default(uuid())
  day         String   // Monday, Tuesday, etc.
  startTime   String   @map("start_time")  // "09:00"
  endTime     String   @map("end_time")    // "10:30"
  courseId    Int      @map("course_id")
  tutorId     Int      @map("tutor_id")
  room        String?
  recurring   Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  course      Course   @relation(fields: [courseId], references: [id])
  tutor       User     @relation(fields: [tutorId], references: [id])
  
  @@map("timetable_entries")
}

model Payslip {
  id            String   @id @default(uuid())
  employeeId    Int      @map("employee_id")
  period        String   // "January 2026"
  basicSalary   Float    @map("basic_salary")
  allowances    Float    @default(0)
  deductions    Float    @default(0)
  tax           Float    @default(0)
  netPay        Float    @map("net_pay")
  paymentDate   DateTime @map("payment_date")
  status        String   @default("pending")  // pending, paid
  pdfUrl        String?  @map("pdf_url")
  createdAt     DateTime @default(now()) @map("created_at")
  
  employee      User     @relation(fields: [employeeId], references: [id])
  
  @@map("payslips")
}

model StudentFee {
  id            String   @id @default(uuid())
  studentId     Int      @map("student_id")
  courseId      Int      @map("course_id")
  amount        Float
  dueDate       DateTime @map("due_date")
  paidAmount    Float    @default(0) @map("paid_amount")
  status        String   @default("unpaid")  // unpaid, partial, paid
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  student       User     @relation(fields: [studentId], references: [id])
  course        Course   @relation(fields: [courseId], references: [id])
  payments      Payment[]
  
  @@map("student_fees")
}

model Payment {
  id            String      @id @default(uuid())
  feeId         String      @map("fee_id")
  amount        Float
  paymentMethod String      @map("payment_method")  // cash, card, bank_transfer
  reference     String?
  paymentDate   DateTime    @map("payment_date")
  receiptUrl    String?     @map("receipt_url")
  createdAt     DateTime    @default(now()) @map("created_at")
  
  fee           StudentFee  @relation(fields: [feeId], references: [id])
  
  @@map("payments")
}

model Expense {
  id            String   @id @default(uuid())
  category      String
  amount        Float
  description   String
  date          DateTime
  receiptUrl    String?  @map("receipt_url")
  approvedBy    Int?     @map("approved_by")
  status        String   @default("pending")  // pending, approved, rejected
  createdAt     DateTime @default(now()) @map("created_at")
  
  @@map("expenses")
}
```

### 2. Run Migration

```bash
npx prisma generate
npx prisma db push
```

### 3. Update Course Model

Add to existing Course model:
```prisma
model Course {
  // ... existing fields ...
  
  subjectId       String?         @map("subject_id")
  subject         Subject?        @relation(fields: [subjectId], references: [id])
  timetableEntries TimetableEntry[]
  studentFees     StudentFee[]
}
```

## Quick Wins (Implement Today)

### Task 1: Add Personal Email Field to Forms

Update `src/pages/admin/AdminDashboard.tsx` - Student invite form:
- Add "Personal Email" field
- This email is used for newsletters
- Student email (generated) is for login

### Task 2: Show Tutor Subjects in Content Manager

Update `src/pages/admin/ContentManagement.tsx`:
- Display subjects column in tutors table
- Add subject assignment dialog
- Filter tutors by subject

### Task 3: Basic Timetable View

Create `src/pages/shared/Timetable.tsx`:
- Weekly grid view
- Show classes for user
- Color-coded by subject
- Click to see details

### Task 4: Finance Dashboard Skeleton

Create `src/pages/finance/FinanceDashboard.tsx`:
- Basic layout
- Navigation tabs
- Placeholder for features

## Medium Priority (This Week)

### Task 5: Timetable CRUD

- Admin can create/edit/delete entries
- Tutors can view and request changes
- Students can view only

### Task 6: Payslip Generation

- Create payslip template
- Generate PDF
- Send via email
- Store in database

### Task 7: Student Fee Management

- Define fee structure
- Track payments
- Generate invoices
- Send reminders

## Lower Priority (Next Week)

### Task 8: Live Session Redesign

- Modern UI components
- Better video grid
- Enhanced chat
- Mobile optimization

### Task 9: Student Portal Redesign

- New dashboard layout
- Better course cards
- Progress visualization
- Quick actions

### Task 10: Advanced Finance Features

- Financial reports
- Expense tracking
- Budget management
- Analytics

## API Endpoints Needed

### Timetable:
```
GET    /api/timetable              // Get user's timetable
POST   /api/timetable              // Create entry (admin)
PUT    /api/timetable/:id          // Update entry (admin)
DELETE /api/timetable/:id          // Delete entry (admin)
POST   /api/timetable/upload       // Upload document (admin)
```

### Finance:
```
GET    /api/finance/payslips       // Get payslips
POST   /api/finance/payslips       // Generate payslip
GET    /api/finance/fees           // Get student fees
POST   /api/finance/fees           // Create fee
POST   /api/finance/payments       // Record payment
GET    /api/finance/expenses       // Get expenses
POST   /api/finance/expenses       // Create expense
GET    /api/finance/reports        // Get financial reports
```

### Subjects:
```
GET    /api/subjects               // Get all subjects
POST   /api/subjects               // Create subject (admin)
PUT    /api/subjects/:id           // Update subject (admin)
DELETE /api/subjects/:id           // Delete subject (admin)
POST   /api/tutors/:id/subjects    // Assign subject to tutor
```

## File Structure

```
src/
├── pages/
│   ├── finance/
│   │   ├── FinanceDashboard.tsx
│   │   ├── Payslips.tsx
│   │   ├── StudentFees.tsx
│   │   ├── Expenses.tsx
│   │   └── Reports.tsx
│   ├── shared/
│   │   ├── Timetable.tsx
│   │   └── TimetableUpload.tsx
│   └── admin/
│       └── SubjectManagement.tsx
├── components/
│   ├── finance/
│   │   ├── PayslipTemplate.tsx
│   │   ├── InvoiceTemplate.tsx
│   │   └── ReceiptTemplate.tsx
│   └── timetable/
│       ├── WeeklyGrid.tsx
│       └── TimetableEntry.tsx
└── lib/
    ├── pdf-generator.ts
    └── excel-parser.ts
```

## Testing Checklist

- [ ] Personal email saves correctly
- [ ] Tutor subjects display in content manager
- [ ] Timetable shows correct entries
- [ ] Payslip generates PDF
- [ ] Student fees calculate correctly
- [ ] Payments record properly
- [ ] All buttons work
- [ ] Mobile responsive
- [ ] Email notifications sent
- [ ] Database updates persist

## Deployment Steps

1. Backup database
2. Run migrations
3. Test in staging
4. Deploy to production
5. Monitor for errors
6. Notify users of new features

---

**Start with database schema updates first!**
**Then implement features one by one.**
**Test thoroughly before moving to next feature.**
