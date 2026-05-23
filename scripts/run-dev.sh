#!/bin/bash
# Get the root directory of the project (parent of scripts folder)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking environment file .env.dev..."
if [ ! -f .env.dev ]; then
    echo "Warning: .env.dev file not found!"
    if [ -f .env.dev.example ]; then
        echo "Copying from .env.dev.example to .env.dev..."
        cp .env.dev.example .env.dev
        echo "Please verify and update .env.dev as needed before running."
    else
        echo "Error: .env.dev.example file not found!"
        exit 1
    fi
fi

echo "Starting development environment using Docker Compose..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
