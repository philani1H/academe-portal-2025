# Pricing Bulk Upload - Quick Start

## 🚀 Quick Steps

1. **Access:** Admin Dashboard → Content Management → Pricing Tab
2. **Click:** "Bulk Upload" button
3. **Download:** Template (CSV or JSON)
4. **Edit:** Add your pricing data
5. **Upload:** Select file and done!

## 📋 CSV Format (Simple)

```csv
name,price,period,features,notIncluded,color,icon,popular,order
Basic,R299,month,"Feature 1|Feature 2","Missing","bg-blue-500",Star,false,1
Pro,R599,month,"All Basic|Feature 3","None","bg-purple-500",Zap,true,2
```

**Key Points:**
- Separate features with `|` (pipe)
- Use quotes around feature lists
- `true`/`false` for popular
- Existing plans update, new ones create

## 📦 JSON Format (Detailed)

```json
[
  {
    "name": "Basic",
    "price": "R299",
    "features": ["Feature 1", "Feature 2"],
    "popular": false
  }
]
```

## ✅ Required Fields
- `name` - Plan name
- `price` - Price string

## 🎯 Common Use Cases

### Update All Prices
```csv
name,price
Basic Plan,R349
Pro Plan,R699
```

### Add Features
```csv
name,features
Basic Plan,"Old Feature|New Feature|Another Feature"
```

### Mark as Popular
```csv
name,popular
Standard Plan,true
```

## 💡 Tips

- **Test first:** Upload 1-2 plans to verify format
- **Name matching:** Exact names update existing plans
- **Templates:** Use provided templates to avoid errors
- **Validation:** System checks data before saving

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No valid data" | Check file has data rows |
| "Name required" | Every row needs a name |
| "Invalid JSON" | Validate JSON syntax |
| "CSV error" | Check quotes and commas |

## 📞 Need Help?

See full guide: `PRICING_BULK_UPLOAD_GUIDE.md`
