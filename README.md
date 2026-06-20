# EduPortal BD — Campus Management SaaS

> A full-stack MERN web application and SaaS platform for university campus management.  
> Built for Patuakhali Science and Technology University (PSTU) as the pilot institution.

**Live Demo:** [https://pstu-client.onrender.com/](https://pstu-client.onrender.com/)  
**Backend API:** [https://pstu-campus-portal-api.onrender.com](https://pstu-campus-portal-api.onrender.com)

---

## Table of Contents

- [Overview](#overview)
- [SaaS Model](#saas-model)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Business Model](#business-model)

---

## Overview

EduPortal BD is a subscription-based SaaS platform that allows any Bangladeshi university to digitize their campus management. PSTU is the pilot/first tenant. The platform supports three roles — **Admin**, **Teacher**, and **Student** — each with role-specific dashboards and features.

---

## SaaS Model

| Page | URL | Description |
|------|-----|-------------|
| Marketing Landing | `/` (unauthenticated) | Product homepage for universities |
| Pricing | `/pricing` | Subscription tier comparison |
| Institution Register | `/institution/register` | University onboarding form |
| Institutions List | `/superadmin/institutions` | Platform admin — all tenants |

**Pricing Tiers:**

| Plan | Price | Students |
|------|-------|----------|
| Starter | ৳3,000/month | ≤ 500 |
| Pro | ৳8,000/month | ≤ 3,000 |
| Enterprise | Custom | Unlimited |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (CRA), Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (7-day expiry), Google OAuth 2.0 |
| Email | Brevo HTTP API (SMTP-free, port 443) |
| File Upload | Cloudinary (profile photos) |
| Payment | SSLCommerz |
| Deployment | Render.com (backend Web Service + frontend Static Site) |
| Icons | React Icons (Feather `fi` set) |
| Notifications | React Toastify |

---

## Features

### Authentication
- Email/password login with JWT
- Email verification on registration (Brevo)
- **Forgot Password** — 6-digit OTP sent via email, 10-minute expiry
- **Google Sign-In / Sign-Up** — ID token verification via `google-auth-library`
- Role-based route protection (Admin / Teacher / Student)

### Admin
- **Dashboard** — live stats (students, teachers, faculties, courses, grades, results), recent registrations
- **User Management** — paginated list, search, role filter, activate/deactivate, edit student semester
- **Course Management** — CRUD for courses with faculty assignment
- **Faculty Management** — CRUD for faculties
- **Payment Dashboard** — view all payments, filter by status
- **Audit Log** — timestamped log of all admin actions
- **Notice Board** — create, edit, delete notices with expiry date and faculty filter
- **Bus Schedule** — add/edit/delete bus routes with pickup/drop point editor
- **Phone Diary** — add/edit/delete contacts with category badges
- **Institutions** — platform-level institution list (Super Admin view)

### Teacher
- **Dashboard** — stats: students, courses, grades entered, draft/published
- **Overview Page** — notice carousel, teaching stats, publish progress, key contacts
- **Enter Marks** — semester → student → course workflow with GPA auto-calculation
- **Publish Results** — toggle semester results visible to students
- **Bulk CSV Import** — upload marks for multiple students at once
- **Students** — view students filtered by faculty and semester

### Student
- **Dashboard** — CGPA banner, enrolled/graded/completed course stats
- **Overview Page** — notice carousel, academic summary, quick links, bus preview
- **My Results** — semester-wise grade table with CGPA, downloadable marksheet (PDF)
- **Course Enrollment** — enroll in or drop courses
- **Fee Payment** — online payment via SSLCommerz with success/fail callbacks
- **Payment History** — list of all past payments

### Common (All Roles)
- **Notice Board** — read notices; admin can create/edit/delete
- **Bus Schedule** — view bus routes with pickup/drop stops; admin can manage
- **Phone Diary** — contact directory with Call/Email links; admin can manage
- **Notice Carousel** — auto-sliding animated notice widget on all dashboards and home page
- **Profile** — update name, phone, address, DOB, faculty, semester, profile photo (Cloudinary)
- **Change Password** — authenticated password update
- **Command Palette** — `Cmd+K` / `Ctrl+K` global search
- **Dark Mode** — toggle via header
- **Notifications** — in-app bell icon with notification center

### Public Pages (No login required)
- **Marketing Landing Page** — hero, features, how-it-works, pricing preview, CTA
- **Pricing Page** — full tier comparison, monthly/yearly toggle, FAQ
- **Institution Register** — university onboarding form with validation

---

## Project Structure

```
pstu-campus-portal/
├── client/                        # React frontend (CRA)
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── NoticeCarousel.jsx  # Reusable animated notice carousel
│       │   ├── CommandPalette.jsx
│       │   ├── shared/
│       │   │   ├── Modal.jsx
│       │   │   ├── Loading.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   └── ui/
│       │       ├── StatCard.jsx
│       │       └── ConfirmDialog.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── AppContext.jsx
│       │   └── ThemeContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useApp.js
│       ├── pages/
│       │   ├── Home.jsx            # Marketing landing + authenticated home
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   ├── ForgotPassword.jsx
│       │   │   └── VerifyEmail.jsx
│       │   ├── dashboard/
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── TeacherDashboard.jsx
│       │   │   └── StudentDashboard.jsx
│       │   ├── admin/
│       │   │   ├── UserManagement.jsx
│       │   │   ├── CourseManagement.jsx
│       │   │   ├── FacultyManagement.jsx
│       │   │   ├── AuditLog.jsx
│       │   │   └── PaymentDashboard.jsx
│       │   ├── teacher/
│       │   │   ├── TeacherOverview.jsx
│       │   │   ├── TeacherWorkflow.jsx
│       │   │   ├── ResultPublish.jsx
│       │   │   ├── BulkCSVImport.jsx
│       │   │   ├── Students.jsx
│       │   │   └── CourseGrading.jsx
│       │   ├── student/
│       │   │   ├── StudentOverview.jsx
│       │   │   ├── StudentResults.jsx
│       │   │   ├── CourseEnrollment.jsx
│       │   │   ├── PaymentGateway.jsx
│       │   │   └── PaymentHistory.jsx
│       │   ├── common/
│       │   │   ├── NoticeBoard.jsx
│       │   │   ├── BusSchedule.jsx
│       │   │   └── PhoneDiary.jsx
│       │   ├── public/
│       │   │   ├── Pricing.jsx
│       │   │   └── InstitutionRegister.jsx
│       │   ├── superadmin/
│       │   │   └── InstitutionList.jsx
│       │   └── profile/
│       │       ├── Profile.jsx
│       │       └── ChangePassword.jsx
│       └── services/
│           ├── api.js              # Axios instance with JWT interceptor
│           ├── authService.js
│           ├── userService.js
│           ├── adminService.js
│           ├── studentService.js
│           ├── teacherService.js
│           ├── courseService.js
│           ├── facultyService.js
│           ├── noticeService.js
│           ├── busService.js
│           └── phoneService.js
│
└── server/                        # Express backend
    ├── server.js
    ├── models/
    │   ├── User.js
    │   ├── Course.js
    │   ├── Faculty.js
    │   ├── Grade.js
    │   ├── Result.js
    │   ├── Enrollment.js
    │   ├── Notice.js
    │   ├── BusSchedule.js
    │   ├── PhoneDiary.js
    │   ├── Payment.js
    │   ├── AuditLog.js
    │   └── Notification.js
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── adminController.js
    │   ├── teacherController.js
    │   ├── studentController.js
    │   ├── courseController.js
    │   ├── gradeController.js
    │   ├── noticeController.js
    │   ├── busController.js
    │   └── phoneController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── adminRoutes.js
    │   ├── teacherRoutes.js
    │   ├── studentRoutes.js
    │   ├── courseRoutes.js
    │   ├── gradeRoutes.js
    │   ├── noticeRoutes.js
    │   ├── busRoutes.js
    │   └── phoneRoutes.js
    ├── middleware/
    │   └── auth.js                # JWT verify + role guard
    └── validations/
        ├── authSchemas.js
        ├── courseSchemas.js
        └── gradeSchemas.js
```

---

## Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/pstu-portal
JWT_SECRET=your_jwt_secret_here
BREVO_API_KEY=your_brevo_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
SSLCOMMERZ_STORE_ID=your_sslcommerz_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sslcommerz_password
CLIENT_URL=https://your-frontend.onrender.com
```

### Frontend (`client/.env`)

```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/SparksFlash/pstu-campus-portal.git
cd pstu-campus-portal

# 2. Backend setup
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev            # runs on http://localhost:5000

# 3. Frontend setup (new terminal)
cd client
npm install
cp .env.example .env   # fill in REACT_APP_API_URL=http://localhost:5000/api
npm start              # runs on http://localhost:3000
```

---

## Deployment

Both services deployed on **Render.com** free tier.

| Service | Type | Build Command | Start Command |
|---------|------|---------------|---------------|
| Backend | Web Service | `npm install` | `node server.js` |
| Frontend | Static Site | `npm install && npm run build` | — |

**Important:** Render free tier spins down after 15 min of inactivity. First request after sleep may take 30–60 seconds.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Send 6-digit OTP to email |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| POST | `/api/auth/google` | Google OAuth sign-in/up |
| GET | `/api/auth/verify/:token` | Verify email |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | Paginated user list |
| PATCH | `/api/admin/users/:id` | Update user (e.g. semester) |
| PATCH | `/api/admin/users/:id/toggle-active` | Activate/deactivate |
| GET | `/api/admin/audit-logs` | Audit trail |

### Notices / Bus / Phone
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notices` | All notices |
| GET | `/api/notices/latest` | Latest N notices (carousel) |
| POST | `/api/notices` | Create notice (admin) |
| PUT | `/api/notices/:id` | Update notice (admin) |
| DELETE | `/api/notices/:id` | Delete notice (admin) |
| GET | `/api/bus-schedule` | All bus routes |
| POST | `/api/bus-schedule` | Add route (admin) |
| PUT | `/api/bus-schedule/:id` | Update route (admin) |
| DELETE | `/api/bus-schedule/:id` | Delete route (admin) |
| GET | `/api/phone-diary` | All contacts |
| POST | `/api/phone-diary` | Add contact (admin) |
| PUT | `/api/phone-diary/:id` | Update contact (admin) |
| DELETE | `/api/phone-diary/:id` | Delete contact (admin) |

### Teacher
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/stats` | Teaching statistics |
| GET | `/api/teacher/students/semester/:sem` | Students by semester |
| POST | `/api/teacher/marks/enter` | Enter marks |
| POST | `/api/teacher/marks/bulk-csv` | Bulk CSV import |
| POST | `/api/teacher/publish/:sem` | Publish semester results |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | Dashboard stats |
| GET | `/api/student/results` | All results |
| POST | `/api/enrollments` | Enroll in course |

---

## Business Model

**Target market:** 150+ universities and colleges in Bangladesh.

**Revenue projection:**

| Clients | Plan | Monthly Revenue |
|---------|------|----------------|
| 30 × Starter | ৳3,000 | ৳90,000 |
| 20 × Pro | ৳8,000 | ৳1,60,000 |
| **Total (50 clients)** | | **৳2,50,000/month** |

**Value proposition:**
- Zero installation — runs on any device, any browser
- One platform for Admin, Teachers, and Students
- Cloud-hosted — no server maintenance for the university
- Affordable compared to custom software development (৳10–50 lakh one-time)

---

## Author

**Sourav** — CSE Student, PSTU  
Registration: 10183

GitHub: [@SparksFlash](https://github.com/SparksFlash)
