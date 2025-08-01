# 🚀 AIGA Connect Backend Deployment Guide

## 📋 Prerequisites
- GitHub repository with your code
- PostgreSQL database (provided by deployment platform)
- Environment variables configured

## 🎯 Recommended Deployment Options

### 1. **Railway** (Recommended - Easiest)
**Pros:** Free tier, automatic deployments, built-in PostgreSQL

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add PostgreSQL database from Railway
6. Set environment variables:
   ```
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgresql://user:pass@host:port/db
   ALEMBIC_DATABASE_URL=postgresql://user:pass@host:port/db
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
7. Deploy!

### 2. **Render** (Popular Alternative)
**Pros:** Free tier, good performance, easy setup

**Steps:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add PostgreSQL database
7. Set environment variables (same as Railway)
8. Deploy!

### 3. **Heroku** (Classic Choice)
**Pros:** Well-established, good documentation

**Steps:**
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
4. Set environment variables:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set DATABASE_URL=$(heroku config:get DATABASE_URL)
   heroku config:set ALEMBIC_DATABASE_URL=$(heroku config:get DATABASE_URL)
   ```
5. Deploy: `git push heroku main`

## 🔧 Environment Variables Required

```bash
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
DATABASE_URL=postgresql://username:password@host:port/database_name
ALEMBIC_DATABASE_URL=postgresql://username:password@host:port/database_name
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## 📱 Update Frontend Configuration

After deployment, update your frontend API configuration:

```typescript
// app/src/config/backend.ts
export const API_BASE_URL = 'https://your-app-name.railway.app'; // or your deployed URL
```

## 🗄️ Database Setup

1. **Create Database Tables:**
   ```bash
   # The deployment will automatically run:
   alembic upgrade head
   ```

2. **Seed Data (Optional):**
   ```bash
   # Run your seeding script after deployment
   python add_missing_data.py
   ```

## 🔍 Testing Your Deployment

1. **Health Check:**
   ```
   GET https://your-app-name.railway.app/health
   ```

2. **API Documentation:**
   ```
   https://your-app-name.railway.app/docs
   ```

## 🚨 Important Notes

1. **CORS Configuration:** Your backend already handles CORS
2. **Database Migrations:** Will run automatically on deployment
3. **Environment Variables:** Make sure to set them in your deployment platform
4. **Frontend Updates:** Update the API base URL in your frontend config

## 🆘 Troubleshooting

### Common Issues:
1. **Database Connection Error:** Check DATABASE_URL format
2. **Migration Errors:** Ensure ALEMBIC_DATABASE_URL is set
3. **CORS Issues:** Backend already configured for CORS
4. **Port Issues:** Use `$PORT` environment variable

### Debug Commands:
```bash
# Check logs
railway logs
# or
heroku logs --tail

# Check environment variables
railway variables
# or
heroku config
```

## 📞 Support

If you encounter issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test database connection
4. Check API endpoints with `/docs` URL 