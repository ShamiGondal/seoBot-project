#!/bin/bash

# SEO PR Bot - Heroku Deployment Script
# This script automates the Heroku deployment process

set -e  # Exit on any error

echo "🚀 SEO PR Bot - Heroku Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed. Please install it first:"
    echo "https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

print_status "Heroku CLI found"

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    print_warning "Please log in to Heroku first:"
    echo "heroku login"
    exit 1
fi

print_status "Logged in to Heroku"

# Get app name from user
read -p "Enter your Heroku app name (or press Enter to create new): " APP_NAME

if [ -z "$APP_NAME" ]; then
    read -p "Enter new app name: " NEW_APP_NAME
    APP_NAME=$NEW_APP_NAME
    echo "Creating new Heroku app: $APP_NAME"
    heroku create $APP_NAME
    print_status "Created new Heroku app: $APP_NAME"
else
    echo "Using existing app: $APP_NAME"
    heroku git:remote -a $APP_NAME
    print_status "Connected to existing app: $APP_NAME"
fi

# Add buildpacks
echo "Adding buildpacks..."
heroku buildpacks:add jontewks/puppeteer -a $APP_NAME
heroku buildpacks:add heroku/nodejs -a $APP_NAME
print_status "Buildpacks added successfully"

# Set environment variables
echo "Setting up environment variables..."

# JWT Secret
read -p "Enter JWT secret (or press Enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    print_status "Auto-generated JWT secret"
fi

heroku config:set JWT_SECRET="$JWT_SECRET" -a $APP_NAME
heroku config:set NODE_ENV="production" -a $APP_NAME
heroku config:set PORT="5000" -a $APP_NAME

print_status "Environment variables set"

# Database setup
echo "Database setup..."
echo "Choose database option:"
echo "1) MongoDB Atlas (Recommended)"
echo "2) Heroku Postgres"
echo "3) Skip for now"

read -p "Enter choice (1-3): " DB_CHOICE

case $DB_CHOICE in
    1)
        read -p "Enter MongoDB Atlas connection string: " MONGODB_URI
        heroku config:set MONGODB_URI="$MONGODB_URI" -a $APP_NAME
        print_status "MongoDB Atlas configured"
        ;;
    2)
        heroku addons:create heroku-postgresql:mini -a $APP_NAME
        print_status "Heroku Postgres addon added"
        ;;
    3)
        print_warning "Skipping database setup. You'll need to configure it later."
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Deploy
echo "Deploying to Heroku..."
git add .
git commit -m "Deploy SEO PR Bot to Heroku" || echo "No changes to commit"

git push heroku main
print_status "Deployment completed!"

# Show app info
echo ""
echo "🎉 Deployment Summary"
echo "==================="
echo "App Name: $APP_NAME"
echo "App URL: https://$APP_NAME.herokuapp.com"
echo ""

# Show useful commands
echo "Useful Commands:"
echo "==============="
echo "View logs: heroku logs --tail -a $APP_NAME"
echo "Open app: heroku open -a $APP_NAME"
echo "Check status: heroku ps -a $APP_NAME"
echo "View config: heroku config -a $APP_NAME"
echo ""

# Test deployment
echo "Testing deployment..."
sleep 5

if curl -s "https://$APP_NAME.herokuapp.com/" > /dev/null; then
    print_status "App is responding successfully!"
    echo "🌐 Your SEO PR Bot is live at: https://$APP_NAME.herokuapp.com"
else
    print_warning "App might still be starting up. Check logs:"
    echo "heroku logs --tail -a $APP_NAME"
fi

echo ""
print_status "Deployment script completed!"
echo "Check the HEROKU_DEPLOYMENT.md file for detailed documentation."
