# 🚀 Quick ngrok Setup Guide

## ⚡ Super Fast Setup (2 minutes!)

### Option 1: Use the Script (Recommended)
```bash
./start-ngrok-simple.sh
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start backend
cd backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start ngrok
ngrok http 8000
```

## 📱 Update Frontend

1. **Get your ngrok URL:**
   - Go to http://localhost:4040
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. **Update frontend configuration:**
   ```bash
   node update-frontend-config.js https://your-ngrok-url.ngrok.io
   ```

3. **Restart your frontend app:**
   ```bash
   cd app
   npx expo start
   ```

## ✅ Benefits of ngrok

- ⚡ **Instant setup** - No deployment needed
- 🌍 **Access from anywhere** - Your phone can connect
- 🔄 **Real-time updates** - Changes reflect immediately
- 🆓 **Free for development** - Perfect for testing
- 📱 **Mobile app ready** - Works with React Native

## 🧪 Testing

1. **Test the API:**
   ```
   https://your-ngrok-url.ngrok.io/docs
   ```

2. **Test from your phone:**
   - Open Expo Go
   - Scan the QR code
   - Your app will now connect to the ngrok URL!

## ⚠️ Important Notes

- **ngrok URLs change** each time you restart ngrok
- **Free tier limitations:** 40 connections/minute
- **Perfect for development** but not for production
- **Keep the terminal open** - ngrok stops when you close it

## 🎯 When to Use ngrok vs Full Deployment

### Use ngrok for:
- ✅ Quick testing
- ✅ Development
- ✅ Mobile app testing
- ✅ Temporary access

### Use full deployment (Railway/Render) for:
- ✅ Production apps
- ✅ Permanent access
- ✅ Better performance
- ✅ No connection limits

## 🚀 Ready to Start?

Just run:
```bash
./start-ngrok-simple.sh
```

Your backend will be accessible from anywhere in 30 seconds! 🎉 