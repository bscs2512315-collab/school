# Swagger Documentation Update

## ✅ Admin API Endpoints Added to Swagger

All admin API endpoints have been documented with Swagger/OpenAPI annotations. The documentation will automatically appear in your Swagger UI.

## 📋 Documented Endpoints

### Admin - Curriculum

- **POST** `/api/admin/curriculum/upload` - Upload and analyze curriculum document

### Admin - Past Papers

- **POST** `/api/admin/past-paper/upload` - Upload and analyze past paper
- **POST** `/api/admin/past-paper/check-duplicate` - Check if past paper exists
- **GET** `/api/admin/past-paper/{id}` - Get past paper details
- **DELETE** `/api/admin/past-paper/{id}` - Delete past paper

### Admin - Questions

- **GET** `/api/admin/past-paper/{id}/questions` - Get all questions for review
- **POST** `/api/admin/past-paper/{id}/questions` - Save questions after review

## 🔍 How to View

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to Swagger UI:

   ```
   http://localhost:3002/api-docs
   ```

3. You'll see all endpoints organized by tags:
   - **Auth** - Authentication endpoints
   - **Admin** - Admin management endpoints
   - **Utility** - Utility endpoints (like schools)

## 🔐 Authentication

All admin endpoints require Bearer token authentication:

1. Login first to get a JWT token
2. Click "Authorize" button in Swagger UI
3. Enter: `Bearer <your_jwt_token>`
4. Now you can test admin endpoints

##  Documentation Features

Each endpoint includes:

- ✅ Summary and description
- ✅ Request/response schemas
- ✅ Required parameters
- ✅ Example values
- ✅ Error responses
- ✅ Security requirements

## 🧪 Testing in Swagger UI

1. **Get Admin Token:**
   - Use `/api/auth/login` endpoint
   - Login with admin credentials
   - Copy the `token` from response

2. **Authorize:**
   - Click "Authorize" button (top right)
   - Enter: `Bearer <token>`
   - Click "Authorize"

3. **Test Endpoints:**
   - Expand any admin endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"
   - See response below

## 📚 Example: Testing Curriculum Upload

1. Authorize with admin token
2. Go to `POST /api/admin/curriculum/upload`
3. Click "Try it out"
4. Fill form data:
   - `class`: `IX`
   - `board`: `AKUEB`
   - `subject`: `Mathematics`
   - `file`: Upload a PDF file
5. Click "Execute"
6. See response with curriculum ID and chapters count

## ✨ Notes

- Swagger automatically scans `./app/api/**/*.ts` files
- Documentation is generated from JSDoc comments
- All admin endpoints are tagged under "Admin"
- Security scheme (Bearer Auth) is configured globally

---

**Swagger documentation is now complete and up-to-date!** 🎉
