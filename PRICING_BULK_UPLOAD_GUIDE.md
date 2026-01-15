# Pricing Bulk Upload Guide

## Overview
The pricing bulk upload feature allows content managers to update multiple pricing plans at once by uploading a CSV or JSON file. This is useful for:
- Updating prices across all plans
- Adding new pricing tiers
- Modifying features in bulk
- Seasonal pricing changes

## How to Use

### Step 1: Access the Feature
1. Log in to the Admin Dashboard
2. Navigate to **Content Management**
3. Click on the **Pricing** tab
4. Click the **Bulk Upload** button

### Step 2: Prepare Your File

#### Option A: Download Template
- Click "Download CSV Template" or "Download JSON Template" in the dialog
- Edit the template with your pricing data
- Save the file

#### Option B: Create Your Own File
Follow the format guidelines below.

### Step 3: Upload
1. Click "Choose File" in the upload dialog
2. Select your CSV or JSON file
3. The system will automatically process and update your pricing plans
4. You'll see a success message showing how many plans were updated/created

## File Formats

### CSV Format

**Structure:**
```csv
name,price,period,features,notIncluded,color,icon,popular,order
Basic Plan,R299,month,"Feature 1|Feature 2|Feature 3","Missing Feature","bg-blue-500",Star,false,1
```

**Field Details:**
- `name` (required): Plan name - used to match existing plans
- `price` (required): Price as string (e.g., "R299", "$99")
- `period` (optional): Billing period (default: "month")
- `features` (optional): Pipe (|) or semicolon (;) separated list
- `notIncluded` (optional): Features not included, pipe/semicolon separated
- `color` (optional): Tailwind CSS class (default: "bg-blue-500")
- `icon` (optional): Icon name (default: "Star")
- `popular` (optional): true/false (default: false)
- `order` (optional): Display order number (default: 0)

**Tips:**
- Wrap fields containing commas in double quotes
- Use pipe (|) or semicolon (;) to separate array items
- Use "true" or "false" for boolean values
- Existing plans with matching names will be updated

### JSON Format

**Structure:**
```json
[
  {
    "name": "Basic Plan",
    "price": "R299",
    "period": "month",
    "features": [
      "Weekly tutoring sessions",
      "Email support",
      "Study materials"
    ],
    "notIncluded": [
      "Priority support"
    ],
    "color": "bg-blue-500",
    "icon": "BookOpen",
    "popular": false,
    "order": 1
  }
]
```

**Field Details:**
- Must be a valid JSON array
- `name` and `price` are required
- `features` and `notIncluded` should be arrays of strings
- All other fields are optional

## Behavior

### Update vs Create
- If a plan with the same `name` exists, it will be **updated**
- If no matching plan exists, a new one will be **created**
- Plan matching is case-sensitive

### Validation
The system validates:
- Required fields (name, price)
- File format (valid CSV or JSON)
- Data types

If validation fails, you'll see an error message with details.

## Examples

### Example 1: Update All Prices
Create a CSV with existing plan names and new prices:
```csv
name,price,period
Basic Plan,R349,month
Standard Plan,R649,month
Premium Plan,R1099,month
```

### Example 2: Add New Features
Update plans with additional features:
```json
[
  {
    "name": "Basic Plan",
    "price": "R299",
    "features": [
      "Weekly sessions",
      "Email support",
      "NEW: Mobile app access"
    ]
  }
]
```

### Example 3: Seasonal Promotion
Mark a plan as popular and update pricing:
```csv
name,price,popular
Standard Plan,R499,true
```

## Troubleshooting

### Common Issues

**"No valid pricing data found"**
- Check that your file has at least one data row
- Verify the file format matches the examples

**"Validation failed: Name is required"**
- Ensure every row has a name field
- Check for empty rows in CSV

**"Invalid JSON format"**
- Validate your JSON using a JSON validator
- Ensure proper array structure with square brackets

**"CSV parsing error"**
- Check for unmatched quotes
- Ensure commas are properly escaped
- Use quotes around fields containing special characters

### Best Practices

1. **Test with small files first** - Upload 1-2 plans to verify format
2. **Backup existing data** - Export current plans before bulk updates
3. **Use templates** - Start with provided templates to avoid format issues
4. **Verify after upload** - Check the pricing page to confirm changes
5. **Keep consistent naming** - Use exact plan names for updates

## API Endpoint

For developers integrating with the API:

**Endpoint:** `POST /api/admin/content/pricing-bulk-upload`

**Request Body:**
```json
{
  "fileContent": "string (CSV or JSON content)",
  "fileType": "csv" | "json"
}
```

**Response:**
```json
{
  "message": "Pricing plans updated successfully",
  "updated": 2,
  "created": 1,
  "total": 3
}
```

## Support

If you encounter issues:
1. Check this guide for troubleshooting steps
2. Verify your file format matches the examples
3. Try downloading and using the provided templates
4. Contact your system administrator for assistance
