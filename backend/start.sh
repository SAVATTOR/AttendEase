#!/bin/bash
# Startup script that applies migration and starts the server

echo "🚀 Starting Attendance System Backend..."

# Apply migration (will skip if already applied)
echo "📦 Applying database migration..."
npm run prisma:apply-email-migration || echo "⚠️  Migration check completed (may already be applied)"

# Start the server
echo "▶️  Starting server..."
node server.js

