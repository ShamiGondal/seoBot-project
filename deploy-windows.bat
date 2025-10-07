@echo off
echo Deploying SEO PR Bot to Heroku...
echo.

REM Set Heroku CLI path
set PATH=%PATH%;C:\Program Files\Heroku\bin

REM Check if Heroku CLI is available
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Heroku CLI not found. Please install it first.
    pause
    exit /b 1
)

REM Login to Heroku
echo Logging in to Heroku...
heroku login --interactive

REM Check if we're logged in
heroku auth:whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Not logged in to Heroku. Please login first.
    pause
    exit /b 1
)

REM Set up the app
echo Setting up Heroku app...
heroku git:remote -a seo-pr-bot-app

REM Deploy
echo Deploying to Heroku...
git push heroku main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Deployment successful!
    echo 🌐 Your app is available at: https://seo-pr-bot-app-e89de5878ec1.herokuapp.com/
    echo.
    echo Useful commands:
    echo - View logs: heroku logs --tail -a seo-pr-bot-app
    echo - Open app: heroku open -a seo-pr-bot-app
    echo - Check status: heroku ps -a seo-pr-bot-app
) else (
    echo.
    echo ❌ Deployment failed. Check the error messages above.
)

pause
