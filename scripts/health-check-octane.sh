#!/bin/bash

# TurfMate Octane Health Check Script
# This script monitors the health of the Octane server and restarts it if needed

set -e

# Configuration
APP_DIR="/var/www/turfmate"
HEALTH_CHECK_URL="http://127.0.0.1:8000/health"
MAX_RETRIES=3
RETRY_DELAY=5

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

# Function to check if Octane is running
check_octane_status() {
    php artisan octane:status | grep -q "Octane server is running"
}

# Function to check application health
check_app_health() {
    if command -v curl &> /dev/null; then
        curl -f -s "$HEALTH_CHECK_URL" > /dev/null
    else
        wget -q --spider "$HEALTH_CHECK_URL"
    fi
}

# Function to restart Octane
restart_octane() {
    print_warning "Restarting Octane server..."

    # Stop the server
    php artisan octane:stop || true

    # Wait for it to stop
    sleep 3

    # Start the server
    php artisan octane:start \
        --server=frankenphp \
        --host=127.0.0.1 \
        --port=8000 \
        --workers=4 \
        --max-requests=1000 \
        --daemonize

    # Wait for it to start
    sleep 5
}

# Main health check logic
main() {
    echo "🏥 TurfMate Octane Health Check - $(date)"

    # Check if Octane process is running
    if ! check_octane_status; then
        print_error "Octane server is not running"
        restart_octane

        # Verify restart was successful
        if check_octane_status; then
            print_status "Octane server restarted successfully"
        else
            print_error "Failed to restart Octane server"
            exit 1
        fi
    else
        print_status "Octane server is running"
    fi

    # Check application health endpoint
    for i in $(seq 1 $MAX_RETRIES); do
        if check_app_health; then
            print_status "Application health check passed"
            break
        else
            print_warning "Health check attempt $i/$MAX_RETRIES failed"

            if [ $i -eq $MAX_RETRIES ]; then
                print_error "All health check attempts failed"
                restart_octane

                # Final health check after restart
                sleep 5
                if check_app_health; then
                    print_status "Application is healthy after restart"
                else
                    print_error "Application still unhealthy after restart"
                    exit 1
                fi
            else
                sleep $RETRY_DELAY
            fi
        fi
    done

    # Display server metrics
    echo ""
    echo "📊 Server Metrics:"
    php artisan octane:status

    print_status "Health check completed successfully"
}

# Change to application directory
cd "$APP_DIR" || {
    print_error "Could not change to application directory: $APP_DIR"
    exit 1
}

# Run the main function
main
