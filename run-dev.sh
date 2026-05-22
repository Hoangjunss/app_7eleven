#!/bin/bash
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
docker compose --env-file .env.dev up --build
