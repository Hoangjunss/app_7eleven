@echo off
echo Checking environment file .env.dev...
if not exist .env.dev (
    echo Warning: .env.dev file not found!
    if exist .env.dev.example (
        echo Copying from .env.dev.example to .env.dev...
        copy .env.dev.example .env.dev
        echo Please verify and update .env.dev as needed before running.
    ) else (
        echo Error: .env.dev.example file not found!
        exit /b 1
    )
)

echo Starting development environment using Docker Compose...
docker compose --env-file .env.dev up --build
