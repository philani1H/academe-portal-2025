# EduPlatform - Comprehensive Educational Management System

A full-featured educational platform with role-based dashboards for administrators, tutors, and students. Built with Next.js, TypeScript, Prisma, and modern UI components.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Secure Login/Registration** with JWT tokens
- **Role-based Access Control** (Admin, Tutor, Student)
- **Password Reset** functionality
- **Email Verification** and notifications
- **Protected Routes** with automatic redirection

### 👨‍💼 Admin Dashboard
- **System Overview** with real-time statistics
- **User Management** (approve/reject users)
- **Course Management** and oversight
- **Department Management**
- **Content Management System** for website content
- **Notification Management**
- **Analytics and Reporting**

### 👨‍🏫 Tutor Dashboard
- **Course Management** (create, edit, manage courses)
- **Student Management** (track progress, communicate)
- **Assignment Creation** and grading
- **Test Management** and proctoring
- **Performance Analytics**
- **Material Upload** and organization

### 👨‍🎓 Student Dashboard
- **Course Enrollment** and tracking
- **Assignment Submission** and tracking
- **Test Taking** interface
- **Progress Monitoring** and analytics
- **Grade Tracking** and history
- **Material Access** and downloads

### 📧 Email System
- **Welcome Emails** for new users
- **Account Approval** notifications
- **Password Reset** emails
- **Assignment Reminders**
- **Test Notifications**
- **Course Updates**

### 🔔 Notification System
- **Real-time Notifications** across all dashboards
- **Email Notifications** for important events
- **In-app Notification** center
- **Customizable Notification** settings

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Shadcn/ui, Radix UI, Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Email**: Nodemailer
- **File Upload**: Base64 encoding with file validation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eduplatform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   - Database URL
   - JWT secret
   - Email SMTP settings
   - Other required variables

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** (Admin, Tutor, Student roles)
- **Courses** with enrollment system
- **Assignments** and submissions
- **Tests** with questions and grading
- **Materials** (PDFs, videos, documents)
- **Notifications** system
- **Departments** for organization
- **Grades** and progress tracking

## 🚦 Getting Started

### 1. Create Admin Account
First, you'll need to create an admin account. You can do this by:
- Registering through the signup page
- Manually updating the user role in the database

### 2. Access Dashboards
- **Admin**: `/admin/dashboard`
- **Tutor**: `/tutor/dashboard`  
- **Student**: `/student/dashboard`

### 3. Key Features to Test
- **User Registration** and approval workflow
- **Course Creation** and enrollment
- **Assignment Submission** and grading
- **Test Taking** and scoring
- **File Upload** functionality
- **Email Notifications**
- **Real-time Notifications**

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── pages/              # Next.js pages and API routes
│   ├── admin/          # Admin dashboard pages
│   ├── student/        # Student dashboard pages
│   ├── tutor/          # Tutor dashboard pages
│   ├── auth/           # Authentication pages
│   └── api/            # API endpoints
├── services/           # Business logic and API services
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `SMTP_*`: Email configuration
- `NEXT_PUBLIC_APP_URL`: Application URL

### Database Configuration
The application uses PostgreSQL with Prisma ORM. Make sure to:
1. Install PostgreSQL
2. Create a database
3. Update the `DATABASE_URL` in your `.env` file

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Railway
- Heroku
- DigitalOcean
- AWS

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Dashboard Endpoints
- `GET /api/admin/dashboard/stats` - Admin dashboard statistics
- `GET /api/student/dashboard` - Student dashboard data
- `GET /api/tutor/dashboard` - Tutor dashboard data

### Management Endpoints
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/courses` - Course management
- `GET/POST/PUT/DELETE /api/admin/departments` - Department management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version 1.0.0
- Initial release with full functionality
- Complete authentication system
- All three dashboards fully functional
- Email notification system
- File upload capabilities
- Real-time notifications
- Comprehensive API endpoints

---

**Built with ❤️ for education**