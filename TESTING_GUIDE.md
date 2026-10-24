# Admin Flow Testing Guide

## 🚀 Quick Start: Create Admin Account

### Step 1: Create Admin Account

Run the following command to create an admin account:

```bash
npm run create-admin
```

This will create an admin account with default credentials:

- **Email:** `admin@exboard.ai`
- **Password:** `CAS26@elecTions.Admin`
- **Name:** `Admin User`

### Step 2: Create Custom Admin Account

To create an admin with custom credentials:

```bash
npm run create-admin <email> <password> <name>
```

Example:

```bash
npm run create-admin admin@mycompany.com MySecurePass123 "John Admin"
```

### Step 3: Login as Admin

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3002/login`

3. Enter your admin credentials:
   - Email: `admin@exboard.ai` (or your custom email)
   - Password: `CAS26@elecTions.Admin` (or your custom password)

4. Click "Login"

5. You will be automatically redirected to `/admin/dashboard`

## 📋 Testing Checklist

### ✅ Test 1: Admin Login

- [ ] Create admin account using script
- [ ] Login with admin credentials
- [ ] Verify redirect to admin dashboard
- [ ] Check that admin name is displayed

### ✅ Test 2: Upload Curriculum

1. Click "Upload Curriculum" button
2. Fill in the form:
   - Select Class: `IX`
   - Select Board: `AKUEB`
   - Select Subject: `Mathematics`
   - Upload a PDF curriculum file
3. Click "Upload & Analyze"
4. Wait for AI analysis (shows loading state)
5. Verify success modal appears
6. Check that chapters were extracted

### ✅ Test 3: Upload Past Paper

1. Click "Upload Past Paper" button
2. Fill in the form:
   - Select Class: `IX`
   - Select Board: `AKUEB`
   - Select Subject: `Mathematics`
   - Select Year: `2024`
   - Upload a PDF past paper file
3. System checks for duplicates automatically
4. If no duplicate, click "Upload & Analyze"
5. Wait for AI analysis
6. Verify redirect to review questions page

### ✅ Test 4: Duplicate Detection

1. Try uploading the same past paper again (same class, board, subject, year)
2. Verify duplicate modal appears
3. Test "View" button - should navigate to review page
4. Test "Delete" button - should delete existing and allow new upload
5. Test "Cancel" button - should close modal

### ✅ Test 5: Review Questions

1. After uploading past paper, you should be on review page
2. Verify all questions are displayed
3. Check that each question shows:
   - Question number
   - Question text
   - Question type (MCQ, CRQ, ERQ)
   - AI confidence score
   - Current chapter mapping
4. Test editing chapter mapping:
   - Select different chapter from dropdown
   - Verify chapter name updates
5. Click "Save Questions"
6. Verify success modal appears
7. Verify questions are saved to database

### ✅ Test 6: Access Control

1. Try accessing `/admin/dashboard` without login - should redirect to login
2. Login as regular student - should NOT access admin dashboard
3. Login as admin - should access admin dashboard
4. Verify AdminGuard component works correctly

## 🔧 Troubleshooting

### Admin Account Creation Fails

**Error:** "User with email already exists"

- **Solution:** Use a different email or delete existing user from database

**Error:** "Connection refused" or database error

- **Solution:**
  1. Check `DATABASE_URL` in `.env` file
  2. Ensure database is running
  3. Run `npm run db:migrate` first if needed

### Login Issues

**Error:** "Invalid credentials"

- **Solution:**
  1. Verify email and password are correct
  2. Check that admin account was created successfully
  3. Verify `is_verified` is `true` in database

**Error:** "Please verify your email address first"

- **Solution:** Admin accounts should be auto-verified. Check database:
  ```sql
  UPDATE users SET is_verified = true WHERE email = 'admin@exboard.ai';
  ```

### AI Analysis Fails

**Error:** "Failed to analyze curriculum with AI"

- **Solution:**
  1. Check `GEMINI_API_KEY` in `.env` file
  2. Verify API key is valid
  3. Check API quota/limits
  4. Review console logs for detailed error

**Error:** "Curriculum not found"

- **Solution:** Upload curriculum first before uploading past papers

### File Upload Issues

**Error:** "Only PDF files are allowed"

- **Solution:** Ensure file is actually a PDF format

**Error:** "File size exceeds maximum"

- **Solution:** Reduce file size (max 10MB by default)

**Error:** "Failed to parse PDF"

- **Solution:**
  1. Verify PDF is not corrupted
  2. Try a different PDF file
  3. Check file permissions

## 🗄️ Database Verification

### Check Admin User

```sql
SELECT id, email, name, role, is_verified
FROM users
WHERE role = 'ADMIN';
```

### Check Uploaded Curriculums

```sql
SELECT id, class, board, subject, file_name, created_at
FROM curriculums
ORDER BY created_at DESC;
```

### Check Uploaded Past Papers

```sql
SELECT id, class, board, subject, year, status, total_questions
FROM past_papers
ORDER BY created_at DESC;
```

### Check Extracted Questions

```sql
SELECT q.id, q.question_number, q.question_text, q.chapter_name, pp.year
FROM questions q
JOIN past_papers pp ON q.past_paper_id = pp.id
ORDER BY pp.created_at DESC, q.question_number;
```

##  Sample Test Data

### Test Curriculum

- **Class:** IX
- **Board:** AKUEB
- **Subject:** Mathematics
- **File:** Any PDF containing curriculum/SLOs

### Test Past Paper

- **Class:** IX
- **Board:** AKUEB
- **Subject:** Mathematics
- **Year:** 2024
- **File:** Any PDF containing past paper questions

## 🎯 Expected Behavior

### After Creating Admin

- Admin account created with `is_verified = true`
- Admin can login immediately (no OTP needed)
- Admin redirected to `/admin/dashboard` after login

### After Uploading Curriculum

- File saved to `./uploads/curriculums/`
- AI analyzes curriculum
- Chapters extracted and saved to database
- Success modal shows number of chapters

### After Uploading Past Paper

- File saved to `./uploads/past-papers/`
- Duplicate check performed automatically
- AI extracts questions from PDF
- Questions mapped to chapters (if curriculum exists)
- Redirect to review page

### After Reviewing Questions

- All questions displayed with chapter mappings
- Admin can edit chapter mappings
- Questions saved with `is_verified = true`
- Past paper status updated to `completed`

## 🔐 Security Notes

1. **Change Default Password:** After first login, change the default password
2. **Admin Access:** Only users with `role = 'ADMIN'` can access admin routes
3. **JWT Tokens:** Admin tokens include role information
4. **File Storage:** Uploaded files stored locally (consider cloud storage for production)

## 📞 Support

If you encounter any issues:

1. Check console logs for errors
2. Verify environment variables are set
3. Check database connection
4. Review API responses in browser network tab
5. Check Gemini API status and quota

---

**Happy Testing! 🎉**
