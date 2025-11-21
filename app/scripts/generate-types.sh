#!/bin/bash

# Script to generate TypeScript types from the backend OpenAPI spec
# This script should be run from the app directory

set -e

echo "🔄 Generating TypeScript types from backend API..."

# Step 1: Export OpenAPI schema from backend
echo "📝 Exporting OpenAPI schema from backend..."
cd ../backend

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python3 export_openapi.py

# Step 2: Generate TypeScript types from OpenAPI schema
echo "🔧 Generating TypeScript types..."
cd ../app
npx openapi-typescript ../backend/openapi.json -o src/types/api.ts

echo "✅ TypeScript types generated successfully at src/types/api.ts"
