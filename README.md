
# Learnify

Learnify is a comprehensive educational platform designed to streamline various academic processes for administrators, teachers, students, and parents, enhanced with AI-powered tools.

## Core Features

Learnify offers a range of features to enhance the educational experience for all users:

-   **User Authentication and Management**:
    -   Secure login and registration for different user roles (Admin, Teacher, Student, Parent).
    -   Admins can manage user accounts: add new users (teachers, students), edit roles, approve/reject pending user requests.
    -   User profile management (update display name).

-   **School Onboarding & Management**:
    -   **Admin Onboarding**: Admins can create a new school (generating an invite code) or join an existing school using an invite code.
    -   **School Details**: Admins (creator) can manage school name and regenerate invite codes.
    -   **Exam Mode**: Admins can toggle a school-wide "Exam Mode".
    -   **Subject Management**: Admins can define and manage subjects offered by the school.

-   **Class Management**:
    -   **Class Creation**: Admins can create classes, specifying them as 'main' (e.g., Form 2.1) or 'subject-based' (e.g., History 2.2).
    -   **Compulsory Subjects**: Main classes can have designated compulsory subjects (e.g., Mathematics, English).
    -   **Teacher Assignment**: Teachers can be assigned to main classes (as class teachers) and subject-based classes.
    -   **Student Enrollment**: Admins can enroll students in classes. Students can join classes using a class-specific invite code.

-   **Student Onboarding**:
    -   After registration and school admin approval, students are guided to select their main class.
    -   Based on the main class, compulsory subjects are automatically assigned.
    -   Students can then select additional elective subjects offered by the school.

-   **Learning Materials Management**:
    -   **Upload & Sharing**: Teachers can upload and share various learning materials (text notes, links to external resources, video links, PDF links, and direct PDF uploads).
    -   **Categorization**: Materials can be assigned to specific classes and subjects, or be general school-wide resources.
    -   **Student Access**: Students can access materials relevant to their enrolled classes and general school resources.
    -   **Search & Filter**: Students can search and filter learning materials.

-   **Assignment Management**:
    -   **Creation**: Teachers can create assignments with titles, detailed descriptions, deadlines, and specify allowed submission formats (text entry, file link, file upload).
    -   **Attachments**: Teachers can attach files (e.g., worksheets, templates) to assignments.
    -   **Subject Linking**: Assignments can be linked to specific subjects.
    -   **Student Submission**: Students can view assignments, submit their work in the allowed formats, and see submission status.
    -   **Grading**: Teachers can view submissions, download submitted files, grade assignments, and provide feedback.

-   **Exam & Results Management**:
    -   **Exam Periods**: Admins can create exam periods (e.g., Mid-Term Exams, End-Term Exams) with start and end dates, and assign them to specific classes.
    -   **Result Entry**: When Exam Mode is active, teachers can input student marks and remarks for specific exams, classes, and subjects.
    -   **Progress Monitoring**: Admins can track which classes/students have pending results for an active exam period.
    -   **Finalization**: Admins can finalize an exam period, locking results and making them visible.
    -   **Student/Parent View**: Students and linked parents can view published exam results and teacher remarks.

-   **Attendance Tracking**:
    -   Teachers can mark daily attendance (present, absent, late, excused) for students in their assigned classes.
    -   Admins and linked Parents can view student attendance records.

-   **Dashboards & Activity Feeds**:
    -   **Admin Dashboard**: Overview of school statistics (total users, teacher/student counts, class counts), recent platform activity.
    -   **Teacher Dashboard**: Overview of assigned classes, upcoming assignment deadlines, count of uploaded materials/assignments, recent activity feed, AI summarization tool.
    -   **Student Dashboard**: Overview of enrolled classes, upcoming assignments, count of available resources, recent activity feed, link to Akili AI chatbot.
    -   **Parent Dashboard**: (After linking child) Overview of child's upcoming assignments, recent grades, attendance summary, activity feed.

-   **AI Integration**:
    -   **Akili Chatbot**: An AI-powered smart study companion and tutor for students to ask questions and get explanations.
    -   **Mwalimu AI Assistant**: An AI tool for teachers to help with planning class notes, summarizing learning materials, and generating lesson plan ideas.
    -   (Future) AI for personalized learning path generation.

-   **Parental Features**:
    -   Parents can register and link to their child's account using the child's unique student ID.
    -   View child's assignments, submission status, and grades.
    -   Monitor child's attendance records and exam results.

-   **User Interface & Experience**:
    -   Support for Light and Dark mode themes.
    -   Responsive, mobile-first design with intuitive navigation (e.g., hamburger menus on mobile).
    -   Clean and user-friendly interface for all roles.

-   **General Site Pages**:
    -   Homepage with sections: Hero, How It Works, About Us, Testimonials, Contact Us.
    -   Dedicated About Us and Contact Us pages.
    -   Privacy Policy and Terms of Service pages.

## Color Schemes

Learnify utilizes a modern and clean user interface with distinct color schemes for different themes (light and dark). Specific color palettes are defined within the application's styling configurations.

## User Flow

Here's a general overview of the user flow for different roles:

### Admin
1.  Sign up or Login to the admin dashboard.
2.  On first login (if no school associated): Create a new school or join an existing one. Manage school settings (name, invite code, define subjects, exam mode).
3.  Manage users (add teachers/students, approve pending users, edit roles).
4.  Manage classes (create main/subject classes, assign teachers, enroll students, set compulsory subjects).
5.  Manage exam periods (create, assign to classes, monitor result submission, finalize).
6.  View school-wide attendance and overall platform activity/reports.
7.  Update personal profile.

### Teacher
1.  Sign up (providing school ID if not admin-created) or Login. Await admin approval if self-registered.
2.  View assigned classes on the dashboard.
3.  Upload and manage learning materials for their classes/subjects.
4.  Create, assign, and grade assignments for their classes.
5.  Record student attendance for assigned classes.
6.  Enter student results during active exam periods.
7.  Utilize Mwalimu AI for lesson planning and material summarization.
8.  Monitor student progress (future feature enhancement) and view activity feeds.
9.  Update personal profile.

### Student
1.  Sign up (providing school ID) or Login. Await admin approval if self-registered.
2.  On first login (if no classes assigned): Complete onboarding by selecting main class and subjects.
3.  View enrolled classes and access learning materials.
4.  View assignments, submit work, and check grades/feedback.
5.  Track their attendance and exam results.
6.  Interact with Akili AI chatbot for study help.
7.  View relevant activity feeds.
8.  Update personal profile.

### Parent
1.  Sign up or Login to the parent dashboard.
2.  Link to their child's account using the student's ID.
3.  Monitor their child's assignments (status, grades, feedback).
4.  View their child's attendance record.
5.  Track their child's exam results and overall progress.
6.  Update personal profile.

## Contact Information

For any inquiries, please contact us at: **learnifyke@gmail.com**
Phone: **+254794830280**
