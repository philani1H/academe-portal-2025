# Enhanced Whiteboard Documentation

## Overview

The Academe Portal Enhanced Whiteboard is a powerful, feature-rich interactive whiteboard built for live tutoring sessions. It provides a comprehensive set of drawing tools, shapes, text annotations, and collaboration features to enhance the online learning experience.

## Features

### 🎨 Drawing Tools

#### 1. **Select/Pan Tool**
- **Icon**: Mouse pointer
- **Function**: Navigate around the canvas by clicking and dragging
- **Use Case**: Useful when zoomed in to move around the whiteboard
- **Keyboard Shortcut**: Press `V` (coming soon)

#### 2. **Pen Tool**
- **Icon**: Pencil
- **Function**: Draw freehand lines and sketches
- **Customizable**: Color, line width (1-10px)
- **Use Case**: General drawing, annotations, handwriting
- **Touch Support**: ✅ Full touch/stylus support on tablets

#### 3. **Highlighter Tool**
- **Icon**: Highlighter marker
- **Function**: Draw semi-transparent highlight strokes
- **Customizable**: Color, width (automatically 3x thicker than selected width)
- **Opacity**: 30% transparency for highlighting text/images
- **Use Case**: Emphasizing important points on uploaded materials

#### 4. **Eraser Tool**
- **Icon**: Eraser
- **Function**: Remove drawn content
- **Width**: Fixed at 20px for easy erasing
- **Use Case**: Correcting mistakes or clearing specific areas

### 📐 Shape Tools

#### 5. **Rectangle Tool**
- **Function**: Draw rectangular shapes
- **How to Use**: Click and drag from one corner to the opposite corner
- **Customizable**: Border color and line width
- **Preview**: Real-time preview while drawing
- **Use Case**: Creating diagrams, highlighting areas, drawing boxes

#### 6. **Circle Tool**
- **Function**: Draw circular shapes
- **How to Use**: Click at center point and drag outward to set radius
- **Customizable**: Border color and line width
- **Preview**: Real-time preview while drawing
- **Use Case**: Venn diagrams, highlighting points, creating diagrams

#### 7. **Line Tool**
- **Function**: Draw straight lines
- **How to Use**: Click start point and drag to end point
- **Customizable**: Color and line width
- **Use Case**: Connecting points, creating graphs, underlining

#### 8. **Arrow Tool**
- **Function**: Draw directional arrows
- **How to Use**: Click start point and drag to end point
- **Arrow Head**: Automatically rendered at endpoint
- **Use Case**: Pointing to specific elements, showing flow/direction

#### 9. **Text Tool**
- **Function**: Add text annotations
- **How to Use**: Click where you want text, enter text in dialog
- **Customizable**:
  - Font size (12px, 16px, 24px, 32px, 48px)
  - Color
- **Preview**: See text preview before inserting
- **Use Case**: Labels, explanations, annotations, questions

### 🎨 Color & Styling

#### Color Palette
- **Quick Colors**: 15 preset colors for instant access
  - Black, White, Red, Green, Blue
  - Yellow, Magenta, Cyan, Orange, Purple
  - Pink, Brown, Gray, Spring Green, Indigo
- **Custom Color Picker**: Full color wheel for any color
- **Per-Tool Color**: Each tool remembers its last used color

#### Line Width Options
- **1px**: Ultra thin - fine detail work
- **2px**: Thin - general writing/sketching
- **3px**: Normal - balanced for most uses
- **5px**: Medium - bold lines, emphasis
- **8px**: Thick - headers, bold annotations
- **10px**: Extra thick - dramatic emphasis

### 📁 Import Features

#### 10. **Math Equation Tool**
- **Icon**: Calculator
- **Function**: Insert mathematical equations using LaTeX
- **Preview**: Live preview of rendered equation
- **Examples**:
  - `E = mc^2` → E = mc²
  - `\int_0^\infty x^2 dx` → ∫₀^∞ x² dx
  - `\frac{a}{b}` → a/b
  - `\sqrt{x}` → √x
- **Render Quality**: High-quality rendering via KaTeX
- **Use Case**: Math tutoring, physics, equations

#### 11. **PDF Upload**
- **Icon**: File text
- **Function**: Upload PDF and render first page on whiteboard
- **Format**: Converts to image automatically
- **Scaling**: Auto-scales to fit 80% of canvas
- **Centering**: Automatically centered on canvas
- **Use Case**: Annotating worksheets, exam papers, textbooks

#### 12. **Image Upload**
- **Icon**: Image
- **Function**: Upload images (PNG, JPG, GIF, etc.)
- **Supported Formats**: All standard image formats
- **Placement**: Centered on canvas
- **Use Case**: Diagrams, photos, visual aids, screenshots

### 🔍 View Controls

#### 13. **Zoom In/Out**
- **Icons**: Zoom in/out magnifying glasses
- **Function**: Zoom canvas from 50% to 300%
- **Increment**: 25% per click
- **Display**: Current zoom percentage shown
- **Reset**: Click "Reset Zoom" button when zoomed
- **Use Case**: Detailed work, viewing large imports

