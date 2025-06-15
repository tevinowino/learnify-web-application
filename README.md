
# Learnify: AI-Powered Educational Platform

Learnify is a comprehensive, AI-enhanced educational platform designed to streamline academic processes and foster a more personalized and effective learning environment for administrators, teachers, students, and parents.

## Table of Contents

1.  [Core Features](#core-features)
    *   [Platform-Wide](#platform-wide)
    *   [Admin Role](#admin-role)
    *   [Teacher Role](#teacher-role)
    *   [Student Role](#student-role)
    *   [Parent Role](#parent-role)
2.  [AI Integration Deep Dive](#ai-integration-deep-dive)
    *   [Akili AI Chatbot (For Students)](#akili-ai-chatbot-for-students)
    *   [Mwalimu AI Assistant (For Teachers)](#mwalimu-ai-assistant-for-teachers)
    *   [Personalized Learning Path Generation (For Students)](#personalized-learning-path-generation-for-students)
    *   [Student Performance Analysis (For Admins/Teachers)](#student-performance-analysis-for-adminsteachers)
    *   [Report Card AI Analysis (For Students/Parents)](#report-card-ai-analysis-for-studentsparents)
3.  [Technology Stack](#technology-stack)
4.  [User Flow (Detailed)](#user-flow-detailed)
    *   [Admin Flow](#admin-flow)
    *   [Teacher Flow](#teacher-flow)
    *   [Student Flow](#student-flow)
    *   [Parent Flow](#parent-flow)
5.  [Data Seeding for Testing](#data-seeding-for-testing)
6.  [Getting Started (Local Development)](#getting-started-local-development)
7.  [Color Schemes](#color-schemes)
8.  [Contact Information](#contact-information)

## Core Features

Learnify offers a rich set of features tailored to enhance the educational experience for every user type.

### Platform-Wide

*   **Secure User Authentication & Role-Based Access:** Robust login and registration system ensuring users only access features relevant to their roles (Admin, Teacher, Student, Parent).
*   **Light & Dark Mode Themes:** User-selectable themes for personalized and comfortable viewing, adapting to system preferences or manual selection.
*   **Responsive, Mobile-First Design:** Fully accessible and functional on desktops, tablets, and mobile devices.
*   **Intuitive Navigation:** Clean and easy-to-understand navigation structure, including dynamic sidebars for dashboard sections and hamburger menus on mobile.
*   **Real-time Pop-up Notifications:** In-app toast notifications for key events such as new assignments, admin approvals, submissions, and new learning materials relevant to the user.
*   **Activity Feeds:** Tailored activity feeds for each user role, showing recent and relevant updates within their school or classes.
*   **General Site Pages:**
    *   **Homepage:** Engaging landing page with a Hero section, "Why Learnify?" (problem/solution), "Features," "Why We Set Learnify Apart," Testimonials, and "Get Started/Contact" CTAs.
    *   **About Us:** Information about Learnify's mission, vision, and team.
    *   **Contact Us:** A dedicated page with contact information and a form to send messages.
    *   **Privacy Policy & Terms of Service:** Standard legal pages.
*   **Cloudinary Integration:** Robust and secure file uploads for learning materials (PDFs by teachers) and student assignment submissions (various formats).
*   **EmailJS Integration:** System for email notifications for critical actions and communication (user registration, approvals, new assignments, graded work, etc.). *Note: Requires user setup of EmailJS templates.*

### Admin Role

*   **Onboarding & School Setup:**
    *   **Admin Onboarding Flow:** Multi-step process including:
        1.  Creating the school profile (name, type, location).
        2.  Adding initial subjects offered.
        3.  Creating initial classes (main and subject-based).
        4.  Optionally inviting initial teachers and students.
        5.  Configuring initial school settings (e.g., exam mode).
    *   **Join Existing School (Alternative):** Option to join an existing school using an invite code if not already associated with one through the main onboarding.
*   **School Management:**
    *   **View & Edit School Name:** The admin who created the school can modify its name.
    *   **Regenerate Invite Code:** Generate a new unique invite code for the school to share with prospective users.
    *   **Exam Mode Toggle:** Activate or deactivate a school-wide "Exam Mode" to control teachers' ability to enter and edit exam results.
    *   **Subject Management:** Define, create, edit, and delete subjects offered by the school (e.g., Mathematics, History).
*   **User Management:**
    *   **Add New Users:** Directly add new teachers and students to the school, assigning their roles and initial credentials.
    *   **View User Lists:** Access a comprehensive, filterable (by name, email, role, status), and searchable list of all users within their school, organized into tabs (Active, Pending, Other).
    *   **Manage Pending Verifications:** Review and manage requests from teachers and students who signed up using the school ID and require admin approval.
    *   **Approve/Reject Users:** Approve or reject pending user verification requests. Approved users become active; rejected users' status changes.
    *   **Edit User Details:** Modify display names and assign/change roles for non-admin users within their school. Cannot change own admin role or other admins.
*   **Class Management:**
    *   **Create Classes:** Establish new classes, specifying them as 'main' (e.g., Form 2A - a homeroom) or 'subject-based' (e.g., History - Form 2).
    *   **Assign Teachers:** Link a Class Teacher to main classes and Subject Teachers to subject-based classes.
    *   **Compulsory Subjects:** Designate subjects (e.g., Mathematics, English) as compulsory for main classes.
    *   **View Class Lists:** See a list of all classes, their types, assigned teachers, student enrollment counts, and invite codes.
    *   **Manage Enrollment:** Manually enroll or remove students from any class.
    *   **Edit Class Details:** Modify class names, assigned teachers, class types, and associated subjects (compulsory for main, single for subject-based).
    *   **Regenerate Class Invite Codes:** Create new invite codes specific to individual classes for students to join.
    *   **Delete Classes:** Remove classes, which also archives associated assignments and unenrolls students.
*   **Exam & Results Management:**
    *   **Create Exam Periods:** Define exam periods (e.g., Mid-Term Exams, End-Term Exams) with specific start and end dates, name, and scope (specific classes, form/grade, or entire school).
    *   **Assign to Classes:** Link created exam periods to relevant classes based on the chosen scope.
    *   **Monitor Result Submission:** Track the progress of result entry by teachers for ongoing exam periods per class and subject.
    *   **Finalize Exam Periods:** Lock exam results from further editing and make them visible to students and parents. This action publishes the results.
    *   **Edit Upcoming Periods:** Modify details of exam periods (name, dates, scope, assigned classes, status) that have not yet been completed.
    *   **View Results Sheets:** Access consolidated, downloadable PDF results sheets per class for completed exam periods.
*   **Attendance Tracking:**
    *   **View School-Wide Records:** Access attendance records for any class within the school, filterable by date.
*   **Admin Dashboard:**
    *   **Key Statistics:** Overview of total user count, teacher count, student count, and class count.
    *   **Activity Feed:** Displays recent platform-wide and school-specific activities.
*   **Profile Management:**
    *   Admins can update their personal display name, email address, and password.
*   **Testimonial Management:** (Specific admins) Approve or unapprove user-submitted testimonials for public display.

### Teacher Role

*   **Onboarding:**
    *   Teachers register by providing their school's unique ID; their account then requires admin approval.
*   **Teacher Dashboard:**
    *   **Overview:** Quick view of assigned classes, summary of upcoming assignment deadlines, and counts of uploaded learning materials and created assignments.
    *   **Mwalimu AI Assistant Access:** Direct access to the AI tool for lesson planning, material summarization, and generating teaching ideas.
    *   **Activity Feed:** Shows recent activities relevant to their classes, students, and actions.
*   **Class Management:**
    *   **View Assigned Classes:** Access detailed information for each assigned class, including student rosters, materials, and assignments.
*   **Learning Materials Management:**
    *   **Upload Materials:** Upload various learning resources: text notes, external web links, video links, PDF links, and direct PDF file uploads (via Cloudinary).
    *   **Assign Materials:** Link materials to specific classes and subjects, or designate them as general school-wide resources.
    *   **Manage Own Materials:** View, edit (title, content, type, class/subject assignment), and delete their own uploaded learning materials.
*   **Assignment Management:**
    *   **Create Assignments:** Develop text-based assignments with titles, detailed descriptions, deadlines, and specify allowed student submission formats (text entry, file link, or file upload). No direct file attachment for assignment creation itself.
    *   **Link to Subjects:** Associate assignments with specific subjects for better organization.
    *   **View Assignments:** See a list of all created assignments, filterable by class, showing title, class, subject, deadline, and submission count.
    *   **Review Submissions:** View student submissions for each assignment, including names, submission times, and submitted content (text, link, or downloadable file).
    *   **Download Submissions:** Download student-submitted files if applicable.
    *   **Grade Assignments:** Provide marks/grades and textual feedback for student submissions via a dialog.
    *   **Edit/Delete Assignments:** Modify or remove their created assignments (deleting also removes related student submissions).
*   **Attendance Tracking:**
    *   **Mark Daily Attendance:** Record and submit daily attendance (Present, Absent) for students in their assigned main classes.
*   **Exam & Results Management:**
    *   **Enter Results:** Input student marks and remarks for the subjects they teach within assigned classes, specifically during an "active" or "grading" exam period where school-wide "Exam Mode" is active.
*   **Profile Management:**
    *   Teachers can update their personal display name, email address, and password.
*   **Student Profiles:** View detailed profiles of students in their classes.

### Student Role

*   **Onboarding:**
    *   Students register by providing their school's unique ID; admin approval is required.
    *   **Post-Approval Onboarding:** Complete a process to select their main class from a school-provided list. Compulsory subjects for this class are automatically assigned.
    *   **Elective Subjects:** Select additional elective subjects offered by the school.
*   **Student Dashboard:**
    *   **Overview:** View enrolled classes, list of upcoming assignment deadlines, and count of available learning resources.
    *   **Akili AI Chatbot Access:** Utilize the AI tutor for study help and asking questions on various topics.
    *   **Activity Feed:** See recent activities relevant to their classes and school-wide announcements.
*   **Class Management:**
    *   **View Enrolled Classes:** Access a list of their enrolled classes (main and subject-based) and view class-specific details (materials, assignments).
    *   **Join Additional Classes:** Enroll in subject-based classes using class-specific invite codes.
*   **Learning Materials Access:**
    *   **Browse & Search:** Access learning materials relevant to their enrolled classes and general school resources. Filter materials by title, content, teacher, class, or subject.
    *   **Download Materials:** Download uploaded PDF materials.
*   **Assignment Submission:**
    *   **View Assignments:** See details of assigned tasks, including instructions, deadlines, and submission status.
    *   **Submit Work:** Submit assignments in the formats allowed by the teacher (text entry, file link, or file upload via Cloudinary).
    *   **Track Status:** View their submission status (submitted, late, graded, missing).
    *   **View Feedback:** Access grades and teacher feedback once an assignment is graded.
*   **Exam Results:**
    *   **View Published Results:** See their exam results, including marks and teacher remarks for each subject, organized by exam period, once finalized by an admin.
    *   **View Report Card:** Access a downloadable PDF report card for completed exam periods, including an AI-generated performance overview.
*   **Attendance:**
    *   **View Own Records:** Access their personal attendance records, filterable by date range.
*   **Personalized Learning Path:**
    *   **Generate AI Paths:** Create AI-powered personalized learning paths for their enrolled subjects by providing their current understanding level and specific learning goals.
*   **Profile Management:**
    *   **Update Display Name:** Students can change their display name.
    *   **View Student ID:** Access their unique Student ID (useful for parents linking accounts).
*   **Testimonial Submission:** Optionally submit testimonials about their experience with Learnify.

### Parent Role

*   **Onboarding & Child Linking:**
    *   **Register Account:** Create a parent account on Learnify.
    *   **Link Child:** Connect their account to their child's student account using the child's unique Student ID. The parent account becomes active and associated with the child's school upon successful linking.
*   **Parent Dashboard:**
    *   **Child's Academic Overview:** A summary of the linked child's key academic information.
    *   **Quick Stats:** Counts of the child's upcoming assignments, recently graded results.
    *   **Attendance Summary:** Highlights any attendance issues (e.g., absences/lates in the last 7 days).
    *   **Activity Feed:** Displays activities specific to their child's actions and relevant school/class updates.
*   **Child's Academic Monitoring:**
    *   **View Assignments:** Detailed list of their child's assignments, including submission status and grades.
    *   **View Exam Results:** Access their child's detailed exam results and teacher remarks for finalized exam periods. Includes access to the child's downloadable PDF report card.
    *   **View Attendance Records:** See their child's attendance records, filterable by date range.
*   **Profile Management:**
    *   Parents can update their personal display name, email address, and password.
    *   Option to re-link or link to a different child's account if needed.
*   **Testimonial Submission:** Optionally submit testimonials about their experience with Learnify.

## AI Integration Deep Dive

Learnify leverages Generative AI (via Google's Gemini models through Genkit) to provide intelligent assistance.

### Akili AI Chatbot (For Students)

*   **Purpose:** Akili serves as a smart study companion and AI tutor directly accessible from the student dashboard.
*   **Functionality:**
    *   **Question Answering:** Students can ask Akili questions about various academic topics, concepts, or homework problems.
    *   **Explanations:** Akili provides clear and concise explanations, breaking down complex subjects into understandable parts.
    *   **Resource Suggestion:** When appropriate, Akili can suggest types of learning materials or study approaches relevant to the student's query.
    *   **Encouraging Tone:** Akili is designed to maintain a patient and encouraging tone to support student learning.
    *   **Focus Redirection:** If a student asks for information outside of educational topics, Akili gently guides them back to study-related subjects.
*   **Interaction:** Students type their messages, and Akili responds in a conversational manner.

### Mwalimu AI Assistant (For Teachers)

*   **Purpose:** Mwalimu is an AI tool designed to assist teachers with various pedagogical and administrative tasks, accessible from the teacher dashboard.
*   **Key Capabilities:**
    *   **Lesson Planning:**
        *   Teachers can request lesson plans for specific topics and grade levels.
        *   Mwalimu provides structured outlines including: Topic, Learning Objectives (SMART), Materials Needed, Step-by-Step Activities, Assessment Methods, and Differentiation strategies.
    *   **Summarizing Learning Materials:**
        *   Teachers can provide text (e.g., from an article or textbook chapter), and Mwalimu will generate a concise summary, extracting key concepts, definitions, and important takeaways.
    *   **Generating Ideas:**
        *   Mwalimu can brainstorm and suggest creative teaching ideas, classroom activities, discussion prompts, or project assignments based on a given topic or learning objective.
    *   **Drafting Class Notes:**
        *   Assists in outlining or drafting class notes, ensuring clarity and logical flow.
*   **Interaction:** Teachers interact via a chat interface. Mwalimu aims for structured, actionable responses and may ask clarifying questions to refine requests. It uses markdown for formatting to enhance readability.

### Personalized Learning Path Generation (For Students)

*   **Purpose:** Empowers students to take control of their learning by generating tailored study plans.
*   **Process:**
    1.  **Input:** Students select an enrolled subject, describe their current understanding (strengths/weaknesses), and state their specific learning goals for that subject. Optionally, they can include context from their teacher (e.g., curriculum overview).
    2.  **AI Generation:** The AI processes this input.
    3.  **Output:** Learnify presents a personalized learning path. This path typically includes:
        *   Identification of key concepts to focus on.
        *   Breakdown of complex topics into manageable steps.
        *   A logical sequence for learning topics.
        *   Recommendations for types of resources or activities for each step (e.g., "Read chapter X," "Watch a video on Y," "Practice Z exercises").
        *   Encouraging and motivating language.
        *   Clear formatting (e.g., headings, bullet points) for easy readability.
*   **Access:** Students can generate these paths from their "Progress" or "Learning Path" section in their dashboard.

### Student Performance Analysis (For Admins/Teachers)
*   **Purpose:** Provides an AI-driven overview of a student's performance based on exam and assignment data.
*   **Functionality:** Admins and teachers can trigger an analysis for a specific student from their profile page. The AI generates:
    *   Identified academic strengths.
    *   Constructive areas for improvement.
    *   Actionable recommendations for the student, parents, or teachers.
    *   A concise overall summary.
*   **Access:** Available on student profile pages for authorized users.

### Report Card AI Analysis (For Students/Parents)
*   **Purpose:** Generates a brief, encouraging AI overview for individual student report cards.
*   **Functionality:** When a student or parent views a finalized report card, a concise AI-generated summary (2-3 sentences) is displayed, highlighting a key strength and a potential area for focus.
*   **Access:** Integrated into the student's downloadable PDF report card.

## Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **State Management:** React Context API (via custom hooks like `useAuth`)
*   **Backend (BaaS):** Firebase (Firestore for database, Firebase Authentication, Firebase Storage for some static assets if not using Cloudinary exclusively).
*   **AI Integration:** Genkit, Google Gemini Models
*   **File Uploads:** Cloudinary
*   **Email Notifications:** EmailJS
*   **PDF Generation:** html2pdf.js
*   **Development Tools:** pnpm (package manager), ESLint, Prettier (assumed for code quality).

## User Flow (Detailed)

### Admin Flow

1.  **Sign Up/Login:**
    *   Registers an account or logs in.
    *   If new and not associated with a school, proceeds to **Admin Onboarding**.
2.  **Admin Onboarding (if applicable):**
    *   Follows a multi-step flow:
        1.  **Create School Profile:** Enters school name, type, country, phone.
        2.  **Add Subjects:** Defines initial subjects offered by the school.
        3.  **Create Classes:** Sets up initial main and subject-based classes.
        4.  **Invite Users (Optional):** Sends out initial invitations to teachers and students.
        5.  **Configure Settings:** Sets initial school-wide configurations (e.g., Exam Mode).
    *   Alternatively, can choose to **Join an Existing School** (enters school's invite code).
    *   Upon successful school association/creation, redirected to Admin Dashboard.
3.  **Admin Dashboard:**
    *   Views key school statistics (user counts, class counts).
    *   Sees a feed of recent platform activities.
    *   Navigates to various management sections via sidebar.
4.  **School Settings (General):**
    *   Accesses via `Admin Dashboard -> School Configuration -> General School Settings`.
    *   Views school ID and creation date.
    *   If creator admin, can edit the school name.
    *   Views current school invite code and can copy it.
    *   If creator admin, can regenerate the school invite code.
    *   If creator admin, can toggle school-wide "Exam Mode."
5.  **Subject Management:**
    *   Accesses via `Admin Dashboard -> School Configuration -> Manage Subjects`.
    *   Views list of existing subjects.
    *   Creates new subjects (e.g., "Mathematics").
    *   Edits names of existing subjects.
    *   Deletes subjects (with confirmation).
6.  **User Management:**
    *   Accesses via `Admin Dashboard -> Manage Users`.
    *   Views tabs for "Active Users," "Pending Verification," and "Other Statuses."
    *   **Active Users:**
        *   Filters list by name/email or role.
        *   Can edit user's display name and role (cannot change own admin role or other admins).
    *   **Pending Verification:**
        *   Views users awaiting approval.
        *   Approves or rejects user requests. Approved users become active; rejected users' status changes.
    *   **Add New User:** Clicks "Add New User" button, fills out form (name, email, initial password, role - Teacher/Student), and creates the account directly within their school.
7.  **Class Management:**
    *   Accesses via `Admin Dashboard -> Manage Classes`.
    *   Views a list of all created classes with details (name, type, teacher, student count, invite code).
    *   **Create New Class:** Clicks "Create New Class."
        *   Enters class name.
        *   Selects class type ('main' or 'subject-based').
        *   If 'main', can select compulsory subjects from school's subject list.
        *   If 'subject-based', selects the specific subject for the class.
        *   Optionally assigns a teacher from the school's teacher list.
    *   **Edit Class:** For an existing class:
        *   Modifies name, assigned teacher, class type, compulsory/assigned subjects.
        *   Regenerates class-specific invite code.
    *   **Manage Students (for a class):**
        *   Views enrolled students.
        *   Removes students from the class.
        *   Views available students (not in this class) and enrolls them.
    *   **Delete Class:** Removes the class (with confirmation), also removing associated assignments and enrollments.
8.  **Exam Management:**
    *   Accesses via `Admin Dashboard -> Exam Management`.
    *   Views list of existing exam periods.
    *   **Create Exam Period:** Clicks "Create Exam Period."
        *   Enters name (e.g., "Mid-Term Form 1").
        *   Sets start and end dates.
        *   Selects assignment scope (specific classes, form/grade, entire school).
        *   Assigns the exam period to one or more classes based on scope.
    *   **View Exam Period Details:** Clicks on an exam period.
        *   Sees overview, dates, assigned classes, status.
        *   Monitors result submission progress per class/subject.
        *   If the period is "upcoming," can edit its details (name, dates, scope, classes, status). Status can be changed if not 'completed'.
        *   If the period is "active" or "grading" and past its end date, can **Finalize** it (locks results, makes visible to students/parents).
    *   **View Results Sheets:** For 'completed' periods, can view/download consolidated PDF results sheets.
9.  **Attendance:**
    *   Accesses via `Admin Dashboard -> View Attendance Records`.
    *   Selects a class and a date range to view attendance records in a table format.
10. **Profile Management:**
    *   Accesses via sidebar.
    *   Updates personal display name, email, and password.
11. **Testimonial Management:**
    *   (For super admins) Accesses via `Admin Dashboard -> Testimonials`.
    *   Reviews, approves, or unapproves user-submitted testimonials.

### Teacher Flow

1.  **Sign Up/Login:**
    *   **Sign Up:** Enters email, password, display name, selects "Teacher" role, and provides the School ID. Account status becomes "pending\_verification."
    *   **Login:** Enters credentials. If approved, proceeds to dashboard.
2.  **Teacher Dashboard:**
    *   Views assigned classes, upcoming assignment deadlines, counts of materials/assignments.
    *   Accesses **Mwalimu AI Assistant** for lesson planning, summarization, or idea generation via a chat interface.
    *   Sees relevant activity feed.
3.  **My Classes:**
    *   Navigates to `My Classes` section.
    *   Views a list of classes they are assigned to (either as main class teacher or subject teacher).
    *   Selects a class to view its details: student roster, materials, assignments.
4.  **Learning Materials Management:**
    *   Navigates to `Manage Materials` or creates from within a specific class view.
    *   **Uploads Materials:**
        *   Provides title, content (text or URL), and selects material type (text, link, video link, PDF link, PDF upload).
        *   If PDF upload, selects file from device (uploaded to Cloudinary).
        *   Assigns material to one of their classes OR marks as general school-wide.
        *   Optionally assigns to a specific subject.
    *   Views, edits details (title, content, type, class/subject assignment), or deletes their own uploaded materials.
5.  **Assignment Management:**
    *   Navigates to `Manage Assignments` or creates from within a specific class view.
    *   **Create Assignment:**
        *   Provides title, detailed description/instructions (text-based).
        *   Sets a deadline (date and time).
        *   Assigns to one of their classes.
        *   Optionally links to a specific subject.
        *   Specifies allowed submission formats for students (text entry, file link, file upload).
    *   **View/Grade Submissions:**
        *   Selects an assignment to view its details and student submissions in a table.
        *   Sees list of students, submission times, and content.
        *   Downloads student-submitted files (if any).
        *   Enters marks/grades and textual feedback for each submission via a dialog. Saves the grade.
    *   Edits details or deletes their created assignments (with confirmation).
6.  **Attendance Tracking:**
    *   Navigates to `Attendance` section.
    *   Selects one of their assigned main classes and a date.
    *   For each student in the list (table format), marks them as "Present" or "Absent".
    *   Submits the attendance for the selected class and date.
7.  **Exam Results Entry:**
    *   Navigates to `Enter Exam Results`.
    *   Selects an active/grading exam period, one of their assigned classes for that period, and a subject they teach to that class.
    *   For each student in the class list (table format), enters marks and optional remarks for the selected subject.
    *   Saves the results. (This is only possible if school-wide "Exam Mode" is active and the exam period is 'active' or 'grading').
8.  **Profile Management:**
    *   Updates personal display name, email, and password.

### Student Flow

1.  **Sign Up/Login:**
    *   **Sign Up:** Enters email, password, display name, selects "Student" role, and provides the School ID. Account status becomes "pending\_verification."
    *   **Login:** Enters credentials. If approved and onboarded, proceeds to dashboard. If approved but not onboarded, proceeds to onboarding.
2.  **Onboarding (if new & approved, or not yet completed):**
    *   Selects their main class from a list of available main classes in their school.
    *   Compulsory subjects for the selected main class are displayed and automatically assigned.
    *   Selects additional elective subjects from the school's subject list.
    *   Completes onboarding and is redirected to the Student Dashboard.
3.  **Student Dashboard:**
    *   Views enrolled classes, upcoming assignment deadlines, count of available learning resources.
    *   Accesses **Akili AI Chatbot** for study help via a chat interface.
    *   Sees relevant activity feed (e.g., new assignments for their classes, new materials).
4.  **My Classes:**
    *   Navigates to `My Classes`.
    *   Views a list of all classes they are enrolled in (main and subject-based).
    *   Selects a class to view its specific materials and assignments (table format for assignments).
    *   **Join New Class:** Can use a class-specific invite code (typically for subject-based electives) to join additional classes.
5.  **Learning Resources:**
    *   Navigates to `Learning Resources`.
    *   Browses, searches (by title, content, teacher), and filters (by class, subject) all accessible materials (general school resources and those for their enrolled classes).
    *   Views material details. Downloads PDF materials.
6.  **Assignments:**
    *   Navigates to `My Assignments`.
    *   Views a list of all their assignments, filterable by class and status (missing, submitted, graded, late).
    *   Selects an assignment to view its details, instructions, and deadline.
    *   **Submit Work:** If not yet submitted or if resubmission is allowed:
        *   Chooses submission format if multiple are allowed (text, link, file upload).
        *   Enters text directly, provides a URL, or uploads a file (via Cloudinary).
        *   Submits the assignment.
    *   Views their submission status, grades, and teacher feedback once available.
7.  **Exam Results:**
    *   Navigates to `My Exam Results`.
    *   Views their published exam results (marks and teacher remarks for each subject) organized by exam period in a table format within accordions.
    *   Can view/download a PDF Report Card for completed exam periods, which includes an AI-generated performance summary.
8.  **Attendance:**
    *   Navigates to `My Attendance`.
    *   Selects a date range to view their own attendance records in a table format.
9.  **Personalized Learning Path (Progress):**
    *   Navigates to `My Progress` (or similar section).
    *   Selects an enrolled subject.
    *   Enters their current understanding/challenges for that subject.
    *   Enters their learning goals for that subject.
    *   Submits the form to generate an AI-powered personalized learning path with suggested topics and resources.
10. **Profile Management:**
    *   Updates personal display name.
    *   Views their unique Student ID (for sharing with parents) and can copy it.
11. **Testimonial Submission:**
    *   May be prompted to submit a testimonial about their Learnify experience.

### Parent Flow

1.  **Sign Up/Login:**
    *   **Sign Up:** Enters email, password, display name, selects "Parent" role.
    *   **Login:** Enters credentials.
2.  **Link Child Account (if not already linked, or from profile):**
    *   Navigates to "Link Child" page (often prompted after signup or accessible from profile).
    *   Enters their child's unique Student ID.
    *   Upon successful linking, the parent account is associated with the child's school, and they can access relevant data.
3.  **Parent Dashboard (after linking child):**
    *   Views an overview of their child's academic information.
    *   Sees counts of upcoming assignments and recently graded results for the child.
    *   Gets a summary of the child's attendance (e.g., issues in the last 7 days).
    *   Sees an activity feed specific to their child's actions and relevant school/class updates.
4.  **Child's Assignments:**
    *   Navigates to view their child's assignments.
    *   Sees a list of their child's assignments, including status (submitted, graded, missing, late), and grades if available.
5.  **Child's Exam Results:**
    *   Navigates to view their child's exam results.
    *   Sees detailed exam results (marks, remarks per subject) for finalized exam periods, in a table format within accordions.
    *   Can view/download the child's PDF Report Card for completed exam periods, including AI analysis.
6.  **Child's Attendance:**
    *   Navigates to view their child's attendance.
    *   Selects a date range to view attendance records in a table format.
7.  **Profile Management:**
    *   Updates personal display name, email, and password.
    *   Manages the linked child account (e.g., re-link if necessary).
8.  **Testimonial Submission:**
    *   May be prompted to submit a testimonial about their Learnify experience.

## Data Seeding for Testing

To facilitate comprehensive testing, Learnify includes a data seeder script. This script uses `@faker-js/faker` and `firebase-admin` to populate your Firestore database and Firebase Authentication with realistic mock data.

*   **Purpose:** Create a varied dataset of schools, users (admins, teachers, students, parents), classes, subjects, learning materials, assignments, submissions, exam periods, results, and attendance records.
*   **How to Use:**
    1.  Ensure you have set up Firebase Admin SDK credentials (see `scripts/README.md`).
    2.  Customize the configuration constants at the top of `scripts/seed.ts` to control the amount of data.
    3.  Run `pnpm seed` from the project root.
*   **Important:** Always run the seeder on a development or staging Firebase project, NOT production.
*   For detailed instructions, refer to `scripts/README.md`.

## Getting Started (Local Development)

1.  **Prerequisites:**
    *   Node.js (v18 or later recommended)
    *   pnpm (package manager)
    *   A Firebase project
    *   Cloudinary account (for file uploads)
    *   EmailJS account (for email notifications)
2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/tevinowino/learnify-web-application.git
    cd learnify-web-application
    ```
3.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
4.  **Set Up Environment Variables:**
    *   Create a `.env` file in the root of the project.
    *   Populate it with your Firebase project configuration, Cloudinary details, and EmailJS credentials. Refer to `.env.example` (if provided) or the required variables mentioned in service files (e.g., `src/lib/firebase.ts`, `src/services/fileUploadService.ts`, `src/actions/emailActions.ts`).
    *   Example Firebase variables:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
        NEXT_PUBLIC_FIREBASE_APP_ID=1:...
        FIREBASE_SERVICE_ACCOUNT_JSON_STRING="{\\"type\\": \\"service_account\\", ...}" # For seeder script (stringified JSON)
        ```
    *   Example Cloudinary variables:
        ```
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
        ```
    *   Example EmailJS variables:
        ```
        NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
        NEXT_PUBLIC_EMAILJS_USER_ID=your_public_key # User ID / Public Key
        NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID=your_contact_form_template_id
        NEXT_PUBLIC_EMAILJS_NOTIFICATION_TEMPLATE_ID=your_general_notification_template_id
        # Add other template IDs as needed
        ```
5.  **Set Up Firebase Admin SDK (for Seeder - Optional but Recommended for Testing):**
    *   Follow instructions in `scripts/README.md` to download your service account key and set `GOOGLE_APPLICATION_CREDENTIALS` or preferably `FIREBASE_SERVICE_ACCOUNT_JSON_STRING`.
6.  **Run the Development Server:**
    *   For the Next.js app:
        ```bash
        pnpm dev
        ```
    *   For Genkit flows (in a separate terminal, if you need to test/debug flows locally):
        ```bash
        pnpm genkit:dev
        # or
        pnpm genkit:watch
        ```
7.  **Seed Data (Optional):**
    *   If you want to populate your database for testing:
        ```bash
        pnpm seed
        ```

## Color Schemes

Learnify utilizes a modern and clean user interface with distinct color schemes for different themes (light and dark). Specific color palettes are defined within the application's styling configurations (`src/app/globals.css`) using CSS variables for easy theming and customization. Primary color is purple, with teal as an accent.

## Contact Information

For any inquiries, please contact us at:
**Email:** learnifyke@gmail.com
**Phone:** +254794830280
