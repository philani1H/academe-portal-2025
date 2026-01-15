# Complete Bulk Upload System Guide

## Overview

The Content Management system now supports bulk uploads for:
- ✅ **Pricing Plans**
- ✅ **Tutors**
- ✅ **Team Members**

All bulk upload features support both CSV and JSON formats.

---

## 🎯 Pricing Plans Bulk Upload

### Access
Admin Dashboard → Content Management → Pricing Tab → "Bulk Upload" button

### Required Fields
- `name` - Plan name (used for matching existing plans)
- `price` - Price display (e.g., "R299")

### Optional Fields
- `period` - Billing period (default: "month")
- `features` - Array of included features
- `notIncluded` - Array of features not included
- `color` - Tailwind CSS class (default: "bg-blue-500")
- `icon` - Icon name (default: "Star")
- `popular` - Boolean (default: false)
- `order` - Display order (default: 0)

### CSV Example
```csv
name,price,period,features,notIncluded,color,icon,popular,order
Basic Package,R199,per month,"Daily sessions|Progress tracking|Study Material","Weekend Classes","bg-blue-500",BookOpen,false,1
Standard Package,R299,per month,"Daily sessions|Weekend Classes|Career Counselling","Psychology Services","bg-purple-500",GraduationCap,true,2
```

### JSON Example
```json
[
  {
    "name": "Basic Package",
    "price": "R199",
    "period": "per month",
    "features": ["Daily sessions", "Progress tracking", "Study Material"],
    "notIncluded": ["Weekend Classes"],
    "color": "bg-blue-500",
    "icon": "BookOpen",
    "popular": false,
    "order": 1
  }
]
```

### Templates
- `/templates/pricing-template.csv`
- `/templates/pricing-template.json`

---

## 👨‍🏫 Tutors Bulk Upload

### Access
Admin Dashboard → Content Management → Tutors Tab → "Bulk Upload" button

### Required Fields
- `name` - Tutor name (used for matching)
- `subjects` - Array of subjects taught

### Optional Fields
- `image` - Profile image URL
- `contactName` - Contact person name
- `contactPhone` - Phone number
- `contactEmail` - Email address
- `description` - Tutor bio/description
- `order` - Display order (default: 0)

### CSV Example
```csv
name,subjects,image,contactName,contactPhone,contactEmail,description,order
John Smith,"Mathematics|Physics|Chemistry","https://example.com/john.jpg","John Smith","+27123456789","john@example.com","Experienced STEM tutor",1
Sarah Johnson,"English|History","https://example.com/sarah.jpg","Sarah Johnson","+27987654321","sarah@example.com","Humanities specialist",2
```

### JSON Example
```json
[
  {
    "name": "John Smith",
    "subjects": ["Mathematics", "Physics", "Chemistry"],
    "image": "https://example.com/john.jpg",
    "contactName": "John Smith",
    "contactPhone": "+27123456789",
    "contactEmail": "john@example.com",
    "description": "Experienced STEM tutor",
    "order": 1
  }
]
```

### Templates
- `/templates/tutors-template.csv`
- `/templates/tutors-template.json`

---

## 👥 Team Members Bulk Upload

### Access
Admin Dashboard → Content Management → Team Tab → "Bulk Upload" button

### Required Fields
- `name` - Team member name (used for matching)
- `role` - Job title/role

### Optional Fields
- `bio` - Biography/description
- `image` - Profile image URL
- `order` - Display order (default: 0)

### CSV Example
```csv
name,role,bio,image,order
Jane Smith,CEO & Founder,"Passionate educator with 15 years experience","https://example.com/jane.jpg",1
John Doe,CTO,"Tech enthusiast building learning platforms","https://example.com/john.jpg",2
```

### JSON Example
```json
[
  {
    "name": "Jane Smith",
    "role": "CEO & Founder",
    "bio": "Passionate educator with 15 years experience",
    "image": "https://example.com/jane.jpg",
    "order": 1
  }
]
```

### Templates
- `/templates/team-template.csv`
- `/templates/team-template.json`

---

## 📝 General Guidelines