#### 14. **Pan/Navigate**
- **Tool**: Select tool (mouse pointer)
- **Function**: Click and drag to move around canvas
- **Available**: When zoomed in
- **Use Case**: Navigate large whiteboards or zoomed areas

### 📄 Multi-Page Support

#### Page Navigation
- **Multiple Pages**: Support for unlimited pages
- **Add Page**: Click `+` button to add new blank page
- **Navigate**: Use `<` and `>` arrows to move between pages
- **Page Indicator**: "Page X / Y" shows current position
- **Auto-Save**: Each page automatically saves state
- **Use Case**: Extended lessons, step-by-step explanations

### 💾 Export Options

#### 15. **Export PNG**
- **Function**: Save whiteboard as PNG image
- **Quality**: High-resolution export
- **Filename**: `whiteboard-[timestamp].png`
- **Use Case**: Sharing notes, archiving work

#### 16. **Export PDF**
- **Function**: Save whiteboard as PDF document
- **Orientation**: Auto-detects (landscape/portrait)
- **Quality**: Vector quality where possible
- **Filename**: `whiteboard-[timestamp].pdf`
- **Use Case**: Distributing materials, printing

### 🗑️ Clear Board
- **Icon**: Trash can (red)
- **Function**: Clear entire current page
- **Confirmation**: Single click (use carefully!)
- **Scope**: Only clears current page, not all pages
- **Synced**: Broadcasts clear action to all participants

## Real-Time Collaboration

### Socket.IO Synchronization
All drawing actions are synchronized in real-time across all connected participants:

- ✅ Freehand drawing (pen, highlighter, eraser)
- ✅ Shapes (rectangle, circle, line, arrow)
- ✅ Text additions
- ✅ Image/PDF uploads
- ✅ Math equations
- ✅ Clear board actions

### User Roles
- **Tutor**: Full access to all features
- **Student**: Can view all content and draw/annotate (permission-based)

## Mobile & Touch Support

### Touch Gestures
- ✅ **Single Touch**: Draw with finger/stylus
- ✅ **Touch Drawing**: All tools support touch input
- ✅ **Touch Shapes**: Draw shapes with touch gestures
- ✅ **Responsive UI**: Toolbar adapts to screen size

### Mobile Optimizations
- **Compact Toolbar**: Wraps on smaller screens
- **Touch-Friendly**: Larger touch targets on mobile
- **Performance**: Optimized canvas rendering
- **Auto-Hide**: Keyboard hides after text input

### Tested Devices
- ✅ iPhone (Safari)
- ✅ iPad (Safari, iPadOS)
- ✅ Android Phones (Chrome)
- ✅ Android Tablets (Chrome)
- ✅ Desktop (Chrome, Firefox, Safari, Edge)

## User Interface

### Toolbar Layout
```
[Drawing Tools] | [Shapes] | [Color/Width] | [Import] | [Zoom] | [Actions] | [Close]
```

### Color Palette Bar
Quick-access color swatches below main toolbar for instant color switching.

### Canvas Area
- Full-screen drawing surface
- White background
- Smooth rendering
- High DPI support

### Status Indicators
- **Zoom Level**: Shows current zoom percentage
- **Page Number**: Shows current page / total pages
- **Tool Selection**: Active tool highlighted in toolbar

## Keyboard Shortcuts (Coming Soon)

- `V` - Select/Pan tool
- `P` - Pen tool
- `E` - Eraser tool
- `T` - Text tool
- `R` - Rectangle tool
- `C` - Circle tool
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+0` - Reset zoom
- `+` - Zoom in
- `-` - Zoom out
- `Delete` - Clear board

## Technical Details

### Technologies Used
- **React**: Component framework
- **TypeScript**: Type-safe development
- **HTML5 Canvas**: Drawing surface
- **Socket.IO**: Real-time sync
- **KaTeX**: Math equation rendering
- **jsPDF**: PDF export
- **html2canvas**: Canvas screenshot
- **PDF.js**: PDF rendering

### Performance
- **Optimized Rendering**: Efficient canvas operations
- **State Management**: Pages cached in memory
- **Lazy Loading**: Images loaded on-demand
- **Debounced Updates**: Socket emissions optimized

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Browsers (iOS Safari, Chrome Android)

## Usage Tips

### For Tutors

1. **Prepare Materials**: Upload PDFs/images before the session starts
2. **Use Pages**: Create separate pages for different topics
3. **Color Code**: Use different colors for different concepts
4. **Highlight**: Use highlighter to emphasize key points
5. **Save Work**: Export as PDF at end of session for students
6. **Shapes for Diagrams**: Use shape tools for clean diagrams
7. **Text for Labels**: Use text tool instead of handwriting for clarity

### For Students

1. **Take Notes**: Use pen tool to annotate tutor's explanations
2. **Ask Questions**: Use text tool to write questions
3. **Color Code**: Use different colors to organize your notes
4. **Save Progress**: Take screenshots or export regularly
5. **Zoom In**: Zoom for detailed work or small text

### Best Practices

1. **Test Equipment**: Test whiteboard before live sessions
2. **Use Layers**: Create new pages instead of erasing
3. **Export Regularly**: Save your work frequently
4. **Clear When Done**: Start fresh for new topics
5. **Choose Right Tool**: Rectangle is faster than drawing boxes
6. **Stable Connection**: Ensure good internet for real-time sync

## Troubleshooting

### Issue: Drawing is laggy
- **Solution**: Close other applications, reduce browser tabs
- **Check**: Internet connection speed
- **Try**: Lower resolution display or reset zoom

### Issue: Touch not working
- **Solution**: Ensure browser allows touch events
- **Check**: Device compatibility
- **Try**: Refresh page and allow permissions

### Issue: Can't see others' drawings
- **Solution**: Check socket connection status
- **Reload**: Refresh the page
- **Check**: Network firewall settings

### Issue: Export not working
- **Solution**: Check browser popup blocker
- **Try**: Different browser
- **Check**: Browser download permissions

### Issue: PDF upload fails
- **Solution**: Ensure PDF is under 10MB
- **Try**: Compress PDF first
- **Check**: PDF is not password-protected

### Issue: Math equations not rendering
- **Solution**: Check LaTeX syntax
- **Try**: Use preview before inserting
- **Examples**: Use example formulas provided

## Future Enhancements

### Planned Features
- [ ] Full undo/redo with action history
- [ ] Sticky notes
- [ ] Ruler and protractor tools
- [ ] Grid and snap-to-grid
- [ ] Layer management
- [ ] Copy/paste elements
- [ ] Templates library
- [ ] Recording whiteboard session
- [ ] AI-assisted shape recognition
- [ ] Collaborative cursor indicators
- [ ] Voice-to-text annotations
- [ ] Integration with Google Drive

## API Integration

### Socket Events

#### Client → Server
```typescript
// Drawing started
socket.emit('whiteboard-draw', {
  sessionId: string,
  type: 'start',
  x: number,
  y: number,
  color: string,
  tool: DrawTool,
  lineWidth: number
})

// Drawing in progress
socket.emit('whiteboard-draw', {
  sessionId: string,
  type: 'draw',
  x: number,
  y: number,
  color: string,
  tool: DrawTool,
  lineWidth: number
})

// Shape drawn
socket.emit('whiteboard-draw', {
  sessionId: string,
  type: 'shape',
  tool: 'rectangle' | 'circle' | 'line' | 'arrow',
  ...shapeData
})

// Clear board
socket.emit('whiteboard-draw', {
  sessionId: string,
  type: 'clear'
})
```

#### Server → Client
All events are broadcast to other participants in the same session.

## Security Considerations

- ✅ Socket.IO rooms isolate sessions
- ✅ Session ID validation
- ✅ File upload size limits
- ✅ XSS protection in text rendering
- ✅ Rate limiting on socket events (recommended)

## Accessibility

### Current Support
- ✅ Keyboard navigation
- ✅ Color contrast (WCAG AA)
- ✅ Focus indicators
- ✅ Button labels (titles/tooltips)

### Future Improvements
- [ ] Screen reader announcements
- [ ] ARIA labels
- [ ] High contrast mode
- [ ] Text-to-speech integration

## Contributing

When improving the whiteboard:

1. Test on multiple devices (desktop, tablet, mobile)
2. Verify socket synchronization
3. Check touch support
4. Test all tools and features
5. Ensure mobile responsiveness
6. Validate accessibility
7. Update documentation

## Support

For issues or feature requests:
- Check troubleshooting section
- Review browser console for errors
- Test in incognito/private mode
- Try different browser
- Contact support team

---

**Version**: 2.0
**Last Updated**: 2026-01-18
**Maintained By**: Academe Portal Development Team

**Status**: ✅ Production Ready

---

## Quick Reference Card

| Tool | Icon | Shortcut | Description |
|------|------|----------|-------------|
| Select | 🖱️ | V | Pan and navigate canvas |
| Pen | ✏️ | P | Freehand drawing |
| Highlighter | 🖍️ | H | Transparent highlighting |
| Eraser | 🧹 | E | Erase content |
| Rectangle | ▭ | R | Draw rectangles |
| Circle | ○ | C | Draw circles |
| Line | ─ | L | Draw straight lines |
| Arrow | → | A | Draw arrows |
| Text | T | T | Add text |
| Math | ∑ | M | Insert equations |
| Image | 🖼️ | - | Upload images |
| PDF | 📄 | - | Upload PDFs |
| Zoom In | 🔍+ | + | Increase zoom |
| Zoom Out | 🔍- | - | Decrease zoom |
| Clear | 🗑️ | Del | Clear page |
| Export | 💾 | - | Save work |

---

**Happy Whiteboarding! 🎨✨**
