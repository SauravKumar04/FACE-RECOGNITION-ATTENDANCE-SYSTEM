# 🎯 Face Recognition Attendance System

<p align="left">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Express%205-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Face%20Service-Flask%20%2B%20InsightFace-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
</p>

A full-stack attendance platform with student/admin portals, JWT auth, face registration, and face-verified attendance marking.

## ✨ Features (Verified From Code)

### 👨‍🎓 Student Features
- Register and login with email/password.
- Update profile (name, phone, bio, profile image).
- Register exactly 5 face images for Face ID.
- Submit Face ID change request.
- Mark attendance with live webcam verification.
- View day-wise attendance history and dashboard summary.

### 🛡️ Admin Features
- Admin login using environment-configured credentials.
- View/filter students by department.
- View student profile + attendance details.
- Approve or reject Face ID change requests.
- Remove student records.

### 🤖 Face Service Features
- Face embedding registration and storage as `.npy` samples.
- Face recognition with similarity scoring.
- User-specific face verification endpoint (`/verify-user`).
- Passive liveness quality checks:
  - Detection confidence
  - Face area ratio
  - Sharpness
  - Brightness range

### 🔐 Platform Features
- Role-based route guards (`student`, `admin`).
- JWT auth with request interceptor in frontend.
- Centralized API error handling in backend.
- Health endpoints for backend and python service.

## 🧩 Data Models

### 1) Student (`backend/src/models/Student.js`)
- Identity: `regNumber`, `roll`, `department`, `email`, `password`
- Profile: `fullName`, `phone`, `bio`, `profileImage`
- Face: `faceImages[]`, `faceVerified`, `allowFaceReregistration`
- Attendance: embedded `attendance[]` with `date`, `status`, `markedAt`

### 2) Request (`backend/src/models/Request.js`)
- `studentId` (ref to Student)
- `type` (`FACE_ID_CHANGE`)
- `status` (`PENDING`, `APPROVED`, `REJECTED`)

### 3) Employee (`backend/models/Employee.js`) [Legacy Module Present]
- Employee profile + role fields
- Face metadata (`faceRegistered`, `faceSamples`, `faceImages`)

### 4) Attendance (`backend/models/Attendance.js`) [Legacy Module Present]
- `employee`, `employeeId`, `date`
- `checkIn`, `checkOut`, `status`, `workingHours`, `confidence`

## 🛠️ Tech Stack and What Each One Does Here

| Tech | Key Use In This Project |
|---|---|
| React 19 + React Router | Multi-page SPA with protected student/admin flows |
| Vite | Fast frontend build and dev server |
| Axios | API client with auth token + 401 handling |
| React Webcam | Camera capture for face registration/attendance |
| React Toastify | User notifications for success/error actions |
| Express 5 | REST APIs for auth, student, admin, attendance, requests |
| Mongoose | MongoDB schemas, validation, indexing, and queries |
| JWT (`jsonwebtoken`) | Auth tokens and role-aware backend guards |
| `express-validator` | Input validation for auth/profile/face payloads |
| ImageKit | Upload and host student face/profile images |
| Flask | Face microservice API (`/register`, `/recognize`, `/verify-user`) |
| InsightFace + ONNX Runtime | Face detection + embeddings + matching |
| OpenCV + Pillow + NumPy | Image decode, preprocessing, quality checks, vector math |

## 📁 Folder Structure (Current)

```text
FACE RECOGNITION ATTENDANCE SYSTEM/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js                       # legacy auth middleware
│   ├── models/                           # legacy models
│   │   ├── Attendance.js
│   │   └── Employee.js
│   ├── routes/                           # legacy route set
│   │   ├── admin.js
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   └── employees.js
│   └── src/                              # active backend app mounted by server.js
│       ├── app.js
│       ├── config/
│       │   ├── db.js
│       │   └── imagekit.js
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── attendanceController.js
│       │   ├── authController.js
│       │   ├── requestController.js
│       │   └── studentController.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   └── validate.js
│       ├── models/
│       │   ├── Request.js
│       │   └── Student.js
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── attendanceRoutes.js
│       │   ├── authRoutes.js
│       │   ├── requestRoutes.js
│       │   └── studentRoutes.js
│       └── utils/
│           ├── date.js
│           └── jwt.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── api/axios.js
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── LoadingPulse.jsx
│       │   ├── StatCard.jsx
│       │   └── WebcamCapture.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ToastContext.jsx
│       ├── pages/
│       │   ├── AdminDashboard.jsx
│       │   ├── AttendanceReportPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── EmployeesPage.jsx           # legacy/extra page present
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── MarkAttendancePage.jsx
│       │   ├── MyAttendancePage.jsx        # legacy/extra page present
│       │   ├── ProfilePage.jsx
│       │   ├── RegisterFacePage.jsx
│       │   ├── RegisterFacePageNew.jsx     # legacy/extra page present
│       │   ├── RegisterPage.jsx
│       │   └── RequestsPage.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
├── python-service/
│   ├── app.py
│   ├── requirements.txt
│   ├── runtime.txt
│   └── registered_faces/
└── Clone.md
```

## 🚀 Quick Start

### 1) Backend
```bash
cd backend
npm install
npm run dev
```

### 2) Python Face Service
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r python-service/requirements.txt
cd python-service
python app.py
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Required Environment Variables

### backend/.env
```env
PORT=3001
MONGODB_URI=<your_mongodb_uri>
JWT_SECRET=<your_secret>
CLIENT_URL=http://localhost:5173
PYTHON_SERVICE_URL=http://127.0.0.1:5001

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456

IMAGEKIT_PUBLIC_KEY=<your_imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<your_imagekit_private_key>
IMAGEKIT_URL_ENDPOINT=<your_imagekit_url_endpoint>
```

### frontend/.env
```env
VITE_API_URL=http://localhost:3001/api
```

## 🩺 Health Checks
- Backend: `GET /health`
- Python service: `GET /health`

---

Built for face-driven attendance workflows with clear student/admin separation and production-style API boundaries.
