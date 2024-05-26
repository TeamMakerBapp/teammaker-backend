#!/bin/bash

if [ ! -d "node_modules" ]; then
  echo "node_modules directory not found. Installing dependencies..."
  npm install
fi

echo "Starting application..."
npm run dev