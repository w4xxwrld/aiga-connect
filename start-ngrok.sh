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

# Wait for ngrok to start and get the URL
sleep 5

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ "$NGROK_URL" != "null" ] && [ "$NGROK_URL" != "" ]; then
    echo ""
    echo "✅ Backend is now accessible from anywhere!"
    echo "🌍 Public URL: $NGROK_URL"
    echo "📚 API Documentation: $NGROK_URL/docs"
    echo ""
    echo "📱 To update your frontend, run:"
    echo "   node update-frontend-config.js $NGROK_URL"
    echo ""
    echo "🔄 Press Ctrl+C to stop both servers"
    echo ""
    
    # Update frontend config automatically
    echo "🤖 Updating frontend configuration automatically..."
    node update-frontend-config.js $NGROK_URL
    
    echo "✅ Frontend configuration updated!"
    echo "📱 Your mobile app can now connect to the backend from anywhere!"
else
    echo "❌ Failed to get ngrok URL. Please check if ngrok is running properly."
    cleanup
fi

# Wait for user to stop
wait 