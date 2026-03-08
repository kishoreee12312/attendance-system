# Free Cloud Deploy (Atlas + Render)

This project is prepared for free deployment using:
- MongoDB Atlas (free M0 cluster)
- Render (free web service + static site)

## 1) Push code to GitHub
From project root:

```powershell
git init
git add .
git commit -m "Prepare free cloud deploy"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 2) Create free MongoDB Atlas cluster
1. Create a free M0 cluster.
2. Create a DB user and password.
3. In Network Access, allow `0.0.0.0/0` for testing (or restrict to Render egress if preferred).
4. Copy the connection string and replace `<password>` and DB name.

## 3) Deploy via Render Blueprint
1. In Render dashboard, choose **New +** -> **Blueprint**.
2. Select your GitHub repo.
3. Render will detect `render.yaml` and create:
   - `attendance-backend` (Node web service)
   - `attendance-frontend` (static site)

## 4) Set required environment variables
In Render:

### Backend service (`attendance-backend`)
- `MONGO_URI` = Atlas connection string
- `JWT_SECRET` = strong random secret
- `CLIENT_ORIGIN` = frontend URL from Render (for example `https://attendance-frontend.onrender.com`)
- Optional: `EMAIL_USER`, `EMAIL_PASS`

### Frontend service (`attendance-frontend`)
- `REACT_APP_API_URL` = backend API URL + `/api`
  - Example: `https://attendance-backend.onrender.com/api`

## 5) Redeploy
After setting env vars, redeploy both services.

## 6) Create initial users (admin/faculty)
Open Render shell for backend (or run locally against Atlas):

```powershell
cd backend
npm run create-admin
npm run create-faculty
```

## 7) Test on mobile
1. Open the frontend Render URL on mobile browser.
2. Login and test dashboards.

## Notes
- Free services may sleep after inactivity; first request can be slow.
- Keep `CLIENT_ORIGIN` and `REACT_APP_API_URL` aligned.
