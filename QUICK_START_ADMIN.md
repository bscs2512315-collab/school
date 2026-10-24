# 🚀 Quick Start: Admin Testing

## ✅ Admin Account Created!

Your admin account has been successfully created:

```
Email:    admin@exboard.ai
Password: CAS26@elecTions.Admin
Name:     Admin User
```

##  How to Test

### 1. Start the Server

```bash
npm run dev
```

### 2. Login as Admin

1. Go to: `http://localhost:3002/login`
2. Enter credentials:
   - **Email:** `admin@exboard.ai`
   - **Password:** `CAS26@elecTions.Admin`
3. Click "Login"
4. You'll be automatically redirected to `/admin/dashboard`

### 3. Test Upload Curriculum

1. Click "Upload Curriculum" button
2. Fill the form and upload a PDF curriculum file
3. Wait for AI analysis
4. See success message with number of chapters extracted

### 4. Test Upload Past Paper

1. Click "Upload Past Paper" button
2. Fill the form (Class, Board, Subject, Year) and upload PDF
3. System checks for duplicates automatically
4. After upload, you'll be redirected to review questions page
5. Edit chapter mappings if needed
6. Click "Save Questions"

## 🔑 Create More Admin Accounts

To create additional admin accounts:

```bash
# Default admin
npm run create-admin

# Custom admin
npm run create-admin your-email@example.com YourPassword123 "Admin Name"
```

## 📚 Full Documentation

- **Testing Guide:** See `TESTING_GUIDE.md` for complete testing checklist
- **Implementation Summary:** See `ADMIN_IMPLEMENTATION_SUMMARY.md` for features

## ⚠️ Important Notes

1. **Change Password:** Change the default password after first login
2. **Upload Order:** Upload curriculum BEFORE past papers (required for chapter mapping)
3. **File Format:** Only PDF files are supported
4. **File Size:** Maximum 10MB per file

## 🎯 Quick Test Flow

```
1. Login → Admin Dashboard
2. Upload Curriculum → Wait for AI → Success
3. Upload Past Paper → Wait for AI → Review Questions
4. Edit Chapter Mappings → Save Questions → Done!
```

---

**Ready to test! Start with step 1 above.** 🎉
