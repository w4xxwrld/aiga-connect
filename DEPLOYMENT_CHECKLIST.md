# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment
- [ ] All code is committed to GitHub
- [ ] Database migrations are ready
- [ ] Environment variables are prepared
- [ ] Frontend configuration is ready to update

## 🎯 Choose Your Platform

### Option 1: Railway (Recommended)
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up with GitHub
- [ ] Create new project from GitHub repo
- [ ] Add PostgreSQL database
- [ ] Set environment variables:
  ```
  SECRET_KEY=your-super-secret-key-here
  DATABASE_URL=postgresql://user:pass@host:port/db
  ALEMBIC_DATABASE_URL=postgresql://user:pass@host:port/db
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=60
  ```
- [ ] Deploy!

### Option 2: Render
- [ ] Go to [render.com](https://render.com)
- [ ] Create new Web Service
- [ ] Connect GitHub repo
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add PostgreSQL database
- [ ] Set environment variables (same as Railway)
- [ ] Deploy!

## 🔧 Post-Deployment
- [ ] Get your deployed URL (e.g., `https://my-app.railway.app`)
- [ ] Test the API: `https://your-url/docs`
- [ ] Update frontend configuration:
  ```bash
  node update-frontend-config.js https://your-deployed-url
  ```
- [ ] Test frontend with new backend
- [ ] Seed database if needed: `python add_missing_data.py`

## 🧪 Testing
- [ ] Health check endpoint works
- [ ] API documentation loads
- [ ] Database migrations ran successfully
- [ ] Frontend can connect to backend
- [ ] Authentication works
- [ ] All features work as expected

## 📱 Frontend Deployment (Optional)
- [ ] Deploy frontend to Expo/EAS
- [ ] Update app configuration
- [ ] Test on real devices

## 🎉 Done!
Your backend is now accessible from anywhere! 🌍 