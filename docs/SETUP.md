# Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

## Installation Steps

### 1. Clone and Navigate to Server Directory
```bash
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pstu-web-app
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CLIENT_URL=http://localhost:3000
```

### 4. Ensure MongoDB is Running
For local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas connection string in `.env`

### 5. Seed Database (Optional but Recommended)
Run seeders to populate initial data:
```bash
# Create faculties
npm run seed:faculties

# Create admin user and sample data
npm run seed:admin
npm run seed:sample

# Or run all at once
npm run seed:all
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```
Server will run on `http://localhost:5000`

### Production Mode
```bash
npm start
```

## Testing the API

### 1. Test Health Check
```bash
curl http://localhost:5000/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student",
    "faculty": "<faculty_id_from_db>"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pstu.edu",
    "password": "Admin@123"
  }'
```

### 4. Get Profile (requires token)
After login, copy the token and use it:
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <your_token_here>"
```

## Default Credentials (After Seeding)
- **Admin**: email: `admin@pstu.edu`, password: `Admin@123`
- **Teacher**: email: `teacher@pstu.edu`, password: `Teacher@123`
- **Student**: email: `student@pstu.edu`, password: `Student@123`

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get profile (protected)

### Faculties
- `GET /api/faculties` - Get all faculties
- `GET /api/faculties/:id` - Get faculty by ID
- `POST /api/faculties` - Create faculty (admin only)
- `PUT /api/faculties/:id` - Update faculty (admin only)
- `DELETE /api/faculties/:id` - Delete faculty (admin only)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (teacher/admin)
- `PUT /api/courses/:id` - Update course (teacher/admin)
- `DELETE /api/courses/:id` - Delete course (admin)
- `POST /api/courses/:id/enroll` - Add student to course

### Grades
- `GET /api/grades` - Get all grades (teacher/admin)
- `GET /api/grades/student/:studentId` - Get student's grades
- `POST /api/grades` - Add/Update grade (teacher/admin)
- `PUT /api/grades/:id` - Update grade (teacher/admin)
- `DELETE /api/grades/:id` - Delete grade (teacher/admin)

### Results
- `GET /api/results` - Get all results (teacher/admin)
- `GET /api/results/student/:studentId` - Get student's results
- `POST /api/results/generate` - Generate result (teacher/admin)
- `PUT /api/results/:id` - Update result (teacher/admin)
- `DELETE /api/results/:id` - Delete result (admin)

### Notices
- `GET /api/notices` - Get all notices (public)
- `GET /api/notices/:id` - Get notice by ID
- `POST /api/notices` - Create notice (teacher/admin)
- `PUT /api/notices/:id` - Update notice (teacher/admin)
- `DELETE /api/notices/:id` - Delete notice (admin)

### Bus Schedule
- `GET /api/bus-schedule` - Get all bus schedules (public)
- `GET /api/bus-schedule/:id` - Get bus by ID
- `POST /api/bus-schedule` - Create bus (admin)
- `PUT /api/bus-schedule/:id` - Update bus (admin)
- `DELETE /api/bus-schedule/:id` - Delete bus (admin)

### Phone Directory
- `GET /api/phone-diary` - Get all contacts (public)
- `GET /api/phone-diary/:id` - Get contact by ID
- `POST /api/phone-diary` - Create contact (admin)
- `PUT /api/phone-diary/:id` - Update contact (admin)
- `DELETE /api/phone-diary/:id` - Delete contact (admin)

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`
- For MongoDB Atlas, verify IP whitelist

### Email Service Not Working
- Use Gmail with "App Passwords" not regular password
- Enable "Less secure apps" if using regular Gmail
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`

### Permission Denied Errors
- Check user role (student/teacher/admin)
- Ensure JWT token is valid and not expired
- Verify Authorization header format: `Bearer <token>`

## Performance Tips
- Use database indexing for frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Monitor logs in `/logs` directory

## Security Best Practices
- Never commit `.env` file
- Change `JWT_SECRET` in production
- Use HTTPS in production
- Validate all input data
- Implement rate limiting
- Add CORS restrictions as needed
