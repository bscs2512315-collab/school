# Admin Flow Implementation Plan

## Overview
This document outlines the implementation plan for the Admin Dashboard with Curriculum and Past Paper upload functionality using Google Gemini API.

## Requirements from User

### 1. API Key Required
- **Google Gemini API Key** (Free tier available)
  - Get it from: https://makersuite.google.com/app/apikey
  - Add to `.env` as: `GEMINI_API_KEY=your_api_key_here`

### 2. Database Schema Changes Needed

#### New Tables:
1. **curriculums** - Store uploaded curriculum/SLOs
2. **past_papers** - Store past paper metadata
3. **questions** - Store individual questions extracted from past papers
4. **chapters** - Store chapter information mapped to curriculum

## Implementation Phases

### Phase 1: Database Schema & Types
- [ ] Create database migration script for new tables
- [ ] Add enums for Subject, Year
- [ ] Create TypeScript interfaces for all new entities
- [ ] Update Board enum with all boards

### Phase 2: Admin Authentication & Authorization
- [ ] Create AdminGuard component (checks for ADMIN role)
- [ ] Create admin middleware for API routes
- [ ] Add admin dashboard route protection

### Phase 3: Gemini AI Integration
- [ ] Install `@google/generative-ai` package
- [ ] Create Gemini service wrapper
- [ ] Implement curriculum analysis function
- [ ] Implement PDF parsing and question extraction
- [ ] Implement chapter mapping logic

### Phase 4: File Upload System
- [ ] Create file upload API endpoint
- [ ] Add file storage (local/cloud)
- [ ] Implement PDF parsing with pdf-parse or similar
- [ ] Add file validation (size, type)

### Phase 5: Curriculum Upload Flow
- [ ] Create upload curriculum form component
- [ ] Create API endpoint for curriculum upload
- [ ] Implement AI analysis of curriculum
- [ ] Store curriculum in database
- [ ] Show success modal

### Phase 6: Past Paper Upload Flow
- [ ] Create upload past paper form component
- [ ] Create API endpoint for past paper upload
- [ ] Implement duplicate detection
- [ ] Implement AI analysis and question extraction
- [ ] Create question review/edit interface
- [ ] Implement question confirmation and storage

### Phase 7: Admin Dashboard UI
- [ ] Create admin dashboard layout
- [ ] Add upload curriculum button and modal
- [ ] Add upload past paper button and modal
- [ ] Add duplicate detection modal
- [ ] Add question review/edit interface
- [ ] Add loading states and error handling

## Database Schema Design

### curriculums Table
```sql
CREATE TABLE curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  board TEXT NOT NULL,
  subject TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  analyzed_content JSONB, -- AI analyzed curriculum structure
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class, board, subject)
);
```

### past_papers Table
```sql
CREATE TABLE past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  board TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class, board, subject, year)
);
```

### questions Table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  past_paper_id UUID REFERENCES past_papers(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT, -- mcq, crq, erq
  chapter_id UUID REFERENCES chapters(id),
  chapter_name TEXT, -- Denormalized for quick access
  ai_confidence DECIMAL(3,2), -- AI confidence score (0-1)
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### chapters Table
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
  chapter_number INTEGER,
  chapter_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Admin Routes
- `POST /api/admin/curriculum/upload` - Upload curriculum
- `POST /api/admin/past-paper/upload` - Upload past paper
- `GET /api/admin/past-paper/check-duplicate` - Check if past paper exists
- `DELETE /api/admin/past-paper/:id` - Delete past paper
- `POST /api/admin/past-paper/:id/questions` - Save analyzed questions
- `GET /api/admin/past-paper/:id/questions` - Get questions for review

## File Structure

```
app/
  admin/
    dashboard/
      page.tsx (Admin Dashboard)
    upload-curriculum/
      page.tsx (Curriculum Upload Form)
    upload-past-paper/
      page.tsx (Past Paper Upload Form)
    review-questions/
      page.tsx (Question Review/Edit Interface)
  api/
    admin/
      curriculum/
        upload/
          route.ts
      past-paper/
        upload/
          route.ts
        check-duplicate/
          route.ts
        [id]/
          route.ts (GET, DELETE)
          questions/
            route.ts (GET, POST)

lib/
  ai/
    gemini.ts (Gemini API wrapper)
    curriculum-analyzer.ts
    question-extractor.ts
  storage/
    file-upload.ts
  pdf/
    parser.ts

services/
  adminService.ts

types/
  admin.ts
  curriculum.ts
  past-paper.ts
  question.ts
```

## Gemini API Integration Details

### Curriculum Analysis Prompt
```
Analyze the following curriculum document and extract:
1. All chapters/topics with their descriptions
2. Learning objectives for each chapter
3. Structure the output as JSON with chapters array
```

### Question Extraction Prompt
```
From the following past paper PDF content, extract all questions:
1. Identify question numbers
2. Extract question text
3. Identify question type (MCQ, CRQ, ERQ)
4. Map each question to the most relevant chapter from the curriculum
5. Provide confidence score for chapter mapping
Output as JSON array of questions
```

## Environment Variables Needed

```env
GEMINI_API_KEY=your_gemini_api_key
UPLOAD_DIR=./uploads (or cloud storage config)
MAX_FILE_SIZE=10485760 (10MB)
```

## Dependencies to Install

```json
{
  "@google/generative-ai": "^0.2.0",
  "pdf-parse": "^1.1.1",
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.11",
  "@types/pdf-parse": "^1.1.4"
}
```

## Next Steps

1. **Get Gemini API Key** from user
2. Create database migration script
3. Install required dependencies
4. Implement file upload system
5. Integrate Gemini API
6. Build admin dashboard UI
7. Test complete flow

