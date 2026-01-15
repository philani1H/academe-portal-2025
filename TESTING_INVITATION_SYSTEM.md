# Testing the Invitation System

## Prerequisites
- Admin account access
- Valid email addresses for testing
- Access to email inbox (to receive credentials)

## Test 1: Invite a Student

### Steps:
1. Login as admin at `/admin/login`
2. Navigate to Users or Students section
3. Click "Invite Students" button
4. Enter test email address (e.g., `teststudent@example.com`)
5. Optionally select a course
6. Click "Send Invitation"

### Expected Results:
- Success message displayed
- Email sent to `teststudent@example.com` with:
  - Student Number (e.g., 20267834)
  - Official Email (e.g., 20267834@excellenceakademie.co.za)
  - Temporary Password (e.g., a3f7b2c145)
  - Login link

### Verify:
```
✓ Email received
✓ Student number is unique
✓ Official email format is correct
✓ Temporary password is included
✓ Login link works
```

## Test 2: Student Login with Credentials

### Steps:
1. Open the login link from email
2. Enter official email from email (e.g., 20267834@excellenceakademie.co.za)
3. Enter temporary password from email
4. Click "Login"

### Expected Results:
- Successfully logged in
- Redirected to student dashboard
- Can see enrolled courses (if any)

### Verify:
```
✓ Login successful
✓ Dashboard loads
✓ User information correct
✓ Settings tab visible
```

## Test 3: Student Changes Password

### Steps:
1. In student dashboard, click "Settings" in sidebar
2. Scroll to "Change Password" card
3. Enter current password (temporary password)
4. Enter new password (min 8 characters)
5. Confirm new password
6. Click "Change Password"

### Expected Results:
- Success message: "Password changed successfully!"
- Form fields cleared
- Green success alert displayed

### Verify:
```
✓ Password change successful
✓ Success message shown
✓ Can logout and login with new password
✓ Old password no longer works
```

## Test 4: Invite a Tutor

### Steps:
1. Login as admin
2. Navigate to Tutors section
3. Click "Invite Tutors" button
4. Enter test email address (e.g., `testtutor@example.com`)
5. Optionally enter department
6. Click "Send Invitation"

### Expected Results:
- Success message displayed
- Email sent to `testtutor@example.com` with:
  - Login Email (testtutor@example.com)
  - Temporary Password
  - Login link to tutor portal

### Verify:
```
✓ Email received
✓ Temporary password included
✓ Login link works
```

## Test 5: Tutor Login and Password Change

### Steps:
1. Open login link from email
2. Login with email + temporary password
3. Navigate to Settings tab
4. Change password using same process as student

### Expected Results:
- Login successful
- Can access tutor dashboard
- Can change password
- New password works for subsequent logins

### Verify:
```
✓ Tutor login successful
✓ Dashboard loads correctly
✓ Password change works
✓ New password persists
```

## Test 6: Password Validation

### Test Cases:

#### A. Password Too Short
- Enter password with less than 8 characters
- Expected: Error message "New password must be at least 8 characters"

#### B. Passwords Don't Match
- Enter different passwords in "New Password" and "Confirm"
- Expected: Error message "New passwords do not match"

#### C. Wrong Current Password
- Enter incorrect current password
- Expected: Error message "Current password is incorrect"

#### D. Valid Password Change
- Enter correct current password
- Enter valid new password (8+ chars)
- Confirm matches
- Expected: Success message

### Verify:
```
✓ Short password rejected
✓ Mismatched passwords rejected
✓ Wrong current password rejected
✓ Valid password accepted
```

## Test 7: Email Delivery

### Check Email Content:
1. Open invitation email
2. Verify branding (Excellence Academia logo/colors)
3. Check all information is present
4. Click login button
5. Verify link works

### Verify:
```
✓ Email has professional design
✓ All credentials visible
✓ Login button works
✓ Alternative link provided
✓ Security reminder included
```

## Test 8: Duplicate Invitations

### Steps:
1. Invite a student with email `duplicate@example.com`
2. Try to invite same email again
3. Check system behavior

### Expected Results:
- System should handle gracefully
- Either skip duplicate or show appropriate message
- No duplicate accounts created

### Verify:
```
✓ Duplicate handled properly
✓ No errors thrown
✓ Clear feedback to admin
```

## Test 9: Bulk Invitations

### Steps:
1. Invite multiple students at once
2. Enter multiple email addresses
3. Send invitations

### Expected Results:
- All emails processed
- Success/failure status for each
- Emails sent to all valid addresses

### Verify:
```
✓ All valid emails receive invitations
✓ Invalid emails skipped or reported
✓ Status shown for each invitation
```

## Test 10: Settings Tab Navigation

### Student Portal:
- Check Settings appears in sidebar
- Check Settings appears in mobile menu
- Check Settings tab loads correctly
- Check profile info displayed
- Check password change component visible

### Tutor Dashboard:
- Check Settings tab exists
- Check password change component visible
- Check profile info displayed

### Verify:
```
✓ Settings tab accessible
✓ Mobile menu includes Settings
✓ Profile information correct
✓ Password change form functional
```

## Common Issues & Solutions

### Issue: Email not received
- Check spam/junk folder
- Verify BREVO_API_KEY is correct
- Check email address is valid
- Review server logs for errors

### Issue: Login fails with credentials
- Verify using correct email (official email for students)
- Check password copied correctly (no extra spaces)
- Ensure account was created successfully
- Check database for user record

### Issue: Password change fails
- Verify current password is correct
- Check new password meets requirements (8+ chars)
- Ensure passwords match
- Check user is authenticated (JWT token valid)

### Issue: Settings tab not visible
- Clear browser cache
- Check user role is correct
- Verify component imports
- Check for JavaScript errors in console

## Success Criteria

All tests should pass with:
- ✅ Emails delivered successfully
- ✅ Credentials work for login
- ✅ Password changes persist
- ✅ UI is responsive and clear
- ✅ Error messages are helpful
- ✅ Security validations work
- ✅ No console errors
- ✅ Database records created correctly

## Performance Checks

- Email delivery time: < 30 seconds
- Login response time: < 2 seconds
- Password change time: < 3 seconds
- Dashboard load time: < 5 seconds

## Security Checks

- ✅ Passwords are hashed (not stored in plain text)
- ✅ JWT tokens required for password change
- ✅ Current password verified before change
- ✅ Temporary passwords are random
- ✅ Email sent to correct recipient
- ✅ No sensitive data in URLs
- ✅ HTTPS used for all requests
