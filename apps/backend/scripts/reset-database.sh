#!/bin/bash

echo "⚠️  WARNING: This will delete all data in the database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Drop and recreate the database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS fitness_db;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE fitness_db;"

echo "✅ Database reset complete"
echo "Now run: npm run migration:run"