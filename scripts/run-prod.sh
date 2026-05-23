#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking environment file .env.prod..."
if [ ! -f .env.prod ]; then
    echo "Warning: .env.prod file not found!"
    if [ -f .env.prod.example ]; then
        echo "Copying from .env.prod.example to .env.prod..."
        cp .env.prod.example .env.prod
        echo "Please verify and update .env.prod as needed before running."
    else
        echo "Error: .env.prod.example file not found!"
        exit 1
    fi
fi

echo "Starting production environment using Docker Compose (detached)..."
# Tip: Remove --build flag if you want to reuse existing images without rebuilding them.
docker compose -f docker-compose.yml --env-file .env.prod up --build -d
