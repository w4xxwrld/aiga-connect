#!/bin/bash

echo "🚀 Starting AIGA Connect Backend with ngrok tunnel..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start the backend server
echo "📡 Starting backend server on port 8000..."
cd backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 8000 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

echo ""
echo "✅ Backend is now accessible from anywhere!"
echo "🌍 Check your ngrok URL at: http://localhost:4040"
echo "📚 API Documentation will be available at: <ngrok-url>/docs"
echo ""
echo "📱 To update your frontend with the ngrok URL:"
echo "   1. Go to http://localhost:4040"
echo "   2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
echo "   3. Run: node update-frontend-config.js <your-ngrok-url>"
echo ""
echo "🔄 Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait 