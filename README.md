# Face Recognition Attendance System

A full-stack attendance system with:
- Frontend: React + Vite
- Backend: Node.js + Express + MongoDB
- Face Service: Python Flask + InsightFace (ArcFace)

## 1. Clone Repository

```bash
git clone <your-repo-url>
cd "FACE RECOGNITION ATTENDANCE SYSTEM"
```

## 2. Backend Setup

```bash
cd backend
npm install
```

Create or update `backend/.env`:

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

Run backend:

```bash
npm run dev
```

## 3. Python Service Setup

From project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r python-service/requirements.txt
```

Run Python service:

```bash
cd python-service
python app.py
```

Health check:

```bash
curl http://127.0.0.1:5001/health
```

## 4. Frontend Setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Run frontend:

```bash
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health: http://127.0.0.1:3001/health

## 5. Recommended Run Order

1. Start Python service
2. Start Backend service
3. Start Frontend service

## 6. Notes

- On first Python startup, InsightFace model download may take time.
- If port 3001 is busy, stop existing process before running backend.
- Re-register face samples after major face-engine changes.