### CSV Format Rules
1. **Headers**: First row must contain field names
2. **Quotes**: Wrap fields containing commas in double quotes
3. **Arrays**: Use pipe (|) or semicolon (;) to separate items
4. **Booleans**: Use "true" or "false" (lowercase)
5. **Empty fields**: Leave blank or use empty quotes ""

### JSON Format Rules
1. **Structure**: Must be a valid JSON array `[...]`
2. **Arrays**: Use proper JSON array syntax `["item1", "item2"]`
3. **Booleans**: Use `true` or `false` (no quotes)
4. **Strings**: All text must be in quotes
5. **Numbers**: No quotes for numeric values

### Update Behavior
- **Matching**: Items are matched by `name` field
- **Update**: If name exists, the item is updated
- **Create**: If name doesn't exist, a new item is created
- **Case-sensitive**: Name matching is case-sensitive

### Best Practices
1. ✅ Download and use provided templates
2. ✅ Test with 1-2 items first
3. ✅ Keep backups of existing data
4. ✅ Use consistent naming
5. ✅ Validate files before uploading
6. ✅ Check results after upload

---

## 🚀 Quick Start

### For Pricing Plans
1. Go to Content Management → Pricing
2. Click "Bulk Upload"
3. Upload `new-pricing-data.json` (provided)
4. Verify the 3 packages are created

### For Tutors
1. Go to Content Management → Tutors
2. Click "Bulk Upload"
3. Download template or create your own
4. Upload file

### For Team Members
1. Go to Content Management → Team
2. Click "Bulk Upload"
3. Download template or create your own
4. Upload file

---

## 🔧 Troubleshooting

### Common Errors

**"No valid data found"**
- Check file has data rows (not just headers)
- Verify file format is correct

**"Name is required"**
- Every row must have a name
- Check for empty name fields

**"Subjects required" (Tutors)**
- At least one subject must be specified
- Check array format

**"Role required" (Team)**
- Every team member needs a role
- Check for empty role fields

**"Invalid JSON format"**
- Validate JSON syntax
- Check for missing commas, brackets, quotes

**"CSV parsing error"**
- Check for unmatched quotes
- Verify comma placement
- Ensure proper escaping

### Getting Help
1. Check format examples in this guide
2. Download and examine templates
3. Validate your file format
4. Test with minimal data first
5. Check browser console for detailed errors

---

## 📊 API Endpoints

### Pricing Bulk Upload
```
POST /api/admin/content/pricing-bulk-upload
Body: { fileContent: string, fileType: "csv" | "json" }
```

### Tutors Bulk Upload
```
POST /api/admin/content/tutors-bulk-upload
Body: { fileContent: string, fileType: "csv" | "json" }
```

### Team Bulk Upload
```
POST /api/admin/content/team-bulk-upload
Body: { fileContent: string, fileType: "csv" | "json" }
```

### Response Format
```json
{
  "message": "Items updated successfully",
  "updated": 2,
  "created": 1,
  "total": 3
}
```

---

## ✨ Features

- ✅ Dual format support (CSV & JSON)
- ✅ Update existing items or create new ones
- ✅ Validation before processing
- ✅ Detailed error messages
- ✅ Success statistics
- ✅ Downloadable templates
- ✅ Responsive dialogs
- ✅ Loading states
- ✅ Auto-refresh after upload

---

## 📁 Files Created

### API Endpoints
- `src/pages/api/admin/content/pricing-bulk-upload.ts`
- `src/pages/api/admin/content/tutors-bulk-upload.ts`
- `src/pages/api/admin/content/team-bulk-upload.ts`

### Templates
- `public/templates/pricing-template.csv`
- `public/templates/pricing-template.json`
- `public/templates/tutors-template.csv`
- `public/templates/tutors-template.json`
- `public/templates/team-template.csv`
- `public/templates/team-template.json`

### Data Files (Ready to Use)
- `new-pricing-data.json` - Your pricing plans
- `new-pricing-data.csv` - Your pricing plans (CSV)

### Documentation
- `PRICING_BULK_UPLOAD_GUIDE.md`
- `PRICING_BULK_UPLOAD_QUICK_START.md`
- `PRICING_BULK_UPLOAD_IMPLEMENTATION.md`
- `UPLOAD_NEW_PRICING_INSTRUCTIONS.md`
- `BULK_UPLOAD_COMPLETE_GUIDE.md` (this file)
