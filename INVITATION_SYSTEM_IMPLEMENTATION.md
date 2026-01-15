# Student & Tutor Invitation System with Email Credentials

## Overview
Implemented a complete invitation system where admins can invite students and tutors via email with temporary passwords. Users receive their credentials via email and can change their password later in their dashboard.

## Changes Made

### 1. Backend API Updates (`src/server/index.ts`)

#### A. Updated Tutor Invitation Endpoint
- **Endpoint**: `POST /api/admin/tutors/invite`
- **Changes**:
  - Now generates temporary passwords for new tutors
  - Creates user account with credentials in database
  - Sends email with login credentials (email + temporary password)
  - Uses `renderStudentCredentialsEmail` template for consistent branding

#### B. Student Invitation Endpoint (Already Existed)
- **Endpoint**: `POST /api/admin/students/invite`
- **Features**:
  - Generates unique student numbers (format: YEAR + 4-digit random)
  - Creates official student email: `{studentNumber}@excellenceakademie.co.za`
  - Generates temporary password
  - Sends credentials to student's personal email
  - Enrolls student in specified course if provided

#### C. New Password Change Endpoint
- **Endpoint**: `POST /api/auth/change-password`
- **Authentication**: Requires JWT token (authenticated users only)
- **Features**:
  - Validates current password
  - Updates to new password (minimum 8 characters)
  - Hashes password using scrypt algorithm
  - Returns success/error response

### 2. Email Templates (`src/lib/email.ts`)

#### Existing Template: `renderStudentCredentialsEmail`
Used for both students and tutors to send login credentials:
- **Parameters**:
  - `recipientName`: User's name
  - `studentNumber`: Student ID (or "N/A" for tutors)
  - `studentEmail`: Login email
  - `tempPassword`: Temporary password
  - `loginUrl`: Link to login page
  - `courseName`: Optional course/department name

- **Features**:
  - Professional branded design
  - Clear credential display
  - Security reminder to change password
  - Direct login button

### 3. Password Change Component (`src/components/ChangePassword.tsx`)

New reusable component for password management:
- **Features**:
  - Current password verification
  - New password input with confirmation
  - Minimum 8 character validation
  - Password match validation
  - Success/error feedback
  - Loading states

- **UI Elements**:
  - Lock icon for security indication
  - Green success alert with checkmark
  - Red error alerts
  - Disabled state during submission

### 4. Dashboard Updates

#### A. Tutor Dashboard (`src/pages/tutor/TutorDashboard.tsx`)
- Added `ChangePassword` component to Settings tab
- Replaced placeholder "Settings panel coming soon" with functional password change
- Maintains existing profile information display

#### B. Student Portal (`src/pages/student/StudentPortal.tsx`)
- **New Settings Tab**:
  - Added to sidebar navigation
  - Added to mobile menu
  - Added to header title display
  - Profile information card (read-only)
  - Password change functionality

- **Layout**: Two-column grid
  - Left: Profile Information (name, email, student ID)
  - Right: Change Password component

### 5. Email Configuration (`.env`)

Required environment variables (already configured):
```
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=notifications@excellenceakademie.co.za
BREVO_FROM_NAME=Excellence Academia
FRONTEND_URL=https://www.excellenceakademie.co.za
```

## User Flows

### Admin Invites Student
1. Admin enters student's personal email in invitation form
2. System generates:
   - Unique student number (e.g., 20267834)
   - Official email: `20267834@excellenceakademie.co.za`
   - Temporary password (e.g., `a3f7b2c145`)
3. Email sent to personal email with:
   - Student number
   - Official email for login
   - Temporary password
   - Login link
4. Student logs in with official email + temp password
5. Student changes password in Settings tab

### Admin Invites Tutor
1. Admin enters tutor's email in invitation form
2. System generates:
   - User account with tutor role
   - Temporary password
3. Email sent with:
   - Login email (their provided email)
   - Temporary password
   - Login link
4. Tutor logs in with email + temp password
5. Tutor changes password in Settings tab

### User Changes Password
1. Navigate to Settings tab in dashboard
2. Enter current password
3. Enter new password (min 8 chars)
4. Confirm new password
5. Submit form
6. System validates and updates password
7. Success message displayed

## Security Features

1. **Password Hashing**: Uses scrypt algorithm with salt
2. **JWT Authentication**: Required for password change
3. **Password Validation**: Minimum 8 characters
4. **Current Password Verification**: Must provide current password to change
5. **Temporary Passwords**: Random generated, encourages immediate change
6. **Email Verification**: Credentials sent to verified email addresses

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/students/invite` | POST | Admin/Tutor | Invite students with credentials |
| `/api/admin/tutors/invite` | POST | Admin | Invite tutors with credentials |
| `/api/auth/change-password` | POST | JWT | Change user password |
| `/api/auth/set-password` | POST | Token | Set password from invitation |
| `/api/auth/login` | POST | None | Login with email/password |

## Testing Checklist

- [ ] Admin can invite students via email
- [ ] Student receives email with credentials
- [ ] Student can login with temporary password
- [ ] Student can change password in Settings
- [ ] Admin can invite tutors via email
- [ ] Tutor receives email with credentials
- [ ] Tutor can login with temporary password
- [ ] Tutor can change password in Settings
- [ ] Password validation works (min 8 chars)
- [ ] Current password verification works
- [ ] Email delivery is successful
- [ ] Unique student numbers are generated
- [ ] Error handling works properly

## Future Enhancements

1. **Password Reset**: Add "Forgot Password" functionality
2. **Email Verification**: Require email verification before first login
3. **Password Strength Meter**: Visual indicator of password strength
4. **Password History**: Prevent reusing recent passwords
5. **Two-Factor Authentication**: Add 2FA option
6. **Bulk Import**: CSV upload for bulk student/tutor invitations
7. **Custom Email Templates**: Allow admins to customize invitation emails
8. **Invitation Expiry**: Set expiration time for invitation links
