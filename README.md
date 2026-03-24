# Face Recognition Attendance System

A comprehensive college attendance system using facial recognition technology with role-based dashboards for students and administrators.

## Features

### Student Dashboard
- **Personal Attendance Overview**
  - Attendance percentage calculation
  - Present, Late, and Absent day counts
  - Today's attendance status (marked/not marked)
  - Monthly attendance pattern visualization
  - Recent attendance records
- **Face Registration**
  - Register with 5+ different angles for better accuracy
  - Verify identity with email and password before updating
  - View registered face samples in an image gallery
  - Tips for optimal registration

### Admin Dashboard
- **Overview Tab**
  - Total students and departments count
  - Today's attendance statistics
  - Batch-wise summary with attendance percentages
- **Attendance Tab**
  - Filter attendance by date and batch
  - Export attendance reports to CSV
  - Detailed attendance records with timestamps
- **Analytics Tab**
  - Monthly attendance trends
  - Batch performance metrics
  - Attendance pattern analysis

### Core Features
- JWT-based authentication with role separation
- Face recognition via DeepFace AI model
- Toast notifications for user feedback
- Responsive design with Tailwind CSS
- MongoDB for persistent data storage
- Password-protected face image updates

## Technology Stack

### Frontend
- **React 19.2.4** - UI framework
- **React Router 7.13.1** - Client-side routing
- **Tailwind CSS 4.2.2** - Styling
- **Axios** - HTTP client
- **react-toastify 6.x** - Toast notifications
- **Recharts 3.8.0** - Data visualization
- **Lucide React 0.577.0** - Icons
- **date-fns** - Date formatting

### Backend
- **Node.js + Express 5.2.1** - API server
- **MongoDB 9.3.1** - Database
- **Mongoose** - ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **axios** - HTTP requests to Python service

### Python Service
- **Flask** - Lightweight web server
- **DeepFace** - Face recognition model
- **OpenCV** - Image processing

## Project Structure

```
FACE RECOGNITION ATTENDANCE SYSTEM/
├── backend/
│   ├── models/
│   │   ├── Employee.js       # User schema with face data
│   │   └── Attendance.js     # Attendance records
│   ├── routes/
│   │   ├── auth.js           # Authentication & password verification
│   │   ├── employees.js      # Employee management & face registration
│   │   ├── attendance.js     # Attendance tracking & student queries
│   │   └── admin.js          # Admin dashboard endpoints
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── server.js             # Express server setup
│   ├── package.json
│   └── .env                  # Environment variables (create from .env.example)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx      # Student personal dashboard
│   │   │   ├── MarkAttendancePage.jsx # Face recognition attendance
│   │   │   ├── RegisterFacePage.jsx   # Store & manage face images
│   │   │   ├── AdminDashboard.jsx     # Admin statistics & reports
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── WebcamCapture.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # Authentication state
│   │   │   └── ToastContext.jsx       # Toast notifications
│   │   ├── api/
│   │   │   └── axios.js              # API configuration
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env                  # Environment variables (create from .env.example)
└── python-service/
    ├── app.py                # Flask face recognition service
    ├── requirements.txt      # Python dependencies
    └── registered_faces/     # Stored face datasets
```

## Installation & Setup

### Prerequisites
- **Node.js** v16+ with npm
- **Python** 3.8+
- **MongoDB** database (local or Atlas)
- **Git**

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173` (Vite default)

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Face Recognition Attendance
VITE_ENV=development
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance-system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PYTHON_SERVICE_URL=http://localhost:5001
PORT=5000
```

Start the backend:
```bash
npm start
```

Backend API will be at `http://localhost:5000`

### 3. Python Service Setup

```bash
cd python-service
pip install -r requirements.txt
python app.py
```

Python service will run on `http://localhost:5001`

## Usage

### Student Flow

1. **Register Account** - Create account with email & password
2. **Register Face** - Capture 5+ face angles for recognition
   - You'll need to verify with password when updating existing registrations
3. **View Dashboard** - See personal attendance statistics
4. **Mark Attendance** - Use face recognition to mark daily attendance

### Admin Flow

1. **Login** - Use admin-designated email
2. **View Admin Dashboard** - Access overview, attendance, and analytics
3. **Export Reports** - Download attendance records as CSV
4. **Monitor Attendance** - Track class attendance by batch/date

## API Reference

### Authentication Routes (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - Login with email & password
- `POST /verify-password` - Verify password for sensitive operations

