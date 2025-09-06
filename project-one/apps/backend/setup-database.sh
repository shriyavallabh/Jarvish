#!/bin/bash

# Database Setup Script for Jarvish Platform
# This script sets up PostgreSQL locally for development

echo "🚀 Jarvish Database Setup"
echo "========================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "Please install PostgreSQL first:"
    echo ""
    echo "On macOS:"
    echo "  brew install postgresql"
    echo "  brew services start postgresql"
    echo ""
    echo "On Ubuntu/Debian:"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    echo "  sudo systemctl start postgresql"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Database configuration
DB_NAME="jarvish_db"
DB_USER="jarvish_user"
DB_PASS="jarvish_pass"

# Create database and user
echo ""
echo "Creating database and user..."

# Create user and database using psql
psql -U postgres <<EOF
-- Create user if not exists
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE usename = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
   END IF;
END
\$do\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the database and grant schema permissions
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully"
else
    echo "⚠️  Database setup completed with warnings (database might already exist)"
fi

# Update .env file if needed
if [ ! -f .env ]; then
    cp .env.local .env
    echo "✅ Created .env file from .env.local"
fi

# Run Prisma migrations
echo ""
echo "Running Prisma migrations..."
npx prisma generate
npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

# Seed initial data (optional)
echo ""
echo "Would you like to seed the database with sample data? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    npm run seed 2>/dev/null || echo "⚠️  No seed script found. Skipping..."
fi

echo ""
echo "================================"
echo "✨ Database setup complete!"
echo ""
echo "Connection Details:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Host: localhost"
echo "  Port: 5432"
echo ""
echo "Connection String:"
echo "  postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
echo ""
echo "You can now run: npm run dev"
echo "================================"