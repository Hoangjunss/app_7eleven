@echo off
cd /d "%~dp0\.."

echo Checking environment file .env.prod...
if not exist .env.prod (
    echo Warning: .env.prod file not found!
    if exist .env.prod.example (
        echo Copying from .env.prod.example to .env.prod...
        copy .env.prod.example .env.prod
        echo Please verify and update .env.prod as needed before running.
    ) else (
        echo Error: .env.prod.example file not found!
        exit /b 1
    )
)

echo Starting production environment using Docker Compose (detached)...
docker compose -f docker-compose.yml --env-file .env.prod up --build -d
pause
