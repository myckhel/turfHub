#!/bin/bash

# TurfHub API Test Runner
# This script runs comprehensive API tests using Newman (Postman CLI)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COLLECTION_DIR="./postman"
REPORTS_DIR="./postman/reports"
ENVIRONMENT="TurfHub-Development.postman_environment.json"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🚀 TurfHub API Test Suite${NC}"
echo -e "${BLUE}========================${NC}"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${RED}❌ Newman is not installed. Please install it using:${NC}"
    echo -e "${YELLOW}   npm install -g newman${NC}"
    echo -e "${YELLOW}   npm install -g newman-reporter-htmlextra${NC}"
    exit 1
fi

# Check if collection files exist
if [ ! -f "$COLLECTION_DIR/TurfHub-API-Collection.json" ]; then
    echo -e "${RED}❌ Collection file not found: $COLLECTION_DIR/TurfHub-API-Collection.json${NC}"
    exit 1
fi

if [ ! -f "$COLLECTION_DIR/$ENVIRONMENT" ]; then
    echo -e "${RED}❌ Environment file not found: $COLLECTION_DIR/$ENVIRONMENT${NC}"
    exit 1
fi

# Function to run tests with different configurations
run_test_suite() {
    local suite_name=$1
    local collection_file=$2
    local additional_options=$3

    echo -e "\n${YELLOW}🧪 Running $suite_name...${NC}"

    newman run "$COLLECTION_DIR/$collection_file" \
        --environment "$COLLECTION_DIR/$ENVIRONMENT" \
        --reporters cli,htmlextra,json \
        --reporter-htmlextra-export "$REPORTS_DIR/${suite_name}-report.html" \
        --reporter-json-export "$REPORTS_DIR/${suite_name}-results.json" \
        --delay-request 100 \
        --timeout-request 10000 \
        --timeout-script 5000 \
        $additional_options \
        || echo -e "${RED}❌ $suite_name failed${NC}"
}

# Function to check API health
check_api_health() {
    echo -e "${YELLOW}🏥 Checking API health...${NC}"

    # Get base URL from environment file
    BASE_URL=$(cat "$COLLECTION_DIR/$ENVIRONMENT" | jq -r '.values[] | select(.key=="base_url") | .value')

    if [ "$BASE_URL" = "null" ] || [ -z "$BASE_URL" ]; then
        BASE_URL="http://localhost:8000"
    fi

    # Check if API is accessible
    if curl -s --connect-timeout 5 "$BASE_URL/api/users" > /dev/null; then
        echo -e "${GREEN}✅ API is accessible at $BASE_URL${NC}"
    else
        echo -e "${RED}❌ API is not accessible at $BASE_URL${NC}"
        echo -e "${YELLOW}💡 Make sure your Laravel development server is running:${NC}"
        echo -e "${YELLOW}   php artisan serve${NC}"
        exit 1
    fi
}

# Function to generate summary report
generate_summary() {
    echo -e "\n${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}===============${NC}"

    if [ -f "$REPORTS_DIR/basic-suite-results.json" ]; then
        local total_tests=$(cat "$REPORTS_DIR/basic-suite-results.json" | jq '.run.stats.tests.total')
        local failed_tests=$(cat "$REPORTS_DIR/basic-suite-results.json" | jq '.run.stats.tests.failed')
        local passed_tests=$((total_tests - failed_tests))

        echo -e "Total Tests: $total_tests"
        echo -e "${GREEN}Passed: $passed_tests${NC}"
        echo -e "${RED}Failed: $failed_tests${NC}"

        if [ "$failed_tests" -eq 0 ]; then
            echo -e "\n${GREEN}🎉 All tests passed!${NC}"
        else
            echo -e "\n${RED}⚠️  Some tests failed. Check the HTML reports for details.${NC}"
        fi
    fi

    echo -e "\n${BLUE}📁 Reports generated in: $REPORTS_DIR${NC}"
    echo -e "   - HTML Report: basic-suite-report.html"
    echo -e "   - JSON Results: basic-suite-results.json"

    # Open HTML report if on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "\n${YELLOW}💡 Opening HTML report...${NC}"
        open "$REPORTS_DIR/basic-suite-report.html"
    fi
}

# Function to validate environment setup
validate_environment() {
    echo -e "${YELLOW}🔍 Validating environment setup...${NC}"

    # Check if base_url is set correctly
    BASE_URL=$(cat "$COLLECTION_DIR/$ENVIRONMENT" | jq -r '.values[] | select(.key=="base_url") | .value')
    echo -e "Base URL: $BASE_URL"

    # Check if essential variables are present
    local required_vars=("base_url" "api_version")
    for var in "${required_vars[@]}"; do
        local value=$(cat "$COLLECTION_DIR/$ENVIRONMENT" | jq -r ".values[] | select(.key==\"$var\") | .value")
        if [ "$value" = "null" ] || [ -z "$value" ]; then
            echo -e "${RED}❌ Missing required environment variable: $var${NC}"
        else
            echo -e "${GREEN}✅ $var: $value${NC}"
        fi
    done
}

# Main execution
main() {
    case "${1:-all}" in
        "health")
            check_api_health
            ;;
        "validate")
            validate_environment
            ;;
        "basic")
            check_api_health
            validate_environment
            run_test_suite "basic-suite" "TurfHub-API-Collection.json"
            generate_summary
            ;;
        "complete")
            check_api_health
            validate_environment
            run_test_suite "complete-suite" "TurfHub-Complete-Collection.json" "--delay-request 200"
            generate_summary
            ;;
        "all")
            check_api_health
            validate_environment
            run_test_suite "basic-suite" "TurfHub-API-Collection.json"
            run_test_suite "complete-suite" "TurfHub-Complete-Collection.json" "--delay-request 200"
            generate_summary
            ;;
        "help")
            echo -e "${BLUE}TurfHub API Test Runner${NC}"
            echo -e "Usage: $0 [command]"
            echo -e ""
            echo -e "Commands:"
            echo -e "  health     - Check API health"
            echo -e "  validate   - Validate environment setup"
            echo -e "  basic      - Run basic test suite"
            echo -e "  complete   - Run complete test suite"
            echo -e "  all        - Run all test suites (default)"
            echo -e "  help       - Show this help message"
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo -e "Use '$0 help' for available commands."
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}⚠️  Test execution interrupted${NC}"; exit 1' INT TERM

# Run main function with all arguments
main "$@"
