#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
cd /app/packages/database && npx prisma migrate deploy

# Seed database only if no admin user exists (first deployment)
echo "Checking if database needs seeding..."
NEEDS_SEED=$(cd /app/packages/database && node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.user.findFirst({ where: { role: 'ADMIN' } })
    .then(u => { p.\$disconnect(); console.log(u ? 'no' : 'yes'); })
    .catch(() => { p.\$disconnect(); console.log('yes'); });
")

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "Running database seed..."
  cd /app/packages/database && npx ts-node prisma/seed.ts
  echo "Database seeded successfully."
else
  echo "Database already seeded, skipping."
fi

echo "Starting API..."
cd /app && node apps/api/dist/main.js &

echo "Starting Web..."
cd /app/web-standalone && HOSTNAME=0.0.0.0 node apps/web/server.js &

echo "Starting nginx..."
nginx -g "daemon off;"
