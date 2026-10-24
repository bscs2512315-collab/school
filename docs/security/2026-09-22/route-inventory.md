# API route inventory

Generated from the working tree. Guard names are lexical indicators, not proof of correct per-method authorization or ownership checks. All 157 route files were inventoried; manual depth was risk-based.

| Route file | Exported methods | Auth indicators |
|---|---|---|
| `app/api/admin/activities/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/boards/[id]/route.ts` | PATCH, DELETE | getAdminFromRequest |
| `app/api/admin/boards/route.ts` | GET, POST | getAdminFromRequest |
| `app/api/admin/bot/exemplars/[questionId]/route.ts` | PUT | getAdminFromRequest |
| `app/api/admin/bot/exemplars/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/bot/knowledge/route.ts` | GET, POST | getAdminFromRequest |
| `app/api/admin/bot/settings/route.ts` | GET, PUT | getAdminFromRequest |
| `app/api/admin/bot/test/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/curriculum/[id]/analyze/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/curriculum/[id]/chapters/[chapterId]/route.ts` | PUT, DELETE | getAdminFromRequest |
| `app/api/admin/curriculum/[id]/chapters/route.ts` | POST, GET | getAdminFromRequest |
| `app/api/admin/curriculum/[id]/route.ts` | GET, DELETE | getAdminFromRequest |
| `app/api/admin/curriculum/chapters/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/curriculum/create/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/curriculum/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/curriculum/upload/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/dashboard/stats/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/milestones/[id]/route.ts` | PUT, DELETE | getUserFromRequest |
| `app/api/admin/milestones/route.ts` | GET, POST | getUserFromRequest |
| `app/api/admin/past-paper/[id]/questions/route.ts` | GET, POST | getAdminFromRequest |
| `app/api/admin/past-paper/[id]/route.ts` | GET, DELETE, PUT | getAdminFromRequest |
| `app/api/admin/past-paper/auto-extract/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/past-paper/check-duplicate/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/past-paper/create/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/past-paper/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/past-paper/upload/confirm/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/past-paper/upload/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/questions/chapters/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/questions/route.ts` | GET, DELETE | getAdminFromRequest |
| `app/api/admin/questions/summary/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/questions/upload-image/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/review-exams/[id]/grade/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/review-exams/[id]/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/review-exams/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/schools/[id]/route.ts` | PATCH, DELETE | getAdminFromRequest |
| `app/api/admin/schools/route.ts` | GET, POST | getAdminFromRequest |
| `app/api/admin/settings/route.ts` | GET, POST | getAdminFromRequest |
| `app/api/admin/subjects/[id]/route.ts` | PUT, DELETE | getUserFromRequest |
| `app/api/admin/subjects/route.ts` | GET, POST | getUserFromRequest |
| `app/api/admin/syllabus/auto-extract/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/syllabus/parse/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/syllabus/save/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/users/emails/route.ts` | GET | getAdminFromRequest |
| `app/api/admin/users/reset-points/route.ts` | POST | getAdminFromRequest |
| `app/api/admin/users/route.ts` | GET, DELETE | getAdminFromRequest |
| `app/api/auth/forgot-password/route.ts` | POST | None directly identified |
| `app/api/auth/login/route.ts` | POST | None directly identified |
| `app/api/auth/register/route.ts` | POST | None directly identified |
| `app/api/auth/register/school/route.ts` | POST | None directly identified |
| `app/api/auth/register/teacher/route.ts` | POST | None directly identified |
| `app/api/auth/reset-password/route.ts` | POST | None directly identified |
| `app/api/auth/verify-otp/route.ts` | POST | None directly identified |
| `app/api/boards/route.ts` | GET | None directly identified |
| `app/api/challenges/[id]/respond/route.ts` | POST | getUserFromRequest |
| `app/api/challenges/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/challenges/[id]/submit/route.ts` | POST | getUserFromRequest |
| `app/api/challenges/route.ts` | POST, GET | getUserFromRequest |
| `app/api/classrooms/[classroomId]/coverage/route.ts` | GET | verifyAuth |
| `app/api/classrooms/[classroomId]/join/route.ts` | POST | verifyAuth |
| `app/api/classrooms/[classroomId]/route.ts` | GET | verifyAuth |
| `app/api/classrooms/join/route.ts` |  | None directly identified |
| `app/api/classrooms/route.ts` | GET | verifyAuth |
| `app/api/cron/recover-gradings/route.ts` | POST, GET | verifyAuth |
| `app/api/elections/[slug]/analytics/route.ts` | GET | None directly identified |
| `app/api/elections/[slug]/register/route.ts` | GET, POST | None directly identified |
| `app/api/elections/[slug]/route.ts` | GET | None directly identified |
| `app/api/elections/[slug]/vote/route.ts` | POST | None directly identified |
| `app/api/lab/grade/route.ts` | POST | None directly identified |
| `app/api/leaderboard/route.ts` | GET | verifyAuth |
| `app/api/lightning/[id]/action/route.ts` | POST | getUserFromRequest |
| `app/api/lightning/[id]/answer/route.ts` | POST | getUserFromRequest |
| `app/api/lightning/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/lightning/create/route.ts` | POST | getUserFromRequest |
| `app/api/lightning/join/route.ts` | POST | getUserFromRequest |
| `app/api/notifications/[id]/route.ts` | DELETE | getUserFromRequest |
| `app/api/notifications/push/subscribe/route.ts` | POST | getUserFromRequest |
| `app/api/notifications/push/test/route.ts` | POST | getUserFromRequest |
| `app/api/notifications/push/unsubscribe/route.ts` | POST | getUserFromRequest |
| `app/api/notifications/route.ts` | GET, PATCH | getUserFromRequest |
| `app/api/school/add-student/route.ts` | POST | verifyJWT |
| `app/api/school/add-teacher/route.ts` | POST | verifyAuth |
| `app/api/schools/route.ts` | GET | None directly identified |
| `app/api/stories/generate/route.ts` | GET, POST | None directly identified |
| `app/api/student/answers/upload/route.ts` | POST | getUserFromRequest |
| `app/api/student/attempt/paper2/grade/route.ts` | POST | verifyAuth |
| `app/api/student/attempt/paper2/route.ts` | POST | verifyAuth |
| `app/api/student/attempt/route.ts` | POST | verifyAuth |
| `app/api/student/chat/generate-from-image/route.ts` | POST | getUserFromRequest |
| `app/api/student/chat/route.ts` | POST, GET | getUserFromRequest |
| `app/api/student/chat/sessions/[id]/route.ts` | GET, DELETE | getUserFromRequest |
| `app/api/student/chat/upload/route.ts` | POST | getUserFromRequest |
| `app/api/student/classrooms/[classroomId]/attempts/route.ts` | GET | verifyAuth |
| `app/api/student/classrooms/[classroomId]/performance/route.ts` | GET | verifyAuth |
| `app/api/student/classrooms/[classroomId]/results/route.ts` | GET | verifyAuth |
| `app/api/student/classrooms/join/route.ts` | POST | verifyAuth |
| `app/api/student/complete-profile/route.ts` | POST | verifyJWT |
| `app/api/student/curriculum/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/student/curriculum/route.ts` | GET | getUserFromRequest |
| `app/api/student/custom-quizzes/[id]/attempt/route.ts` | POST | getUserFromRequest |
| `app/api/student/custom-quizzes/[id]/route.ts` | GET, PUT, DELETE | getUserFromRequest |
| `app/api/student/custom-quizzes/[id]/share/route.ts` | POST | getUserFromRequest |
| `app/api/student/custom-quizzes/route.ts` | GET, POST | getUserFromRequest |
| `app/api/student/custom-quizzes/shared/route.ts` | GET | getUserFromRequest |
| `app/api/student/generate-paper/chapters/route.ts` | GET | None directly identified |
| `app/api/student/generate-paper/route.ts` | POST | None directly identified |
| `app/api/student/generate-paper/submit/route.ts` | POST | verifyAuth |
| `app/api/student/history/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/student/history/route.ts` | GET | getUserFromRequest |
| `app/api/student/me/route.ts` | GET | getUserFromRequest |
| `app/api/student/milestones/route.ts` | GET | getUserFromRequest |
| `app/api/student/past-paper/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/student/past-paper/route.ts` | GET | getUserFromRequest |
| `app/api/student/teacher-papers/[id]/attempt/route.ts` | POST | verifyAuth |
| `app/api/student/teacher-papers/[id]/progress/route.ts` | PUT, DELETE | verifyAuth |
| `app/api/student/teacher-papers/[id]/route.ts` | GET | verifyAuth |
| `app/api/student/teachers/route.ts` | GET | verifyAuth |
| `app/api/subjects/route.ts` | GET | None directly identified |
| `app/api/swagger/route.ts` | GET | None directly identified |
| `app/api/teacher/activities/route.ts` | GET | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/attempts/[attemptId]/approve/route.ts` | POST | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/attempts/[attemptId]/route.ts` | GET | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/attempts/route.ts` | GET | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/members/[studentId]/route.ts` | DELETE | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/members/route.ts` | GET, POST | verifyAuth |
| `app/api/teacher/classrooms/[classroomId]/route.ts` | DELETE, PATCH | verifyAuth |
| `app/api/teacher/classrooms/route.ts` | POST | verifyAuth |
| `app/api/teacher/content/route.ts` | POST, GET | verifyAuth |
| `app/api/teacher/elections/[id]/analytics/route.ts` | GET | verifyAuth |
| `app/api/teacher/elections/[id]/approve-results/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/candidates/[candidateId]/route.ts` | PATCH, DELETE | verifyAuth |
| `app/api/teacher/elections/[id]/candidates/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/logo/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/route.ts` | GET, PATCH, DELETE | verifyAuth |
| `app/api/teacher/elections/[id]/votes/delete/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/votes/discard/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/votes/edit/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/votes/resolve/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/votes/restore/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/[id]/votes/route.ts` | GET | verifyAuth |
| `app/api/teacher/elections/[id]/votes/unresolve/route.ts` | POST | verifyAuth |
| `app/api/teacher/elections/route.ts` | GET, POST | verifyAuth |
| `app/api/teacher/grade-paper/route.ts` | POST | verifyAuth |
| `app/api/teacher/papers/[id]/route.ts` | GET, PATCH | verifyAuth |
| `app/api/teacher/papers/route.ts` | GET, POST | verifyAuth |
| `app/api/teacher/pending-papers/[attemptId]/route.ts` | GET | verifyAuth |
| `app/api/teacher/pending-papers/route.ts` | GET | verifyAuth |
| `app/api/teacher/students/route.ts` | GET | verifyAuth |
| `app/api/teacher/students/search/route.ts` | GET | verifyAuth |
| `app/api/tts/route.ts` | OPTIONS, POST, GET | None directly identified |
| `app/api/upload/cloudinary/route.ts` | POST | getAdminFromRequest |
| `app/api/upload/reference-image/route.ts` | POST | getUserFromRequest |
| `app/api/user/profile/route.ts` | GET, PUT | getUserFromRequest |
| `app/api/user/profile/upload-avatar/route.ts` | POST | getUserFromRequest |
| `app/api/users/[id]/follow/route.ts` | POST, DELETE | getUserFromRequest |
| `app/api/users/[id]/followers/route.ts` | GET | getUserFromRequest |
| `app/api/users/[id]/route.ts` | GET | getUserFromRequest |
| `app/api/users/search/route.ts` | GET | getUserFromRequest |
