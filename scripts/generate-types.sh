#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if Supabase project ID is set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
  echo "Error: VITE_SUPABASE_PROJECT_ID is not set in .env file"
  exit 1
fi

# Run npm script with environment variables from .env
npm run gen:types

echo "Types generated successfully in src/types/supabase.ts"