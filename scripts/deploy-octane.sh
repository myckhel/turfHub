#!/bin/bash

# TurfHub Octane Deployment Script
# This script handles the deployment of TurfHub with Laravel Octane

set -e

echo "🚀 Starting TurfHub Octane Deployment..."

# Configuration
APP_DIR="/var/www/turfmate"
OCTANE_WORKERS=4
MAX_REQUESTS=1000
PORT=8000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    print_error "artisan file not found. Please run this script from the Laravel root directory."
    exit 1
fi

# Update application
print_status "Pulling latest changes..."
git pull origin main

# Install/update dependencies
print_status "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

print_status "Installing Node dependencies..."
yarn install --frozen-lockfile

# Build assets
print_status "Building production assets..."
yarn build

# Clear and cache configurations
print_status "Optimizing Laravel configuration..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Run database migrations
print_status "Running database migrations..."
php artisan migrate --force

# Stop existing Octane server
print_status "Stopping existing Octane server..."
php artisan octane:stop || true

# Wait a moment for the server to stop
sleep 2

# Start Octane server
print_status "Starting Octane server with $OCTANE_WORKERS workers..."
php artisan octane:start \
    --server=frankenphp \
    --host=127.0.0.1 \
    --port=$PORT \
    --workers=$OCTANE_WORKERS \
    --max-requests=$MAX_REQUESTS \
    --daemonize

# Wait for server to start
sleep 3

# Check if Octane is running
if php artisan octane:status | grep -q "Octane server is running"; then
    print_status "Octane server is running successfully!"
else
    print_error "Failed to start Octane server"
    exit 1
fi

# Clear application cache
print_status "Clearing application cache..."
php artisan cache:clear

# Restart queue workers (if using)
print_status "Restarting queue workers..."
php artisan queue:restart

print_status "🎉 TurfHub deployment completed successfully!"
print_status "Server is running on http://127.0.0.1:$PORT"

# Optional: Send deployment notification
# You can add webhook/Slack/Discord notifications here

echo ""
echo "📊 Server Status:"
php artisan octane:status
