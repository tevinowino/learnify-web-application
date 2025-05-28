
# Learnify

Learnify is a comprehensive educational platform designed to streamline various academic processes for administrators, teachers, students, and parents, enhanced with AI-powered tools.

## Core Features

Learnify offers a range of features to enhance the educational experience for all users:

**Platform-Wide:**
-   Secure User Authentication & Role-Based Access (Admin, Teacher, Student, Parent).
-   Light & Dark Mode Themes for personalized viewing.
-   Responsive, Mobile-First Design for accessibility on any device.
-   Intuitive Navigation, including hamburger menus on mobile for dashboard sections.
-   Pop-up Notifications for key events (e.g., new assignments, approvals, submissions).
-   Activity Feeds tailored to user roles, showing relevant updates.
-   General Site Pages: Homepage (with Hero, How It Works, Features, Why Learnify, Testimonials, Get Started/Contact), About Us, Contact Us, Privacy Policy, Terms of Service.
-   Cloudinary integration for robust file uploads (Learning Materials, Student Assignment Submissions).
-   EmailJS integration for email notifications for critical actions and communication.

**Admin Role:**
-   **Onboarding & School Setup:**
    -   Create a new school, automatically generating a unique school invite code.
    -   Option to join an existing school using an invite code (if not already associated).
-   **School Management:**
    -   View and edit the school's name (if creator).
    -   Regenerate the school's unique invite code for sharing.
    -   Toggle a school-wide "Exam Mode" to enable/disable result entry.
    -   Define, create, edit, and delete subjects offered by the school.
-   **User Management:**
    -   Add new users (teachers, students) directly to the school with specified roles.
    -   View a filterable and searchable list of all users within their school (by name, email, role, status).
    -   Manage pending user verification requests (for teachers and students who signed up with a school ID).
    -   Approve or reject pending user requests.
    -   Edit user display names and assign/change roles (for non-admin users in their school).
-   **Class Management:**
    -   Create new classes, specifying them as 'main' (e.g., Form 2.1) or 'subject-based' (e.g., History 2.2).
    -   Assign a Class Teacher to main classes.
    -   Assign a Subject Teacher to subject-based classes.
    -   Designate compulsory subjects (e.g., Mathematics, English) for main classes.
    -   View a list of all classes, their types, assigned teachers, and student enrollment counts.
    -   Manually enroll or remove students from classes.
    -   Edit class names, assigned teachers, class types, and compulsory/assigned subjects.
    -   Regenerate class-specific invite codes.
    -   Delete classes (which also removes associated assignments and enrollments).
-   **Exam & Results Management:**
    -   Create exam periods (e.g., Mid-Term Exams, End-Term Exams) with start and end dates.
    -   Assign exam periods to specific classes.
    -   Monitor the progress of result submission by teachers for active exam periods.
    -   Finalize exam periods, which locks results from further editing and makes them visible to students and parents.
    -   Edit details of 'upcoming' exam periods.
-   **Attendance Tracking:**
    -   View attendance records for any class within the school, filterable by date.
-   **Admin Dashboard:**
    -   Overview of key school statistics: total user count, teacher count, student count, class count.
    -   Feed of recent platform-wide and school-specific activities.
-   **Profile Management:**
    -   Update personal display name, email address, and password.

**Teacher Role:**
-   **Onboarding:** Register by providing a school ID; account requires admin approval.
-   **Teacher Dashboard:**
    -   Overview of assigned classes.
    -   Summary of upcoming assignment deadlines.
    -   Counts of uploaded learning materials and created assignments.
    -   Access to Mwalimu AI Assistant for lesson planning, material summarization, and generating teaching ideas.
    -   Recent activity feed relevant to their classes and actions.
-   **Class Management:**
    -   View details of assigned classes, including student rosters.
-   **Learning Materials Management:**
    -   Upload various types of learning materials: text notes, external links, video links, PDF links, and direct PDF uploads (via Cloudinary).
    -   Assign materials to specific classes and subjects, or designate them as general school-wide resources.
    -   View, edit, and delete their own uploaded materials.
-   **Assignment Management:**
    -   Create text-based assignments, providing titles, detailed descriptions, deadlines, and specifying allowed student submission formats (text entry, file link, file upload).
    -   Link assignments to specific subjects.
    -   View a list of all created assignments, filterable by class.
    -   View submissions for each assignment, including student names, submission times, and content.
    -   Download student-submitted files.
    -   Grade assignments, provide marks/grades, and offer textual feedback.
    -   Edit or delete their created assignments (deleting also removes related student submissions).
-   **Attendance Tracking:**
    -   Mark and submit daily attendance (Present, Absent) for students in their assigned classes.
-   **Exam & Results Management:**
    -   Enter student marks and remarks for subjects they teach in assigned classes during an active "Exam Mode" period.
-   **Profile Management:**
    -   Update personal display name, email address, and password.

**Student Role:**
-   **Onboarding:**
    -   Register by providing a school ID; account requires admin approval.
    -   After approval, complete an onboarding process to select their main class from a school-provided list.
    -   Compulsory subjects for the main class are automatically assigned.
    -   Select additional elective subjects offered by the school.
-   **Student Dashboard:**
    -   Overview of enrolled classes.
    -   List of upcoming assignment deadlines.
    -   Count of available learning resources.
    -   Access to Akili AI Chatbot for study help and asking questions.
    -   Recent activity feed relevant to their classes and school.
-   **Class Management:**
    -   View a list of their enrolled classes and access class-specific details.
    -   Join additional (subject-based) classes using a class-specific invite code.
