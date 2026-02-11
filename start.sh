#!/bin/sh

echo "=== Running prisma migrate deploy ==="
cd /app/packages/database
npx prisma migrate deploy || echo "WARNING: Migration failed, continuing anyway..."

# Always run seed (uses upsert, safe to re-run)
echo "=== Running database seed ==="
cd /app/packages/database
npx ts-node prisma/seed.ts || echo "WARNING: Seed failed, continuing anyway..."
echo "Database seed step done."

echo "=== Starting API ==="
cd /app && node apps/api/dist/main.js &

echo "=== Starting Web ==="
cd /app/web-standalone && HOSTNAME=0.0.0.0 node apps/web/server.js &

# Wait for services to be ready
sleep 3

echo "=== Starting nginx ==="
nginx -g "daemon off;"
