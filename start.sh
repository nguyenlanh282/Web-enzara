#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
cd /app/packages/database && npx prisma migrate deploy

# Seed database only if no admin user exists (first deployment)
echo "Checking if database needs seeding..."
cd /app/packages/database
if node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findFirst({where:{role:'ADMIN'}}).then(u=>{p.\$disconnect().then(()=>{process.exit(u?0:1)})}).catch(()=>{process.exit(1)})" 2>/dev/null; then
  echo "Database already seeded, skipping."
else
  echo "Running database seed..."
  npx ts-node prisma/seed.ts
  echo "Database seeded successfully."
fi

echo "Starting API..."
cd /app && node apps/api/dist/main.js &

echo "Starting Web..."
cd /app/web-standalone && HOSTNAME=0.0.0.0 node apps/web/server.js &

echo "Starting nginx..."
nginx -g "daemon off;"
