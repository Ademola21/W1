#!/bin/bash
# Start PostgreSQL server locally
pg_ctl -D database/data -l database/logfile start

# Wait for server to start
sleep 2

# Create database if it doesn't exist
psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'cenimax'" | grep -q 1 || psql -d postgres -c "CREATE DATABASE cenimax"

echo "PostgreSQL is running locally on port 5432"
echo "Database: cenimax"
echo "Connection: postgresql://localhost:5432/cenimax"
