# Live Session Testing Guide

## Quick Start Testing

### 1. Test Session Link Sharing

#### As a Tutor:
1. Start a live session from course management
2. Look for the share icon (📤) in the header
3. Click it and select "Copy Link"
4. Paste the link in a new browser tab/window
5. Verify the link includes all parameters:
   - `sessionId`
   - `courseId`
   - `courseName`
   - `category`
   - `fromStudent=true`

#### Test Email Sharing:
1. Click share icon → "Share via Email"
2. Enter test emails: `test1@example.com, test2@example.com`
3. Add a message: "Join my live session!"
4. Click "Send Invites"
5. Check server logs for email sending

### 2. Test Recording Functionality

#### Camera Recording:
1. Start a live session
2. Turn on your camera
3. Click the record button (red dot)
4. Verify "Recording session..." toast appears
5. Verify "REC" badge appears in header
6. Wait 10 seconds
7. Click record button again to stop
8. Verify "Stopping recording..." toast
9. Check if recording uploads to course materials
10. If upload fails, verify local download

#### Screen Recording:
1. Start a live session
2. Click "Share Screen" button
3. Select a screen/window to share
4. Click the record button
5. Verify "Recording screen..." toast
6. Verify "REC" badge appears
7. Wait 10 seconds
8. Click record button to stop
9. Verify recording saves

### 3. Test Mobile Responsiveness

#### Using Browser DevTools:
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Navigate to live session

#### Check These Elements:
- [ ] Header is compact and readable
- [ ] Badges are appropriately sized
- [ ] Time shows MM:SS format
- [ ] Video grid shows 2 columns
- [ ] Controls are large enough to tap
- [ ] Sidebar opens full-screen
- [ ] Share dialog fits on screen
- [ ] All buttons are accessible

#### Test Different Devices:
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] iPad (768px)
- [ ] Desktop (1920px)

### 4. Test Session Flow

#### Tutor Flow:
1. ✅ Start session from course management
2. ✅ See "Ready to Start?" dialog
3. ✅ Click "Go Live"
4. ✅ See live indicator in header
5. ✅ Share session link
6. ✅ Start recording
7. ✅ Share screen
8. ✅ Use whiteboard
9. ✅ Manage students (mute/unmute)
10. ✅ End session

#### Student Flow:
1. ✅ Receive session link/notification
2. ✅ Click to join
3. ✅ Allow camera/mic permissions
4. ✅ See "Waiting for tutor..." if tutor not live
5. ✅ See tutor video when live
6. ✅ Use chat
7. ✅ Raise hand
8. ✅ Toggle camera/mic
9. ✅ Leave session

### 5. Test Cross-Browser Compatibility

#### Chrome/Edge (Chromium):
- [ ] All features work
- [ ] Recording works
- [ ] Screen share works
- [ ] Audio mixing works

#### Firefox:
- [ ] All features work
- [ ] Recording works (may use different codec)
- [ ] Screen share works
- [ ] Audio mixing works

#### Safari (macOS):
- [ ] All features work
- [ ] Recording works (may use H264)
- [ ] Screen share works
- [ ] Check audio permissions

#### Mobile Safari (iOS):
- [ ] Layout is responsive
- [ ] Camera/mic work
- [ ] Recording may not be supported
- [ ] Screen share not available

### 6. Test Error Scenarios

#### Permission Denied:
1. Block camera/mic in browser settings
2. Try to join session
3. Verify error message appears
4. Verify user can still join without media

#### Network Issues:
1. Throttle network in DevTools
2. Test video quality degradation
3. Test reconnection

#### Recording Errors:
1. Start recording
2. Revoke screen share permission mid-recording
3. Verify graceful error handling
4. Verify recording stops properly

### 7. Performance Testing

#### Check These Metrics:
- [ ] Page load time < 3 seconds
- [ ] Video latency < 500ms
- [ ] CPU usage reasonable
- [ ] Memory doesn't leak
- [ ] No console errors

#### Stress Test:
1. Join with 10+ students
2. All students turn on camera
3. Start recording
4. Share screen
5. Use whiteboard
6. Monitor performance

### 8. Accessibility Testing

#### Keyboard Navigation:
- [ ] Tab through all controls
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs
- [ ] Focus indicators visible

#### Screen Reader:
- [ ] Button labels are descriptive
- [ ] Status changes announced
- [ ] Error messages readable

### 9. Visual Testing

#### Check These Elements:
- [ ] No layout shifts
- [ ] Smooth animations
- [ ] Proper z-index layering
- [ ] No overlapping elements
- [ ] Consistent spacing
- [ ] Proper color contrast

#### Dark Mode:
- [ ] All text is readable
- [ ] Buttons are visible
- [ ] Hover states work
- [ ] Focus states visible

### 10. Integration Testing

#### With Backend:
- [ ] Session creation works
- [ ] Student notifications sent
- [ ] Recording upload works
- [ ] Email sharing works
- [ ] Chat messages sync
- [ ] Participant list updates

#### With Database:
- [ ] Session data saved
- [ ] Recording metadata stored
- [ ] Chat history persisted
- [ ] Attendance tracked

## Common Issues & Solutions

### Issue: "No camera/microphone stream to record"
**Solution**: Ensure camera/mic are enabled before recording

### Issue: Recording file is empty
**Solution**: Wait at least 2 seconds before stopping recording

### Issue: Share link doesn't work
**Solution**: Check that all URL parameters are included

### Issue: Mobile sidebar won't close
**Solution**: Click outside sidebar or use toggle button in header

### Issue: Video not showing
**Solution**: Check browser permissions and reload page

### Issue: Audio echo
**Solution**: Use headphones or mute when not speaking

## Testing Checklist Summary

### Essential Tests:
- [x] Session link copying
- [x] Email sharing
- [x] Camera recording
- [x] Screen recording
- [x] Mobile layout
- [x] Desktop layout
- [x] Tutor controls
- [x] Student view
- [x] Error handling
- [x] Cross-browser

### Optional Tests:
- [ ] Load testing (10+ users)
- [ ] Long session (1+ hour)
- [ ] Network throttling
- [ ] Accessibility audit
- [ ] Performance profiling

## Success Criteria

✅ All features work on desktop
✅ All features work on mobile
✅ Recording saves successfully
✅ Session links are shareable
✅ No console errors
✅ Good performance
✅ Accessible to all users
✅ Works in all major browsers

## Next Steps

After testing:
1. Document any bugs found
2. Create tickets for issues
3. Test fixes
4. Deploy to staging
5. Final production testing
6. Deploy to production
7. Monitor for issues

## Support

If you encounter issues during testing:
1. Check browser console for errors
2. Review network tab for failed requests
3. Check server logs
4. Verify permissions are granted
5. Try in incognito/private mode
6. Test in different browser

Happy Testing! 🎉
