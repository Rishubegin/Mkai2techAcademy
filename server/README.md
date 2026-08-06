# User Schema

POST

    /api/auth/register
    /api/auth/login
    /api/auth/logout
    /api/auth/forgot-password
    /api/auth/reset-password
    /api/auth/verify-email

GET

    /api/users/me
    /api/users - admin
    /api/users/:id

PATCH

    /api/users/:id
    /api/users/:id/profile-image
    /api/users/change-password
    /api/users/:id/verify  -  admin verify user

DELETE

    /api/users/:id

Search APIs - admin

GET /api/users/search?name=rishabh
GET /api/users/serach?email=rishabh@gmail.com

Filter APIs

GET /api/users?role=teacher
GET /api/users?role=student

Verified Users

GET /api/users?isVerified=true

Dashboard APIs

GET /api/dashboard/users/count
{
"students":150,
"teachers":12,
"admins":2
}

# Course Schema

1. create a course
   POST /api/course
2. get all courses
   GET /api/courses
3. get Course by ID
   GET /api/courses/:id
4. Update Course
   PATCH /api/courses/:id
5. Delete Course
   DELETE /api/courses/:id
6. Get Featured Courses
   GET /api/courses/featured
   {
   isFeatured: true,
   }
7. Get Courses by Category
   GET /api/courses/category/programming
   or
   GET /api/courses?category=Programming

8. Search Courses
   GET /api/courses/search?keyword=python

9. Filter Courses
   GET /api/courses?mode=offline
   or
   GET /api/courses?fees[lte]=10000
   or
   GET /api/courses?category=Programming&mode=Offline

10. Get Courses by Instructor
    GET /api/courses/instructor/:teacherId

11. Upload Course Image
    PATCH /api/courses/:id/image

12. Toggle Featured Course
    PATCH /api/courses/:id/feature

13. Update Syllabus
    PATCH /api/courses/:id/syllabus
    {
    "syllabus":[
    {
    "title":"HTML",
    "topics":[
    "Forms",
    "Tables",
    "Semantic Tags"
    ]
    }
    ]
    }

14. Get Categories
    GET /api/courses/categories

    [
    "Programming",
    "Computer Courses",
    "School",
    "Competitive Exams",
    "Digital Marketing"
    ]

15. Dashboard Stats
    GET /api/courses/stats

    {
    "totalCourses":25,
    "featuredCourses":6,
    "offlineCourses":12,
    "onlineCourses":8,
    "hybridCourses":5
    }

---

# Batch Schema

1. Create Batch - Admin
   POST /api/batches

2. Get All Batches
   GET /api/batches
   or
   GET /api/batches?page=1&limit=10

3. Get Batch by ID
   GET /api/batches/:id

4. Update Batch
   PATCH /api/batches/:id

5. Delete Batch
   DELETE /api/batches/:id

Course-related APIs

6. GET All Batches of a Course
   GET /api/courses/:courseId/batches
   or
   GET /api/batches?course=687c...

Teacher-related APIs 7. Get Teacher's Batches
GET /api/teachers/:teacherId/batches
or
GET /api/batches?teacher=687ab...

8. Get Student's Batch
   GET /api/students/:studentId/batches
   or
   GET /api/batches?student=687bb...

9. Add Student to Batch
   POST /api/batches/:id/students

10. Remove Student from Batch
    DELETE /api/batches/:id/students/:studentId

Status Apis

11. Update Batch Status
    PATCH /api/batches/:id/status

12. Get Upcoming Batches
    GET /api/batches?status=Upcoming

13. Get Running Batches
    GET /api/batches?status=Running

14. Get Completed Batches
    GET /api/batches?status=Completed

15. Search Batch
    GET /api/batches?search=mern

16. Filter by Date
    GET /api/batches?startDate=2026-07-01
    or
    GET /api/batches?from=2026-07-01&to=2026-08-01

17. Batch Statistics
    GET /api/batches/stats
    {
    "totalBatches":12,
    "running":5,
    "upcoming":4,
    "completed":3
    }

Capacity APis

18. Get Remaining Seats
    GET /api/batches/:id/seats
    {
    "capacity":40,
    "filled":28,
    "available":12
    }

---

# Teacher Schema

{
\_id,
user: ObjectId, // ref User
qualification,
experience,
specialization: [],
bio,
photo,
socialLinks
}
{
"user":"687bc2...",
"qualification":"M.Tech CSE",
"experience":"8 Years",
"specialization":[
"DSA",
"MERN",
"Java"
],
"bio":"Senior Software Engineer and Trainer"
}

1. Create Teacher Profile
   POST /api/teacher-profiles

2. Get all Teacher Profiles
   GET /api/teacher-profiles

3. Get Teacher Profile by User ID
   GET /api/teacher-profiles/user/:userId

4. GET Teacher Profile by Profile ID
   GET /api/teacher-profiles/:profileId

5. Update Teacher Profile
   PATCH /api/teacher-profiles/:profileId

6. Delete Teacher Profile
   DELETE /api/teacher-profiles/:profileId

7. Upload Teacher Photo
   PATCH /api/teacher-profiles/:profileId/photo

8. Search Teachers
   GET /api/teacher-profiles?search=python

search by - specialization - qualification - name (using populate)

9. Filter Teachers
   GET /api/teacher-profiles?specialization=MERN
   or
   GET /api/teacher-profiles?experience=5

10. Total Teachers
    GET /api/teacher-profiles/stats
    {
    "totalTeachers": 12,
    "averageExperience": "6 Years"
    }