-   **Learning Materials Access:**
    -   Access learning materials relevant to their enrolled classes and general school-wide resources.
    -   Search and filter materials by title, content, teacher, class, or subject.
    -   Download uploaded PDF materials.
-   **Assignment Submission:**
    -   View assigned assignments with details, instructions, and deadlines.
    -   Submit work in the formats allowed by the teacher (text entry, file link, or file upload via Cloudinary).
    -   View their submission status (submitted, late, graded, missing).
    -   View grades and teacher feedback once an assignment is graded.
-   **Exam Results:**
    -   View their published exam results, including marks and teacher remarks for each subject, organized by exam period.
-   **Attendance:**
    -   View their own attendance records (Placeholder for detailed view).
-   **Personalized Learning Path:**
    -   Generate AI-powered personalized learning paths for their enrolled subjects by providing current understanding and goals.
-   **Profile Management:**
    -   Update personal display name.
    -   View their unique Student ID (for sharing with parents).

**Parent Role:**
-   **Onboarding & Child Linking:**
    -   Register an account.
    -   Link their account to their child's student account using the child's unique Student ID. Account becomes active and associated with the child's school upon successful linking.
-   **Parent Dashboard:**
    -   Overview of the linked child's academic information.
    -   Count of the child's upcoming assignments.
    -   Count of the child's recently graded results.
    -   Summary of child's attendance (e.g., issues in the last 7 days).
    -   Activity feed specific to their child's actions and relevant school/class updates.
-   **Child's Academic Monitoring:**
    -   View a detailed list of their child's assignments, including submission status and grades (Detailed page placeholder).
    -   View their child's detailed exam results and teacher remarks (Detailed page placeholder).
    -   View their child's attendance records, filterable by date range.
-   **Profile Management:**
    -   Update personal display name, email address, and password.
    -   Re-link or link to a different child's account.

**AI Integration:**
-   **Akili Chatbot:** An AI-powered smart study companion and tutor for students to ask questions and get explanations on various topics.
-   **Mwalimu AI Assistant:** An AI tool for teachers to assist with planning class notes, summarizing learning materials, and generating lesson plan ideas or classroom activities.
-   **Personalized Learning Path Generation:** Students can generate tailored study plans based on their subject, current understanding, and goals.

## Color Schemes

Learnify utilizes a modern and clean user interface with distinct color schemes for different themes (light and dark). Specific color palettes are defined within the application's styling configurations (`src/app/globals.css`).

## User Flow

Here's a general overview of the user flow for different roles:

### Admin
1.  Sign up or Login. If no school is associated, choose to:
    *   **Create a new school:** Provide school name. An invite code is generated.
    *   **Join an existing school:** Enter the school's invite code.
2.  **Dashboard:** View school stats, recent activity.
3.  **School Settings:** Manage school name, regenerate invite code, toggle Exam Mode, define/manage subjects.
4.  **User Management:** Add new teachers/students, view user lists, approve/reject pending users, edit roles.
5.  **Class Management:** Create main/subject classes, assign teachers, set compulsory subjects, enroll/remove students, manage class invite codes.
6.  **Exam Management:** Create exam periods, assign to classes, monitor result submission, finalize periods.
7.  **Attendance:** View attendance records for any class.
8.  **Profile:** Update personal details.

### Teacher
1.  Sign up (providing School ID) or Login. Await admin approval if self-registered with School ID.
2.  **Dashboard:** View assigned classes, upcoming deadlines, material/assignment counts, use Mwalimu AI, see activity feed.
3.  **My Classes:** Access details for each assigned class (students, materials, assignments).
4.  **Learning Materials:** Upload (text, links, PDFs), assign to class/subject, edit, or delete materials.
5.  **Assignments:** Create text-based assignments, set deadlines, link to subjects, view/grade submissions, provide feedback.
6.  **Attendance:** Mark daily attendance for students in assigned classes.
7.  **Exam Results:** Enter student marks and remarks during active exam periods for assigned classes/subjects.
8.  **Profile:** Update personal details.

### Student
1.  Sign up (providing School ID) or Login. Await admin approval if self-registered with School ID.
2.  **Onboarding (if new & approved):** Select main class from school's list; compulsory subjects auto-assigned; select elective subjects.
3.  **Dashboard:** View enrolled classes, upcoming assignments, resource count, use Akili AI chatbot, see activity feed.
4.  **My Classes:** Access materials and assignments for each enrolled class. Join new subject-based classes with invite codes.
5.  **Learning Resources:** Browse, search, and filter all accessible materials.
6.  **Assignments:** View assignments, submit work (text, link, file upload), check grades/feedback.
7.  **Exam Results:** View published exam results and remarks.
8.  **Attendance:** View personal attendance records (Placeholder).
9.  **Progress:** Generate personalized AI learning paths.
10. **Profile:** Update display name, view Student ID.

### Parent
1.  Sign up or Login.
2.  **Link Child Account:** If not already linked, provide child's unique Student ID to connect accounts. School association is inherited from child.
3.  **Dashboard:** (After linking child) Overview of child's upcoming assignments, recent grades, attendance summary, activity feed.
4.  **Child's Assignments:** View detailed list of child's assignments, status, and grades (Placeholder).
5.  **Child's Results:** View detailed exam results and remarks for the child (Placeholder).
6.  **Child's Attendance:** View child's attendance records, filterable by date.
7.  **Profile:** Update personal details, manage child link.

## Contact Information

For any inquiries, please contact us at: **learnifyke@gmail.com**
Phone: **+254794830280**

