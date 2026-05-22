#!/bin/bash
echo "Checking environment file .env.prod..."
if [ ! -f .env.prod ]; then
    echo "Warning: .env.prod file not found!"
    if [ -f .env.prod.example ]; then
        echo "Copying from .env.prod.example to .env.prod..."
        cp .env.prod.example .env.prod
        echo "Please verify and update .env.prod with secure values before running."
    else
        echo "Error: .env.prod.example file not found!"
        exit 1
    fi
fi

echo "Starting production environment using Docker Compose (detached mode)..."
docker compose --env-file .env.prod up --build -d