### Employee Routes (`/api/employees`)
- `GET /:id/face-data` - Get face registration status & images
- `POST /:id/register-face` - Register/update face with base64 image
- `GET /:id` - Get employee details

### Attendance Routes (`/api/attendance`)
- `POST /mark` - Mark attendance via face recognition
- `GET /student-stats/:employeeId` - Get student attendance statistics
- `GET /student-today/:employeeId` - Get today's status (marked/unmarked)
- `GET /student-monthly/:employeeId` - Get monthly data for charts
- `GET /records/:employeeId` - Get all attendance records

### Admin Routes (`/api/admin`)
- `GET /dashboard-stats` - Overview statistics
- `GET /batch-summary` - Batch-wise attendance summary
- `GET /class-attendance` - Detailed attendance with filters
- `GET /monthly-stats` - Monthly trends

## Key Implementation Details

### Face Image Storage
- Faces are stored as **base64-encoded strings** in MongoDB
- System keeps the **last 5 registered images** per student
- Images can only be updated after password verification
- Base64 format allows easy display in galleries without file storage

### Authentication & Security
- Passwords are hashed using **bcryptjs** (bcrypt rounds: 10)
- JWT tokens stored in browser localStorage
- Protected routes require valid JWT
- Admin operations require admin role verification
- Face update operations require email + password verification

### Face Recognition
- Uses **DeepFace** AI model for face detection & comparison
- Requires `registered_faces/` directory for training data
- Python service returns similarity metrics and enrollment status
- Images are validated before storage

### Attendance Logic
- Marks attendance only once per day per student
- Records include timestamp, location (if available), and status
- Status can be: On-Time, Late (after cutoff), or Absent
- Students can only view their own attendance
- Admins can view all attendance with filtering

## Configuration

### Changing Recommended Face Samples
In `RegisterFacePage.jsx`, modify:
```javascript
const RECOMMENDED_SAMPLES = 5; // Change this value
```

### Email Configuration for Admin Alerts
Add admin email detection in backend by setting `isAdminEmail` in Employee document:
```javascript
employee.isAdminEmail = true;
employee.adminAccessLevel = "full"; // or "classroom", "department"
```

### MongoDB Indexes
Recommended indexes for performance:
```javascript
// In MongoDB shell or Compass
db.employees.createIndex({ email: 1 }, { unique: true })
db.employees.createIndex({ employeeId: 1 }, { unique: true })
db.attendances.createIndex({ employeeId: 1, date: 1 })
db.attendances.createIndex({ date: 1 })
```

## Troubleshooting

### "Face recognition service unavailable"
- Ensure Python service is running on `http://localhost:5001`
- Check `PYTHON_SERVICE_URL` in backend `.env`
- Verify no port conflicts

### "Email verification failed"
- Ensure email matches exactly (case-sensitive)
- Password must be correct
- Account must be logged in before attempting update

### "Face registration not storing images"
- Clear browser cache (localStorage)
- Ensure MongoDB has write permissions
- Check base64 image data is being sent (check network tab)
- Verify `faceImages` array in Employee model was migrated

### Attendance not syncing between services
- Verify all three services are running
- Check internet connectivity between services
- Review error logs in respective services
- Ensure MongoDB connection is stable

## Development Notes

### Adding New Admin Features
1. Create endpoint in `/backend/routes/admin.js`
2. Check `req.user.role === "admin"` before returning data
3. Create corresponding frontend component
4. Add route in `App.jsx` with admin guard
5. Test with admin-designated email account

### Modifying Face Registration Flow
1. Update `RegisterFacePage.jsx` UI
2. Modify `/api/employees/:id/register-face` endpoint if needed
3. Update Python service's face enrollment logic
4. Test with various image angles and lighting

### Enhancing Attendance Tracking
1. Add new fields to `Attendance.js` model
2. Create new attendance query endpoints
3. Update student/admin dashboard components
4. Migrate existing documents with default values

## Future Enhancements

- [ ] Email notifications for low attendance students
- [ ] Batch-based automatic attendance cutoff
- [ ] Mobile app for on-the-go attendance
- [ ] Real-time attendance statistics webhooks
- [ ] Automated backup & export system
- [ ] Multi-factor authentication (2FA)
- [ ] Liveness detection to prevent spoofing
- [ ] Attendance appeals & approval workflow
- [ ] Integration with college ERP systems
- [ ] SMS notifications for parents

## License

This project is created for educational purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review server logs in respective service terminals
3. Ensure all environment variables are correctly set
4. Verify network connectivity between services

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Created for:** College Attendance Management System
